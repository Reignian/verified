// fileName: BulkImportStudentsModal.js

import React, { useState } from 'react';
import './AcademicInstitution.css';
import { bulkImportStudents } from '../services/apiService';

function BulkImportStudentsModal({
  show,
  onClose,
  institutionId,
  onImported,
}) {
  // Local state
  const [bulkImportFile, setBulkImportFile] = useState(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkImportMessage, setBulkImportMessage] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [showFormatInfo, setShowFormatInfo] = useState(false);
  const [modalError, setModalError] = useState('');

  const handleBulkImportFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setBulkImportFile(file);
    if (bulkImportMessage) setBulkImportMessage('');
    if (modalError) setModalError('');
  };

  const resetBulkImportForm = () => {
    setBulkImportFile(null);
    setBulkImportMessage('');
    setImportSuccess(false);
    setShowFormatInfo(false);
    setModalError('');
    const fileInput = document.getElementById('bulkImportFile');
    if (fileInput) fileInput.value = '';
  };

  const handleClose = () => {
    if (typeof onClose === 'function') onClose();
    // Reset shortly after close to allow fade/transition if any
    setTimeout(() => resetBulkImportForm(), 200);
  };

  const handleBulkImportSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!bulkImportFile) {
      setModalError('Please select a file to import');
      return;
    }
    if (!institutionId) {
      setModalError('Institution ID not found. Please log in again.');
      return;
    }

    setBulkImporting(true);
    setBulkImportMessage('Processing file and importing students...');

    try {
      const response = await bulkImportStudents(bulkImportFile, institutionId);

      setBulkImportMessage(
        `Import completed! \nSuccessfully imported: ${response.imported_count} students\nFailed: ${response.failed_count} records\nTotal processed: ${response.total_processed} records`
      );
      setImportSuccess(true);

      // Ask parent to refresh its student list
      if (typeof onImported === 'function') {
        try { await onImported(); } catch (_) {}
      }

      // If there are partial failures, surface details inside the modal
      if (response.failed_count > 0 && response.failed_records?.length > 0) {
        const failureDetails = response.failed_records
          .map((f) => `Row ${f.index}: ${f.error}`)
          .join('\n');
        setModalError(`Import completed with ${response.failed_count} errors:\n\n${failureDetails}`);
      }
    } catch (error) {
      // Create user-friendly error messages
      let userFriendlyMessage = '';
      if (error.response) {
        const status = error.response.status;
        const serverMessage = error.response.data?.error || '';
        switch (status) {
          case 400:
            if (serverMessage.includes('No file uploaded')) {
              userFriendlyMessage = 'Please select a file to upload before clicking Import.';
            } else if (serverMessage.includes('No student data found')) {
              userFriendlyMessage = 'The file you selected appears empty or has no student data. Please check your file and try again.';
            } else if (serverMessage.includes('No valid student records')) {
              userFriendlyMessage = 'The file data is not properly formatted. Ensure required fields like student ID and name are present.';
            } else if (serverMessage.includes('Institution ID required')) {
              userFriendlyMessage = 'There was a problem identifying your institution. Please log out and log back in, then try again.';
            } else {
              userFriendlyMessage = `There is an issue with the file or data: ${serverMessage}`;
            }
            break;
          case 500:
            if (serverMessage.includes('Import failed')) {
              userFriendlyMessage = 'Something went wrong while processing your file. This may be due to file format or corrupted data.';
            } else {
              userFriendlyMessage = 'A server error occurred while importing students. Please try again shortly.';
            }
            break;
          default:
            userFriendlyMessage = `Upload failed (Error ${status}): ${serverMessage || 'Please try again or contact support if it continues.'}`;
        }
      } else if (error.request) {
        userFriendlyMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (error.message) {
        if (error.message.includes('Network Error')) {
          userFriendlyMessage = 'Network connection problem. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          userFriendlyMessage = 'The upload is taking too long. Try a smaller file or check your connection.';
        } else {
          userFriendlyMessage = `Import failed: ${error.message}`;
        }
      } else {
        userFriendlyMessage = 'Import failed due to an unknown error.';
      }

      setModalError(userFriendlyMessage);
    } finally {
      setBulkImporting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <i className="fas fa-users me-2"></i>
            Bulk Import Students
          </h3>
          <button className="modal-close" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          {modalError && !importSuccess && (
            <div className="alert alert-danger" role="alert" style={{ marginBottom: '1rem' }}>
              {modalError}
            </div>
          )}
          {importSuccess ? (
            // Success Message View
            <div className="text-center">
              <div className={`upload-message success`} style={{ display: 'block' }}>
                <i className="fas fa-check-circle fa-2x mb-3 text-success"></i>
                <h5 className="mb-3">Import Successful!</h5>
                <pre style={{ textAlign: 'left', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                  {bulkImportMessage?.replace('✅ Import completed! ', '')}
                </pre>
              </div>
              {modalError && (
                <div className="alert alert-warning mt-3" role="alert" style={{ textAlign: 'left', whiteSpace: 'pre-wrap' }}>
                  {modalError}
                </div>
              )}
              <button
                type="button"
                className="btn-secondary-custom mt-4"
                onClick={resetBulkImportForm}
              >
                <i className="fas fa-plus me-2"></i>
                Import Another File
              </button>
            </div>
          ) : (
            // Default Form View
            <form onSubmit={handleBulkImportSubmit}>
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-file-upload me-2"></i>
                  Student Data File
                </label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="bulkImportFile"
                    name="bulkImportFile"
                    onChange={handleBulkImportFileChange}
                    accept=".pdf,.txt,.csv,.xlsx,.xls,.doc,.docx"
                    className="file-input"
                    required
                  />
                  <label htmlFor="bulkImportFile" className="file-input-label">
                    <i className="fas fa-cloud-upload-alt file-input-icon"></i>
                    {bulkImportFile ? 'Change File' : 'Choose File to Import'}
                  </label>
                </div>

                {bulkImportFile && (
                  <div className="selected-file mt-3">
                    <i className="fas fa-file-check me-2"></i>
                    Selected: {bulkImportFile.name}
                  </div>
                )}

                {/* Submit Button */}
                <div className="text-center mt-4">
                  <button
                    type="submit"
                    className="btn-secondary-custom"
                    disabled={bulkImporting || !bulkImportFile}
                  >
                    {bulkImporting && <div className="loading-spinner"></div>}
                    <i className={`fas ${bulkImporting ? '' : 'fa-upload'} me-2`}></i>
                    {bulkImporting ? 'Processing...' : 'Import Students'}
                  </button>
                </div>

                {/* Collapsible Format Information */}
                <div className="format-info">
                  <div
                    className="format-info-header"
                    onClick={() => (setShowFormatInfo ? setShowFormatInfo(!showFormatInfo) : null)}
                  >
                    <span>
                      <i className="fas fa-info-circle me-2"></i>
                      Supported Formats & Data Guide
                    </span>
                    <i className={`fas ${showFormatInfo ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                  </div>

                  {(showFormatInfo || showFormatInfo === undefined) && (
                    <div className="mt-2">
                      <ul>
                        <li><strong>Excel (.xlsx, .xls):</strong> Column headers should match field names.</li>
                        <li><strong>CSV:</strong> Comma-separated with headers in the first row.</li>
                        <li><strong>Text (.txt):</strong> Structured data with clear field labels (e.g., "name: John Doe").</li>
                        <li><strong>Word (.docx) / PDF:</strong> Text-based records (not scanned images).</li>
                      </ul>
                      <h6>Required/Recognized Fields:</h6>
                      <ul>
                        <li><strong>student_id</strong> (Required) - Unique student identifier</li>
                        <li><strong>first_name</strong> (Required) - Student's first name</li>
                        <li><strong>last_name</strong> - Student's last name</li>
                        <li><strong>middle_name</strong> - Student's middle name</li>
                        <li><strong>username</strong> - Login username (auto-generated if not provided)</li>
                        <li><strong>password</strong> - Login password (auto-generated if not provided)</li>
                        <li><strong>email</strong> - Email address (auto-generated if not provided)</li>
                      </ul>
                      <div className="format-example">
                        <strong>CSV Example:</strong><br />
                        student_id,first_name,last_name,email<br />
                        2022-01084,John,Doe,john.doe@student.edu<br />
                        2022-01085,Jane,Smith,jane.smith@student.edu
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Processing Message */}
              {bulkImporting && (
                <div className={`upload-message uploading`}>
                  <div className="d-flex align-items-center">
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    {bulkImportMessage}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default BulkImportStudentsModal;

