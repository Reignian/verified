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
  addCredentialType // NEW import
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

  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportFile, setBulkImportFile] = useState(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkImportMessage, setBulkImportMessage] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [showFormatInfo, setShowFormatInfo] = useState(false);

  // NEW state for the enhanced "Issue Credential" modal
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
  
  // Handler for the new Logout button
  const handleLogout = () => {
    localStorage.removeItem('userId'); // Clear user session
    navigate('/'); // Redirect to homepage
  };

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

      if (isCustomType) {
        setUploadMessage('Creating new credential type...');
        const newType = await addCredentialType(customCredentialType.trim());
        finalCredentialTypeId = newType.id;
      }
      
      const selectedStudent = students.find(s => s.id === parseInt(formData.studentAccount));
      if (!selectedStudent || !selectedStudent.public_address) {
        throw new Error('Selected student does not have a public wallet address.');
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

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f9f9f9', minHeight: '100vh', paddingTop: '80px' }}>
      <style>{`
        /* CSS variables and styles from HomePage.js */
        :root {
          --primary-color: #4050b5;
          --secondary-color: #7986cb;
          --accent-color: #3d5afe;
          --success-color: #4caf50;
          --danger-color: #f44336;
          --warning-color: #ff9800;
          --text-dark: #333;
          --text-light: #666;
          --text-lightest: #999;
          --background-light: #f9f9f9;
          --background-white: #ffffff;
          --background-dark: #212121;
          --border-color: #e0e0e0;
          --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          --transition: all 0.3s ease;
        }

        .navbar-custom {
          background-color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          height: 80px;
        }

        .navbar-brand {
          font-size: 1.8rem;
          color: var(--text-dark) !important;
          font-weight: bold;
          text-decoration: none;
        }

        .navbar-brand span {
          color: var(--primary-color);
        }

        .nav-link {
          color: var(--text-dark) !important;
          font-weight: 500;
          transition: var(--transition);
        }

        .nav-link:hover {
          color: var(--primary-color) !important;
        }
        
        .btn-primary-custom {
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          border: none;
          color: white;
          padding: 14px 30px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1.1rem;
          transition: var(--transition);
          cursor: pointer;
          min-width: 180px;
          text-decoration: none;
        }

        .btn-primary-custom:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(64, 80, 181, 0.3);
          background-color: var(--accent-color);
          border-color: var(--accent-color);
          color: white;
        }

        .btn-sm {
          padding: 8px 16px;
          font-size: 0.9rem;
          min-width: auto;
        }
        
        .dashboard-header {
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
          color: white;
          padding: 60px 0 40px;
          margin-bottom: 40px;
        }

        .dashboard-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 15px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .dashboard-subtitle {
          font-size: 1.1rem;
          opacity: 0.9;
          margin-bottom: 0;
        }

        .wallet-info {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 20px;
          margin-top: 20px;
          backdrop-filter: blur(10px);
        }

        .wallet-label {
          font-size: 0.9rem;
          opacity: 0.8;
          margin-bottom: 5px;
        }

        .wallet-address {
          font-family: 'Courier New', monospace;
          font-size: 0.95rem;
          word-break: break-all;
          background-color: rgba(255, 255, 255, 0.1);
          padding: 8px 12px;
          border-radius: 4px;
          margin: 0;
        }

        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .upload-card, .table-card {
          background-color: var(--background-white);
          border-radius: 12px;
          box-shadow: var(--shadow);
          padding: 40px;
          margin-bottom: 30px;
          border: none;
        }

        .card-title {
          font-size: 1.8rem;
          font-weight: 600;
          color: var(--text-dark);
          margin-bottom: 30px;
          display: flex;
          align-items: center;
        }

        .card-icon {
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          color: white;
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          font-size: 1.2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: var(--shadow);
          text-align: center;
          transition: var(--transition);
          position: relative;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: var(--primary-color);
          margin-bottom: 5px;
        }

        .stat-label {
          color: var(--text-light);
          font-size: 0.9rem;
          margin: 0;
        }

        .notification-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: var(--danger-color);
          color: white;
          border-radius: 50%;
          width: 25px;
          height: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: bold;
        }

        .table-responsive {
          border-radius: 8px;
          overflow: hidden;
        }

        .table {
          margin-bottom: 0;
        }

        .table th {
          background-color: #f8f9fa;
          border-bottom: 2px solid var(--border-color);
          font-weight: 600;
          color: var(--text-dark);
          padding: 15px;
        }

        .table td {
          padding: 15px;
          vertical-align: middle;
        }

        .table tbody tr:hover {
          background-color: rgba(64, 80, 181, 0.05);
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .status-uploaded {
          background-color: rgba(255, 152, 0, 0.1);
          color: var(--warning-color);
        }

        .status-blockchain_verified {
          background-color: rgba(76, 175, 80, 0.1);
          color: var(--success-color);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          padding: 20px 30px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-dark);
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: var(--text-light);
          cursor: pointer;
          padding: 5px;
          transition: var(--transition);
        }

        .modal-close:hover {
          color: var(--text-dark);
        }

        .modal-body {
          padding: 30px;
        }

        .form-group {
          margin-bottom: 25px;
        }

        .form-label {
          font-weight: 600;
          color: var(--text-dark);
          margin-bottom: 8px;
          display: block;
        }

        .form-control, .form-select {
          border: 2px solid var(--border-color);
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 1rem;
          transition: var(--transition);
          background-color: #fafafa;
        }

        .form-control:focus, .form-select:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 0.2rem rgba(64, 80, 181, 0.25);
          background-color: white;
        }
        
        .btn-primary-custom:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .upload-message {
          margin-top: 20px;
          padding: 15px 20px;
          border-radius: 8px;
          font-weight: 500;
          animation: fadeIn 0.3s ease;
        }

        .upload-message.uploading {
          background-color: rgba(33, 150, 243, 0.1);
          color: #1976d2;
          border: 1px solid rgba(33, 150, 243, 0.3);
        }

        .upload-message.success {
          background-color: rgba(76, 175, 80, 0.1);
          color: var(--success-color);
          border: 1px solid rgba(76, 175, 80, 0.3);
        }

        .file-input-wrapper {
          position: relative;
          overflow: hidden;
          display: inline-block;
          width: 100%;
        }

        .file-input {
          position: absolute;
          left: -9999px;
        }

        .file-input-label {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          border: 2px dashed var(--border-color);
          border-radius: 8px;
          background-color: #fafafa;
          cursor: pointer;
          transition: var(--transition);
          color: var(--text-light);
          font-weight: 500;
        }

        .file-input-label:hover {
          border-color: var(--primary-color);
          background-color: rgba(64, 80, 181, 0.05);
          color: var(--primary-color);
        }

        .file-input-icon {
          font-size: 1.5rem;
          margin-right: 10px;
        }

        .selected-file {
          margin-top: 10px;
          padding: 8px 12px;
          background-color: rgba(76, 175, 80, 0.1);
          border: 1px solid rgba(76, 175, 80, 0.3);
          border-radius: 4px;
          color: var(--success-color);
          font-size: 0.9rem;
        }

        /* Updated Error Modal Styles to match the main modal */
        .error-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1060;
          padding: 20px;
        }

        .error-modal-content {
          background: white;
          border-radius: 12px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }

        .error-modal-header {
          background-color: var(--danger-color);
          color: white;
          padding: 20px 30px;
          display: flex;
          align-items: center;
          justify-content: between;
          position: relative;
        }

        .error-modal-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
          flex: 1;
        }

        .error-modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: white;
          cursor: pointer;
          padding: 5px;
          transition: var(--transition);
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
        }

        .error-modal-close:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        .error-modal-body {
          padding: 30px;
          max-height: calc(90vh - 160px);
          overflow-y: auto;
        }

        .error-message {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--text-dark);
          margin: 0;
          word-wrap: break-word;
        }

        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
          margin-right: 10px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .dashboard-title {
            font-size: 2rem;
          }
          
          .upload-card, .table-card {
            padding: 25px;
            margin: 0 10px 20px;
          }
          
          .main-content {
            padding: 0 10px;
          }
          
          .navbar-toggler {
            border: none;
            padding: 4px 8px;
          }

          .navbar-toggler:focus {
            box-shadow: none;
          }

          .modal-content, .error-modal-content {
            margin: 10px;
          }

          .modal-body, .error-modal-body {
            padding: 20px;
          }

          .modal-header, .error-modal-header {
            padding: 15px 20px;
          }
        }
      `}</style>

      {/* FontAwesome CDN */}
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
      />

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-custom">
        <div className="container">
          <a className="navbar-brand" href="/">
            Verifi<span>ED</span>
          </a>
          
          <button 
            className="navbar-toggler" 
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className={`collapse navbar-collapse ${showMobileMenu ? 'show' : ''}`}>
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <button 
                  className="btn btn-primary-custom ms-2"
                  style={{padding: '12px 24px', fontSize: '1rem'}}
                  onClick={handleLogout}
                >
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <div className="dashboard-header">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="dashboard-title">
                <i className="fas fa-university me-3"></i>
                Academic Institution Dashboard
              </h1>
              <p className="dashboard-subtitle">
                Issue and manage blockchain-verified academic credentials
              </p>
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

        {/* Upload Button */}
        <div className="text-center mb-4">
          <button 
            className="btn btn-primary-custom"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus-circle me-2"></i>
            Upload Credential
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

      {/* Upload Modal - Static (no outside click dismiss) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-upload me-2"></i>
                Issue New Credential
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="credentialType" className="form-label">
                    <i className="fas fa-certificate me-2"></i>
                    Credential Type
                  </label>
                  <select 
                    id="credentialType" 
                    name="credentialType" 
                    value={formData.credentialType} 
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select Credential Type</option>
                    {credentialTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.type_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="studentAccount" className="form-label">
                    <i className="fas fa-user-graduate me-2"></i>
                    Student Account
                  </label>
                  <select 
                    id="studentAccount" 
                    name="studentAccount" 
                    value={formData.studentAccount} 
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select Student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.first_name} {student.last_name} ({student.public_address?.slice(0, 8)}...)
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
                      {formData.credentialFile ? 'Change Document' : 'Choose Document to Upload'}
                    </label>
                  </div>
                  {formData.credentialFile && (
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
                  <button 
                    type="submit" 
                    className="btn-primary-custom"
                    disabled={uploading}
                  >
                    {uploading && <div className="loading-spinner"></div>}
                    <i className={`fas ${uploading ? '' : 'fa-check-circle'} me-2`}></i>
                    {uploading ? 'Processing...' : 'Issue Credential'}
                  </button>
                </div>

                {uploadMessage && (
                  <div className={`upload-message ${
                    uploading ? 'uploading' : 
                    uploadMessage.includes('Success') ? 'success' : ''
                  }`}>
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
                          <small>{uploadMessage.replace('âœ… Success! ', '')}</small>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal - Static (no outside click dismiss) with same size as main modal */}
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
  );
}

export default AcademicInstitution;