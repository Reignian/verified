// fileName: IssueCredentialModal.js

import React, { useMemo, useState } from 'react';
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
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [modalError, setModalError] = useState('');

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

  const resetForm = () => {
    setFormData({ credentialType: '', studentAccount: '', credentialFile: null });
    setShowCustomTypeInput(false);
    setCustomCredentialType('');
    setStudentSearchTerm('');
    const fileInput = document.getElementById('credentialFile');
    if (fileInput) fileInput.value = '';
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

    setUploading(true);
    setUploadMessage('Processing credential details...');

    try {
      const selectedStudent = (students || []).find(
        (s) => s.id === parseInt(formData.studentAccount)
      );
      if (!selectedStudent) {
        throw new Error('Selected student not found.');
      }

      setUploadMessage('Preparing file hash for blockchain...');

      // Create a hash of the file content for blockchain storage
      const fileBuffer = await formData.credentialFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      setUploadMessage('Requesting blockchain transaction...');
      
      // Issue credential on blockchain FIRST - this is where user can cancel
      const blockchainResult = await blockchainService.issueCredential(
        fileHash,
        selectedStudent.student_id
      );

      // Only proceed with file upload if blockchain transaction succeeded
      setUploadMessage('Blockchain confirmed! Uploading document to IPFS...');

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

      // Upload file to IPFS and save to database with blockchain ID
      const response = await uploadCredentialAfterBlockchain(
        credentialData, 
        formData.credentialFile, 
        blockchainResult.credentialId
      );

      setUploadMessage(
        `Success! IPFS: ${response.ipfs_hash} | Blockchain: ${blockchainResult.credentialId} | TX: ${blockchainResult.transactionHash}`
      );

      // Notify parent to refresh lists
      if (typeof onIssued === 'function') {
        try {
          await onIssued();
        } catch (e) {
          // ignore refresh errors
        }
      }

      // Close modal on success
      if (typeof onClose === 'function') onClose();

      // Reset local form after success
      resetForm();
    } catch (error) {
      // Check if error is from blockchain transaction (user cancellation)
      if (error.message && (
        error.message.includes('User rejected') || 
        error.message.includes('User denied') ||
        error.message.includes('cancelled') ||
        error.message.includes('canceled')
      )) {
        setModalError('Transaction was cancelled. No files were uploaded or saved.');
      } else {
        setModalError(`Process failed: ${error.message}`);
      }
    } finally {
      setUploading(false);
      setUploadMessage('');
    }
  };

  if (!show) return null;

  return (
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
              <button type="submit" className="btn-primary-custom" disabled={uploading}>
                {uploading && <div className="loading-spinner"></div>}
                <i className={`fas ${uploading ? '' : 'fa-check-circle'} me-2`}></i>
                {uploading ? 'Processing...' : 'Issue Credential'}
              </button>
            </div>

            {uploadMessage && (
              <div
                className={`upload-message ${uploading ? 'uploading' : uploadMessage.includes('Success') ? 'success' : ''}`}
              >
                {uploading ? (
                  <div className="d-flex align-items-center">
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    {uploadMessage}
                  </div>
                ) : uploadMessage.includes('Success') ? (
                  <div className="d-flex align-items-center">
                    <i className="fas fa-check-circle me-2"></i>
                    <div>
                      <strong>Credential Successfully Issued!</strong>
                      <br />
                      <small>{uploadMessage.replace('✅ Success! ', '')}</small>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default IssueCredentialModal;

