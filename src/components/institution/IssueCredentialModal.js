// fileName: IssueCredentialModal.js

import React, { useMemo, useState, useEffect } from 'react';
import './AcademicInstitution.css';
import { uploadCredentialAfterBlockchain } from '../../services/institutionApiService';
import blockchainService from '../../services/blockchainService';

function IssueCredentialModal({
  show,
  onClose,
  credentialTypes,
  students,
  onIssued,
  account,
  dbPublicAddress,
  walletMatches,
}) {
  // Local state moved from parent
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false);
  const [customCredentialType, setCustomCredentialType] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    credentialType: '',
    studentAccount: '',
    credentialFile: null,
  });
  const [showLoaderModal, setShowLoaderModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loaderStatus, setLoaderStatus] = useState('loading'); // 'loading', 'success', 'cancelled'
  const [modalError, setModalError] = useState('');

  // Reset form function
  const resetForm = () => {
    setFormData({ credentialType: '', studentAccount: '', credentialFile: null });
    setShowCustomTypeInput(false);
    setCustomCredentialType('');
    setStudentSearchTerm('');
    setModalError('');
    const fileInput = document.getElementById('credentialFile');
    if (fileInput) fileInput.value = '';
  };

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // Compute filtered students locally for the modal
  const filteredStudents = useMemo(() => {
    if (!studentSearchTerm) {
      return students || [];
    }
    const searchLower = String(studentSearchTerm).toLowerCase();
    return (students || []).filter((student) => {
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
      const studentId = String(student.student_id).toLowerCase();
      return fullName.includes(searchLower) || studentId.includes(searchLower);
    });
  }, [students, studentSearchTerm]);

  // Find selected student for display
  const selectedStudent = useMemo(() => {
    if (!formData.studentAccount) return null;
    return (students || []).find(s => s.id === parseInt(formData.studentAccount));
  }, [students, formData.studentAccount]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'credentialType') {
      if (value === 'other') {
        setShowCustomTypeInput(true);
      } else {
        setShowCustomTypeInput(false);
        setCustomCredentialType('');
      }
    }
    
    // When student is selected, clear search term to show selected student
    if (name === 'studentAccount' && value) {
      setStudentSearchTerm('');
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
    if (uploadMessage) setUploadMessage('');
    if (modalError) setModalError('');
  };

  const handleCustomTypeChange = (e) => {
    setCustomCredentialType(e.target.value);
    if (modalError) setModalError('');
  };

  const handleStudentSearchChange = (e) => {
    setStudentSearchTerm(e.target.value);
    // Only clear selection if search term is empty
    if (e.target.value.trim() === '') {
      setFormData((prev) => ({ ...prev, studentAccount: '' }));
    }
    if (modalError) setModalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    // First check: Wallet verification
    if (!account) {
      setModalError('Please connect your MetaMask wallet before issuing credentials.');
      return;
    }

    if (!walletMatches) {
      setModalError('Wallet mismatch detected! Please switch to the correct MetaMask account that matches your institution\'s registered address before proceeding.');
      return;
    }

    const isCustomType = formData.credentialType === 'other';
    
    // Check each condition individually for better error messages
    if (!isCustomType && !formData.credentialType) {
      setModalError('Please select a credential type');
      return;
    }
    
    if (isCustomType && !customCredentialType.trim()) {
      setModalError('Please enter a custom credential type');
      return;
    }
    
    if (!formData.studentAccount) {
      setModalError('Please select a student');
      return;
    }
    
    if (!formData.credentialFile) {
      setModalError('Please select a file to upload');
      return;
    }

    const loggedInUserId = localStorage.getItem('userId');
    if (!loggedInUserId) {
      setModalError('Please log in again');
      return;
    }

    // Close input modal and show loader modal
    if (typeof onClose === 'function') onClose();
    setShowLoaderModal(true);
    setLoaderStatus('loading');
    setUploading(true);
    setUploadMessage('Preparing transaction...');
    setUploadProgress(0);

    try {
      const selectedStudent = (students || []).find(
        (s) => s.id === parseInt(formData.studentAccount)
      );
      if (!selectedStudent) {
        throw new Error('Selected student not found.');
      }

      // Prepare file hash (no progress bar yet - user hasn't confirmed)
      const fileBuffer = await formData.credentialFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Request blockchain transaction - user can cancel here
      const blockchainResult = await blockchainService.issueCredential(
        fileHash,
        selectedStudent.student_id
      );

      // Only show progress bar AFTER MetaMask confirmation
      setUploadMessage('Issuing credential...');
      setUploadProgress(30); // Start at 30% since blockchain is confirmed

      // Prepare data for the API. It will have either a 'credential_type_id'
      // or a 'custom_type' string, but not both.
      const credentialData = {
        owner_id: parseInt(formData.studentAccount),
        sender_id: parseInt(loggedInUserId),
      };
      if (isCustomType) {
        credentialData.custom_type = customCredentialType.trim();
      } else {
        credentialData.credential_type_id = parseInt(formData.credentialType);
      }

      // Step 2: Upload to IPFS and save to database (70% progress)
      setUploadProgress(70);
      
      const response = await uploadCredentialAfterBlockchain(
        credentialData, 
        formData.credentialFile, 
        blockchainResult.transactionHash
      );

      // Step 3: Complete (100% progress)
      setUploadProgress(100);
      setUploadMessage('Credential issued successfully!');
      setLoaderStatus('success');

      // Notify parent to refresh lists
      if (typeof onIssued === 'function') {
        try {
          await onIssued();
        } catch (e) {
          // ignore refresh errors
        }
      }

      // Auto-close loader after 3 seconds
      setTimeout(() => {
        setShowLoaderModal(false);
      }, 3000);
    } catch (error) {
      // Check if error is from blockchain transaction (user cancellation)
      if (error.message && (
        error.message.includes('User rejected') || 
        error.message.includes('User denied') ||
        error.message.includes('cancelled') ||
        error.message.includes('canceled')
      )) {
        setLoaderStatus('cancelled');
        setUploadMessage('Transaction was cancelled. Nothing was saved.');
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          setShowLoaderModal(false);
        }, 3000);
      } else {
        setLoaderStatus('error');
        setUploadMessage(`Process failed: ${error.message}`);
        
        // Auto-close after 5 seconds for errors
        setTimeout(() => {
          setShowLoaderModal(false);
        }, 5000);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      {/* Input Modal */}
      {show && (
        <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <i className="fas fa-upload me-2"></i>
            Issue New Credential
          </h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          {/* Wallet Status Warning */}
          {(!account || !walletMatches) && (
            <div className="wallet-verification-section" style={{ marginBottom: '1rem' }}>
              <div className="wallet-status-header">
                <i className="fas fa-wallet me-2"></i>
                Wallet Verification
              </div>
              {!account ? (
                <div className="alert alert-warning" role="alert">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>MetaMask Not Connected</strong>
                  <br />
                  Please connect your MetaMask wallet to issue credentials.
                </div>
              ) : !walletMatches ? (
                <div className="alert alert-danger" role="alert">
                  <i className="fas fa-times-circle me-2"></i>
                  <strong>Wallet Mismatch Detected!</strong>
                  <br />
                  <small>
                    Please switch to the correct MetaMask account before proceeding.
                  </small>
                </div>
              ) : null}
            </div>
          )}

          {modalError && (
            <div className="alert alert-danger" role="alert" style={{ marginBottom: '1rem' }}>
              {modalError}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="credentialType" className="form-label">
                <i className="fas fa-certificate me-2"></i>
                Credential Type
              </label>
              <select
                id="credentialType"
                name="credentialType"
                value={formData?.credentialType || ''}
                onChange={handleInputChange}
                className="form-select"
                required={!showCustomTypeInput}
              >
                <option value="">Select Credential Type</option>
                {(credentialTypes || []).map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.type_name}
                  </option>
                ))}
                <option value="other">Other...</option>
              </select>
            </div>

            {showCustomTypeInput && (
              <div className="form-group" style={{ animation: 'fadeIn 0.5s' }}>
                <label htmlFor="customCredentialType" className="form-label">
                  <i className="fas fa-edit me-2"></i>
                  Specify Credential Type
                </label>
                <input
                  type="text"
                  id="customCredentialType"
                  name="customCredentialType"
                  value={customCredentialType || ''}
                  onChange={handleCustomTypeChange}
                  className="form-control"
                  placeholder="e.g., Certificate of Completion"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="studentSearch" className="form-label">
                <i className="fas fa-user me-2"></i>
                Student Account
              </label>
              
              {/* Show selected student with edit option */}
              {selectedStudent ? (
                <div className="selected-student-display p-3 border rounded bg-light d-flex justify-content-between align-items-center">
                  <div className="student-info">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-check me-2 text-success"></i>
                      <strong>{selectedStudent.first_name} {selectedStudent.last_name}</strong>
                      <span className="text-muted ms-2">({selectedStudent.student_id})</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, studentAccount: '' }));
                      setStudentSearchTerm('');
                    }}
                    title="Change student selection"
                  >
                    <i className="fas fa-edit me-1"></i>
                    Change
                  </button>
                </div>
              ) : (
                <>
                  {/* Search input - only show when no student selected */}
                  <input
                    type="text"
                    id="studentSearch"
                    name="studentSearch"
                    value={studentSearchTerm || ''}
                    onChange={handleStudentSearchChange}
                    className="form-control"
                    placeholder="Type student name or ID to search..."
                  />
                  
                  {/* Only show dropdown when user has typed something and no student selected */}
                  {studentSearchTerm && studentSearchTerm.trim().length > 0 && (
                    <div className="student-dropdown-container mt-2" style={{ animation: 'fadeIn 0.3s' }}>
                      <select
                        id="studentAccount"
                        name="studentAccount"
                        value={formData?.studentAccount || ''}
                        onChange={handleInputChange}
                        className="form-select"
                        required
                        size={Math.min(5, Math.max(2, filteredStudents.length))}
                      >
                        {filteredStudents.length === 0 ? (
                          <option value="" disabled>No students found</option>
                        ) : (
                          <>
                            <option value="">Select a student...</option>
                            {filteredStudents.map((student) => (
                              <option key={student.id} value={student.id}>
                                {student.first_name} {student.last_name} ({student.student_id})
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-file-alt me-2"></i>
                Credential Document
              </label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="credentialFile"
                  name="credentialFile"
                  onChange={handleInputChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="file-input"
                  required
                />
                <label htmlFor="credentialFile" className="file-input-label">
                  <i className="fas fa-cloud-upload-alt file-input-icon"></i>
                  {formData?.credentialFile ? 'Change Document' : 'Choose Document to Upload'}
                </label>
              </div>
              {formData?.credentialFile && (
                <div className="selected-file">
                  <i className="fas fa-file-check me-2"></i>
                  Selected: {formData.credentialFile.name}
                </div>
              )}
              <small className="text-muted mt-2 d-block">
                Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
              </small>
            </div>

            <div className="text-center">
              <button type="submit" className="btn-primary-custom">
                <i className="fas fa-check-circle me-2"></i>
                Issue Credential
              </button>
            </div>
          </form>
        </div>
      </div>
        </div>
      )}

      {/* Loader Modal */}
      {showLoaderModal && (
        <div className="modal-overlay">
          <div className="modal-content loader-modal">
            <div className={`modal-header ${
              loaderStatus === 'success' ? 'success-header' : 
              loaderStatus === 'cancelled' ? 'cancel-header' : 
              loaderStatus === 'error' ? 'error-header' : 'loading-header'
            }`}>
              <div className="status-icon">
                {loaderStatus === 'loading' && <i className="fas fa-spinner fa-spin"></i>}
                {loaderStatus === 'success' && <i className="fas fa-check-circle"></i>}
                {loaderStatus === 'cancelled' && <i className="fas fa-times-circle"></i>}
                {loaderStatus === 'error' && <i className="fas fa-exclamation-triangle"></i>}
              </div>
              <h3 className="modal-title">
                {loaderStatus === 'loading' && 'Processing...'}
                {loaderStatus === 'success' && 'Success!'}
                {loaderStatus === 'cancelled' && 'Cancelled'}
                {loaderStatus === 'error' && 'Error'}
              </h3>
            </div>
            <div className="modal-body">
              {loaderStatus === 'loading' && uploadProgress > 0 && (
                <div className="upload-progress-section">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="progress-label">{uploadMessage}</span>
                    <span className="progress-percentage">{uploadProgress}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {loaderStatus === 'loading' && uploadProgress === 0 && (
                <div className="loading-message">
                  <div className="d-flex align-items-center justify-content-center">
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    {uploadMessage}
                  </div>
                </div>
              )}

              {loaderStatus !== 'loading' && (
                <p className="status-message">
                  {uploadMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default IssueCredentialModal;

