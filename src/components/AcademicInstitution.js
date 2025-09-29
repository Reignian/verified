// fileName: AcademicInstitution.js

import React, { useState, useEffect } from 'react';

import {
  fetchCredentialTypes,
  fetchStudents,
  uploadCredential,
  fetchIssuedCredentials,
  fetchCredentialStats,
  bulkImportStudents,
  fetchInstitutionName
} from '../services/apiService';
import blockchainService from '../services/blockchainService';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AcademicInstitution.css';
import StudentManagement from './StudentManagement';
import IssueCredentialModal from './IssueCredentialModal';
import BulkImportStudentsModal from './BulkImportStudentsModal';

function AcademicInstitution() {
  const [account, setAccount] = useState(null);
  const [institutionName, setInstitutionName] = useState('');
  const [institutionId, setInstitutionId] = useState(null);

  const [credentialTypes, setCredentialTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [issuedCredentials, setIssuedCredentials] = useState([]);
  const [credentialStats, setCredentialStats] = useState({ total_credentials: 0, new_credentials_week: 0 });
  const [formData, setFormData] = useState({
    credentialType: '',
    studentAccount: '',
    credentialFile: null
  });
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Bulk import state
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportFile, setBulkImportFile] = useState(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkImportMessage, setBulkImportMessage] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [showFormatInfo, setShowFormatInfo] = useState(false);

  // Enhanced modal state
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false);
  const [customCredentialType, setCustomCredentialType] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // NEW: Student Management state
  const [showStudentManagement, setShowStudentManagement] = useState(false);

  useEffect(() => {
    const getAccount = async () => {
      if (window.ethereum) {
        try {
          let accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length === 0) {
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          }
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (error) {
          console.error('MetaMask connection failed:', error);
        }
      }
    };

    const loadData = async () => {
      try {
        // Get logged-in user info
        const loggedInUserId = localStorage.getItem('userId');
        
        if (!loggedInUserId) {
          setErrorMessage('Please log in again');
          setShowErrorPopup(true);
          return;
        }

        // Set institution ID from logged-in user
        setInstitutionId(parseInt(loggedInUserId));

        // Fetch institution name
        const institutionData = await fetchInstitutionName(loggedInUserId);
        setInstitutionName(institutionData.institution_name);

        // Load institution-specific data
        const [types, studentData, credentials, stats] = await Promise.all([
          fetchCredentialTypes(),
          fetchStudents(loggedInUserId), // Pass institution ID
          fetchIssuedCredentials(loggedInUserId), // Pass institution ID
          fetchCredentialStats(loggedInUserId) // Pass institution ID
        ]);
        
        setCredentialTypes(types);
        setStudents(studentData);
        setIssuedCredentials(credentials);
        setCredentialStats(stats);
      } catch (error) {
        console.error('Data loading failed:', error);
        setErrorMessage('Failed to load institution data. Please refresh the page.');
        setShowErrorPopup(true);
      }
    };

    getAccount();
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    // Handle credential type changes for "Other" option
    if (name === 'credentialType') {
      if (value === 'other') {
        setShowCustomTypeInput(true);
      } else {
        setShowCustomTypeInput(false);
        setCustomCredentialType('');
      }
    }

    setFormData(prevState => ({
      ...prevState,
      [name]: files ? files[0] : value
    }));
    
    if (uploadMessage) setUploadMessage('');
  };

  const handleCustomTypeChange = (e) => {
    setCustomCredentialType(e.target.value);
  };

  const handleStudentSearchChange = (e) => {
    setStudentSearchTerm(e.target.value);
    // Clear the selected student when the search term changes
    setFormData(prevState => ({ ...prevState, studentAccount: '' }));
  };

  const resetForm = () => {
    setFormData({
      credentialType: '',
      studentAccount: '',
      credentialFile: null
    });
    setShowCustomTypeInput(false);
    setCustomCredentialType('');
    setStudentSearchTerm('');
    const fileInput = document.getElementById('credentialFile');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isCustomType = formData.credentialType === 'other';
    if (
      (!isCustomType && !formData.credentialType) || 
      (isCustomType && !customCredentialType.trim()) || 
      !formData.studentAccount || 
      !formData.credentialFile
    ) {
      setErrorMessage('Please fill all required fields');
      setShowErrorPopup(true);
      return;
    }

    const loggedInUserId = localStorage.getItem('userId');
    if (!loggedInUserId || !institutionId) {
      setErrorMessage('Please log in again');
      setShowErrorPopup(true);
      return;
    }

    setUploading(true);
    setUploadMessage('Processing credential details...');

    try {
      // MODIFIED: This block is streamlined
      const selectedStudent = students.find(s => s.id === parseInt(formData.studentAccount));
      if (!selectedStudent) {
        throw new Error('Selected student not found.');
      }
      
      setUploadMessage('Uploading document to IPFS...');
      
      // Prepare data for the API. It will have either a 'credential_type_id'
      // or a 'custom_type' string, but not both.
      const credentialData = {
        owner_id: parseInt(formData.studentAccount),
        sender_id: parseInt(loggedInUserId)
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
      const updateResponse = await fetch('http://localhost:3001/api/update-blockchain-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential_id: response.credential_id,
          blockchain_id: blockchainResult.credentialId
        }),
      });
      
      if (!updateResponse.ok) throw new Error('Database update failed');

      setUploadMessage(`Success! IPFS: ${response.ipfs_hash} | Blockchain: ${blockchainResult.credentialId} | TX: ${blockchainResult.transactionHash}`);
      resetForm();
      setShowModal(false);

      // Refresh data - no longer need to refresh credential types
      const [credentials, stats] = await Promise.all([
        fetchIssuedCredentials(institutionId),
        fetchCredentialStats(institutionId)
      ]);
      setIssuedCredentials(credentials);
      setCredentialStats(stats);

    } catch (error) {
      setErrorMessage(`Upload failed: ${error.message}`);
      setShowErrorPopup(true);
    } finally {
      setUploading(false);
    }
  };

  const handleBulkImportFileChange = (e) => {
    const file = e.target.files[0];
    setBulkImportFile(file);
    if (bulkImportMessage) setBulkImportMessage('');
  };

  const resetBulkImportForm = () => {
    setBulkImportFile(null);
    setBulkImportMessage('');
    setImportSuccess(false);
    setShowFormatInfo(false);
    const fileInput = document.getElementById('bulkImportFile');
    if (fileInput) fileInput.value = '';
  };

  const handleCloseBulkImportModal = () => {
    setShowBulkImportModal(false);
    setTimeout(() => {
        resetBulkImportForm();
    }, 300);
  };

  const handleBulkImportSubmit = async (e) => {
    e.preventDefault();
    
    if (!bulkImportFile) {
      setErrorMessage('Please select a file to import');
      setShowErrorPopup(true);
      return;
    }

    if (!institutionId) {
      setErrorMessage('Institution ID not found. Please log in again.');
      setShowErrorPopup(true);
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
      
      // Refresh students data with institution filter
      const studentData = await fetchStudents(institutionId);
      setStudents(studentData);
      
      if (response.failed_count > 0 && response.failed_records?.length > 0) {
        const failureDetails = response.failed_records.map(failure => 
          `Row ${failure.index}: ${failure.error}`
        ).join('\n');
        
        setTimeout(() => {
          setErrorMessage(
            `Import completed with ${response.failed_count} errors:\n\n${failureDetails}`
          );
          setShowErrorPopup(true);
        }, 2000);
      }
      
    } catch (error) {
      console.error('Bulk import error:', error);
      
      // Create user-friendly error messages
      let userFriendlyMessage = '';
      
      if (error.response) {
        // Server responded with an error status
        const status = error.response.status;
        const serverMessage = error.response.data?.error || '';
        
        switch (status) {
          case 400:
            if (serverMessage.includes('No file uploaded')) {
              userFriendlyMessage = 'Please select a file to upload before clicking Import.';
            } else if (serverMessage.includes('No student data found')) {
              userFriendlyMessage = 'The file you selected appears to be empty or doesn\'t contain student data. Please check your file and try again.';
            } else if (serverMessage.includes('No valid student records')) {
              userFriendlyMessage = 'The file doesn\'t contain properly formatted student information. Please make sure your file has the required fields like student ID and name.';
            } else if (serverMessage.includes('Institution ID required')) {
              userFriendlyMessage = 'There was a problem identifying your institution. Please log out and log back in, then try again.';
            } else {
              userFriendlyMessage = `There\'s an issue with the file format or data: ${serverMessage}`;
            }
            break;
          case 500:
            if (serverMessage.includes('Import failed')) {
              userFriendlyMessage = 'Something went wrong while processing your file. This might be due to the file format or corrupted data. Please check your file and try again.';
            } else {
              userFriendlyMessage = 'A server error occurred while importing students. Please try again in a few moments.';
            }
            break;
          default:
            userFriendlyMessage = `Upload failed (Error ${status}): ${serverMessage || 'Please try again or contact support if the problem continues.'}`;
        }
      } else if (error.request) {
        // Network error - no response received
        userFriendlyMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else {
        // Something else went wrong
        if (error.message.includes('Network Error')) {
          userFriendlyMessage = 'Network connection problem. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          userFriendlyMessage = 'The upload is taking too long. Please try with a smaller file or check your internet connection.';
        } else {
          userFriendlyMessage = `Import failed: ${error.message}`;
        }
      }
      
      setErrorMessage(userFriendlyMessage);
      setShowErrorPopup(true);
    } finally {
      setBulkImporting(false);
    }
  };

  const handleViewCredential = (ipfsCid) => {
    const ipfsUrl = `https://amethyst-tropical-jackal-879.mypinata.cloud/ipfs/${ipfsCid}`;
    window.open(ipfsUrl, '_blank');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  // NEW: Student Management handlers
  const handleShowStudentManagement = () => {
    setShowStudentManagement(true);
  };

  const handleBackToDashboard = () => {
    setShowStudentManagement(false);
  };

  // Conditional rendering based on current view
  return (
    <>
      {showStudentManagement ? (
        <StudentManagement 
          institutionId={institutionId}
          onBack={handleBackToDashboard}
        />
      ) : (
        <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f9f9f9', minHeight: '100vh', paddingTop: '80px' }}>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

          {/* Header Section */}
          <div className="dashboard-header">
            <div className="container">
              <div className="row align-items-center">
                <div className="col-lg-8">
                  <h1 className="dashboard-title">
                    <i className="fas fa-university me-3"></i>
                    {institutionName ? `${institutionName} Dashboard` : 'Academic Institution Dashboard'}
                  </h1>
                  <p className="dashboard-subtitle">Issue and manage blockchain-verified academic credentials</p>
                </div>
                {account && (
                  <div className="col-lg-4">
                    <div className="wallet-info">
                      <div className="wallet-label">Connected Wallet</div>
                      <p className="wallet-address">{account}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="main-content">
            {/* Stats Section */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{credentialStats.total_credentials}</div>
                <p className="stat-label">Total Credentials</p>
                {credentialStats.new_credentials_week > 0 && (
                  <div className="notification-badge">{credentialStats.new_credentials_week}</div>
                )}
              </div>
              <div className="stat-card">
                <div className="stat-number">{students.length}</div>
                <p className="stat-label">Registered Students</p>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  <i className="fas fa-shield-alt text-success"></i>
                </div>
                <p className="stat-label">Blockchain Secured</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="button-group">
              <button className="btn btn-primary-custom" onClick={() => setShowModal(true)}>
                <i className="fas fa-plus-circle me-2"></i>
                Issue Credential
              </button>
              <button className="btn btn-secondary-custom" onClick={() => setShowBulkImportModal(true)}>
                <i className="fas fa-users me-2"></i>
                Bulk Import Students
              </button>
              <button className="btn btn-success-custom" onClick={handleShowStudentManagement}>
                <i className="fas fa-user-cog me-2"></i>
                Manage Students
              </button>
            </div>

            {/* Issued Credentials Table */}
            <div className="table-card">
              <h2 className="card-title">
                <div className="card-icon">
                  <i className="fas fa-list"></i>
                </div>
                Issued Credentials
              </h2>

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Credential Type</th>
                      <th>Date Issued</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issuedCredentials.length > 0 ? (
                      issuedCredentials.map((credential) => (
                        <tr key={credential.id}>
                          <td>
                            <strong>{credential.student_name}</strong>
                          </td>
                          <td>{credential.credential_type}</td>
                          <td>{formatDate(credential.date_issued)}</td>
                          <td>
                            <span className={`status-badge status-${credential.status}`}>
                              {credential.status === 'blockchain_verified' ? 'Verified' : 'Uploaded'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-primary-custom btn-sm"
                              onClick={() => handleViewCredential(credential.ipfs_cid)}
                              title="View credential document"
                            >
                              <i className="fas fa-eye me-1"></i>
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-4">
                          <i className="fas fa-inbox fa-2x mb-3 d-block"></i>
                          No credentials issued yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Error Modal */}
          {showErrorPopup && (
            <div className="error-modal">
              <div className="error-modal-content">
                <div className="error-modal-header">
                  <h4 className="error-modal-title">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Error
                  </h4>
                  <button 
                    className="error-modal-close"
                    onClick={() => setShowErrorPopup(false)}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="error-modal-body">
                  <p className="error-message">{errorMessage}</p>
                  <div className="text-center mt-4">
                    <button 
                      className="btn btn-primary-custom"
                      onClick={() => setShowErrorPopup(false)}
                      style={{minWidth: '120px'}}
                    >
                      <i className="fas fa-check me-2"></i>
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!showStudentManagement && (
        <IssueCredentialModal
          show={showModal}
          onClose={() => setShowModal(false)}
          credentialTypes={credentialTypes}
          showCustomTypeInput={showCustomTypeInput}
          customCredentialType={customCredentialType}
          studentSearchTerm={studentSearchTerm}
          students={students}
          formData={formData}
          uploading={uploading}
          uploadMessage={uploadMessage}
          handleInputChange={handleInputChange}
          handleCustomTypeChange={handleCustomTypeChange}
          handleStudentSearchChange={handleStudentSearchChange}
          handleSubmit={handleSubmit}
        />
      )}

      {!showStudentManagement && (
        <BulkImportStudentsModal
          show={showBulkImportModal}
          onClose={handleCloseBulkImportModal || (() => setShowBulkImportModal(false))}
          importSuccess={importSuccess}
          bulkImportMessage={bulkImportMessage}
          bulkImportFile={bulkImportFile}
          bulkImporting={bulkImporting}
          showFormatInfo={showFormatInfo}
          setShowFormatInfo={setShowFormatInfo}
          resetBulkImportForm={resetBulkImportForm}
          handleBulkImportFileChange={handleBulkImportFileChange}
          handleBulkImportSubmit={handleBulkImportSubmit}
        />
      )}
    </>
  );
}

export default AcademicInstitution;

