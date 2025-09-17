// fileName: AcademicInstitution.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchCredentialTypes,
  fetchStudents,
  uploadCredential,
  fetchIssuedCredentials,
  fetchCredentialStats,
  bulkImportStudents,
  addCredentialType
} from '../services/apiService';
import blockchainService from '../services/blockchainService';
import AcademicInstitutionUI from './AcademicInstitutionUI';

function AcademicInstitution() {
  const [account, setAccount] = useState(null);
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

  const navigate = useNavigate();

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
        const [types, studentData, credentials, stats] = await Promise.all([
          fetchCredentialTypes(),
          fetchStudents(),
          fetchIssuedCredentials(),
          fetchCredentialStats()
        ]);
        setCredentialTypes(types);
        setStudents(studentData);
        setIssuedCredentials(credentials);
        setCredentialStats(stats);
      } catch (error) {
        console.error('Data loading failed:', error);
        setErrorMessage('Failed to load data. Please refresh the page.');
        setShowErrorPopup(true);
      }
    };

    getAccount();
    loadData();
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('userId');
    navigate('/');
  };

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
    if (!loggedInUserId) {
      setErrorMessage('Please log in again');
      setShowErrorPopup(true);
      return;
    }

    setUploading(true);
    setUploadMessage('Processing credential details...');

    try {
      let finalCredentialTypeId = formData.credentialType;

      // Handle custom credential type
      if (isCustomType) {
        setUploadMessage('Creating new credential type...');
        const newType = await addCredentialType(customCredentialType.trim());
        finalCredentialTypeId = newType.id;
        
        // Refresh credential types list
        const updatedTypes = await fetchCredentialTypes();
        setCredentialTypes(updatedTypes);
      }
      
      const selectedStudent = students.find(s => s.id === parseInt(formData.studentAccount));
      if (!selectedStudent) {
        throw new Error('Selected student not found.');
      }
      
      setUploadMessage('Uploading document to IPFS...');
      const credentialData = {
        credential_type_id: parseInt(finalCredentialTypeId),
        owner_id: parseInt(formData.studentAccount),
        sender_id: parseInt(loggedInUserId)
      };
      
      const response = await uploadCredential(credentialData, formData.credentialFile);
      
      setUploadMessage('Issuing credential on the blockchain...');
      const blockchainResult = await blockchainService.issueCredential(
        response.ipfs_hash,
        selectedStudent.public_address
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

      setUploadMessage(`✅ Success! IPFS: ${response.ipfs_hash} | Blockchain: ${blockchainResult.credentialId} | TX: ${blockchainResult.transactionHash}`);
      resetForm();
      setShowModal(false);

      // Refresh data
      const [types, credentials, stats] = await Promise.all([
        fetchCredentialTypes(),
        fetchIssuedCredentials(),
        fetchCredentialStats()
      ]);
      setCredentialTypes(types);
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

    setBulkImporting(true);
    setBulkImportMessage('Processing file and importing students...');

    try {
      const response = await bulkImportStudents(bulkImportFile);
      
      setBulkImportMessage(
        `✅ Import completed! 
        Successfully imported: ${response.imported_count} students
        Failed: ${response.failed_count} records
        Total processed: ${response.total_processed} records`
      );
      
      setImportSuccess(true);
      
      const studentData = await fetchStudents();
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
      setErrorMessage(`Bulk import failed: ${error.message}`);
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

  // Render the UI component with all props
  return (
    <AcademicInstitutionUI
      // Core state
      account={account}
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
      showMobileMenu={showMobileMenu}
      setShowMobileMenu={setShowMobileMenu}
      
      // Bulk import props
      showBulkImportModal={showBulkImportModal}
      setShowBulkImportModal={setShowBulkImportModal}
      bulkImportFile={bulkImportFile}
      bulkImporting={bulkImporting}
      bulkImportMessage={bulkImportMessage}
      importSuccess={importSuccess}
      showFormatInfo={showFormatInfo}
      setShowFormatInfo={setShowFormatInfo}
      
      // Enhanced modal props
      showCustomTypeInput={showCustomTypeInput}
      customCredentialType={customCredentialType}
      studentSearchTerm={studentSearchTerm}
      
      // Event handlers
      handleLogout={handleLogout}
      handleInputChange={handleInputChange}
      handleCustomTypeChange={handleCustomTypeChange}
      handleStudentSearchChange={handleStudentSearchChange}
      handleSubmit={handleSubmit}
      handleViewCredential={handleViewCredential}
      handleBulkImportFileChange={handleBulkImportFileChange}
      handleBulkImportSubmit={handleBulkImportSubmit}
      handleCloseBulkImportModal={handleCloseBulkImportModal}
      resetBulkImportForm={resetBulkImportForm}
      formatDate={formatDate}
    />
  );
}

export default AcademicInstitution;