// fileName: BulkImportStudentsModal.js

import React, { useState, useEffect } from 'react';
import './AcademicInstitution.css';
import { bulkImportStudents, fetchInstitutionPrograms } from '../../services/institutionApiService';
import { logStudentImported } from '../../services/activityLogService';

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
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  useEffect(() => {
    if (show && institutionId) {
      fetchPrograms();
    }
  }, [show, institutionId]);

  const fetchPrograms = async () => {
    setLoadingPrograms(true);
    try {
      const data = await fetchInstitutionPrograms(institutionId);
      // Backend returns array directly, not wrapped in an object
      setPrograms(Array.isArray(data) ? data : (data.programs || []));
    } catch (error) {
      console.error('Error fetching programs:', error);
      setPrograms([]);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const handleBulkImportFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setBulkImportFile(file);
    if (bulkImportMessage) setBulkImportMessage('');
    if (modalError) setModalError('');
  };

  const handleDownloadTemplate = () => {
    // Create CSV template with headers only (no sample data)
    const csvContent = `student_id,first_name,last_name,middle_name,email,username,password
`;

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'student_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetBulkImportForm = () => {
    setBulkImportFile(null);
    setBulkImportMessage('');
    setImportSuccess(false);
    setShowFormatInfo(false);
    setModalError('');
    setSelectedProgram('');
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
    if (!selectedProgram) {
      setModalError('Please select a program for the students');
      return;
    }
    if (!institutionId) {
      setModalError('Institution ID not found. Please log in again.');
      return;
    }

    setBulkImporting(true);
    setBulkImportMessage('Processing file and importing students...');

    try {
      const response = await bulkImportStudents(bulkImportFile, institutionId, selectedProgram);

      setBulkImportMessage(
        `Import completed! \nSuccessfully imported: ${response.imported_count} students\nFailed: ${response.failed_count} records\nTotal processed: ${response.total_processed} records`
      );
      setImportSuccess(true);

      // Log the activity
      const userId = localStorage.getItem('userId');
      await logStudentImported(institutionId, userId, response.imported_count);

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
              {/* Download Template Button */}
              <div className="template-download-section mb-4">
                <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Quick Start:</strong> Download the template below and add your student data.
                </div>
                <button
                  type="button"
                  className="btn btn-success w-100"
                  onClick={handleDownloadTemplate}
                >
                  <i className="fas fa-download me-2"></i>
                  Download CSV Template
                </button>
                <small><i className="fas fa-exclamation-triangle me-1"></i><strong>Important:</strong> Do not modify the header row (first row).</small>
              </div>

              {/* Program Selection */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-graduation-cap me-2"></i>
                  Assign to Program <span className="text-danger">*</span>
                </label>
                {loadingPrograms ? (
                  <div className="text-muted" style={{ padding: '0.75rem' }}>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    Loading programs...
                  </div>
                ) : programs.length === 0 ? (
                  <div className="alert alert-warning" style={{ padding: '0.75rem', marginBottom: 0 }}>
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    No programs available. Please create a program first.
                  </div>
                ) : (
                  <select
                    className="form-control"
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    required
                    style={{
                      padding: '0.75rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="">-- Select a Program --</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.program_code} - {program.program_name}
                      </option>
                    ))}
                  </select>
                )}
                <small className="text-muted mt-1 d-block">
                  <i className="fas fa-info-circle me-1"></i>
                  All imported students will be assigned to this program
                </small>
              </div>

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
                    accept=".csv,.xlsx,.xls"
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
                    disabled={bulkImporting || !bulkImportFile || !selectedProgram}
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
                      <i className="fas fa-question-circle me-2"></i>
                      Need Help? View Format Guide
                    </span>
                    <i className={`fas ${showFormatInfo ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                  </div>

                  {(showFormatInfo || showFormatInfo === undefined) && (
                    <div className="mt-2">
                      <div className="alert alert-success" style={{ padding: '0.75rem', marginBottom: '1rem' }}>
                        <i className="fas fa-check-circle me-2"></i>
                        <strong>Accepted Formats:</strong> CSV (.csv), Excel (.xlsx, .xls)
                      </div>

                      <h6><i className="fas fa-table me-2"></i>Column Headers (First Row):</h6>
                      <div className="format-example mb-3">
                        <code style={{ fontSize: '0.85rem', display: 'block', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                          student_id,first_name,last_name,middle_name,email,username,password
                        </code>
                      </div>

                      <h6><i className="fas fa-clipboard-list me-2"></i>Field Information:</h6>
                      <table className="table table-sm" style={{ fontSize: '0.85rem' }}>
                        <tbody>
                          <tr>
                            <td><strong>student_id</strong></td>
                            <td><span className="badge bg-danger">Required</span></td>
                            <td>Unique student identifier</td>
                          </tr>
                          <tr>
                            <td><strong>first_name</strong></td>
                            <td><span className="badge bg-danger">Required</span></td>
                            <td>Student's first name</td>
                          </tr>
                          <tr>
                            <td><strong>last_name</strong></td>
                            <td><span className="badge bg-danger">Required</span></td>
                            <td>Student's last name</td>
                          </tr>
                          <tr>
                            <td><strong>email</strong></td>
                            <td><span className="badge bg-danger">Required</span></td>
                            <td>Email address</td>
                          </tr>
                          <tr>
                            <td><strong>middle_name</strong></td>
                            <td><span className="badge bg-secondary">Optional</span></td>
                            <td>Student's middle name</td>
                          </tr>
                          <tr>
                            <td><strong>username</strong></td>
                            <td><span className="badge bg-info">Optional auto-generated</span></td>
                            <td>Login username</td>
                          </tr>
                          <tr>
                            <td><strong>password</strong></td>
                            <td><span className="badge bg-info">Optional auto-generated</span></td>
                            <td>Login password</td>
                          </tr>
                        </tbody>
                      </table>

                      <h6><i className="fas fa-file-csv me-2"></i>Example Data Row:</h6>
                      <div className="format-example">
                        <code style={{ fontSize: '0.85rem', display: 'block', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                          2024-00001,Juan,Dela Cruz,Santos,juan.delacruz@student.edu,juan.delacruz,Student@123
                        </code>
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

