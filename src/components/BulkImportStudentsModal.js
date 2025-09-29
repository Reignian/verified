// fileName: BulkImportStudentsModal.js

import React from 'react';
import './AcademicInstitution.css';

function BulkImportStudentsModal({
  show,
  onClose,
  importSuccess,
  bulkImportMessage,
  bulkImportFile,
  bulkImporting,
  showFormatInfo,
  setShowFormatInfo,
  resetBulkImportForm,
  handleBulkImportFileChange,
  handleBulkImportSubmit,
}) {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <i className="fas fa-users me-2"></i>
            Bulk Import Students
          </h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
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

