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
import AcademicInstitutionUI from './AcademicInstitutionUI';
import StudentManagement from './StudentManagement';

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

      setUploadMessage(`âœ… Success! IPFS: ${response.ipfs_hash} | Blockchain: ${blockchainResult.credentialId} | TX: ${blockchainResult.transactionHash}`);
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
        `âœ… Import completed! 
        Successfully imported: ${response.imported_count} students
        Failed: ${response.failed_count} records
        Total processed: ${response.total_processed} records`
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
              userFriendlyMessage = `There's an issue with the file format or data: ${serverMessage}`;
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
        <AcademicInstitutionUI
          // Core state
          account={account}
          institutionName={institutionName}
          credentialTypes={credentialTypes}
          students={students}
          issuedCredentials={issuedCredentials}
          credentialStats={credentialStats}
          formData={formData}
          uploading={uploading}
          uploadMessage={uploadMessage}
          showModal={showModal}
          setShowModal={setShowModal}
          showErrorPopup={showErrorPopup}
          setShowErrorPopup={setShowErrorPopup}
          errorMessage={errorMessage}

          // Bulk import props
          showBulkImportModal={showBulkImportModal}
          setShowBulkImportModal={setShowBulkImportModal}
          bulkImportFile={bulkImportFile}
          bulkImporting={bulkImporting}
          bulkImportMessage={bulkImportMessage}
          importSuccess={importSuccess}
          showFormatInfo={showFormatInfo}
          setShowFormatInfo={setShowFormatInfo}
          resetBulkImportForm={resetBulkImportForm}

          // Enhanced modal props
          showCustomTypeInput={showCustomTypeInput}
          customCredentialType={customCredentialType}
          studentSearchTerm={studentSearchTerm}

          // Event handlers
          handleInputChange={handleInputChange}
          handleCustomTypeChange={handleCustomTypeChange}
          handleStudentSearchChange={handleStudentSearchChange}
          handleSubmit={handleSubmit}
          handleViewCredential={handleViewCredential}
          handleBulkImportFileChange={handleBulkImportFileChange}
          handleBulkImportSubmit={handleBulkImportSubmit}
          handleCloseBulkImportModal={handleCloseBulkImportModal}
          formatDate={formatDate}
          
          // NEW: Student management handler
          handleShowStudentManagement={handleShowStudentManagement}
        />
      )}
    </>
  );
}

export default AcademicInstitution;