// fileName: IssueCredentialModal.js

import React, { useMemo, useState } from 'react';
import './AcademicInstitution.css';
import { uploadCredential, updateBlockchainId } from '../../services/institutionApiService';
import blockchainService from '../../services/blockchainService';

function IssueCredentialModal({
  show,
  onClose,
  credentialTypes,
  students,
  onIssued,
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
    return (students || []).filter((student) =>
      `${student.first_name} ${student.last_name}`
        .toLowerCase()
        .includes(String(studentSearchTerm).toLowerCase())
    );
  }, [students, studentSearchTerm]);

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
    setFormData((prev) => ({ ...prev, studentAccount: '' }));
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

    const isCustomType = formData.credentialType === 'other';
    if (
      (!isCustomType && !formData.credentialType) ||
      (isCustomType && !customCredentialType.trim()) ||
      !formData.studentAccount ||
      !formData.credentialFile
    ) {
      setModalError('Please fill all required fields');
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

      setUploadMessage('Uploading document to IPFS...');

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

      const response = await uploadCredential(credentialData, formData.credentialFile);

      setUploadMessage('Issuing credential on the blockchain...');
      const blockchainResult = await blockchainService.issueCredential(
        response.ipfs_cid_hash,
        selectedStudent.student_id
      );

      setUploadMessage('Updating database with blockchain info...');
      await updateBlockchainId(response.credential_id, blockchainResult.credentialId);

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
      setModalError(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
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
                <i className="fas fa-search me-2"></i>
                Search Student
              </label>
              <input
                type="text"
                id="studentSearch"
                name="studentSearch"
                value={studentSearchTerm || ''}
                onChange={handleStudentSearchChange}
                className="form-control mb-2"
                placeholder="Type to search by name..."
              />
              <label htmlFor="studentAccount" className="form-label sr-only">
                Select Student
              </label>
              <select
                id="studentAccount"
                name="studentAccount"
                value={formData?.studentAccount || ''}
                onChange={handleInputChange}
                className="form-select"
                required
                size={Math.min(5, Math.max(2, filteredStudents.length + 1))}
              >
                <option value="" disabled={!!formData?.studentAccount}>
                  {studentSearchTerm ? 'Select from filtered list...' : 'Select Student...'}
                </option>
                {filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} ({student.student_id})
                  </option>
                ))}
              </select>
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

