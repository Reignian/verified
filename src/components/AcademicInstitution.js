import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import { fetchCredentialTypes, fetchStudents, uploadCredential } from '../services/apiService';
import blockchainService from '../services/blockchainService';

function AcademicInstitution() {
  // State from original component
  const [account, setAccount] = useState(null);
  const [credentialTypes, setCredentialTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    credentialType: '',
    studentAccount: '',
    credentialFile: null
  });
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // State and hooks for navbar
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getAccount = async () => {
      if (window.ethereum) {
        try {
          let accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          
          if (accounts.length === 0) {
            accounts = await window.ethereum.request({
              method: 'eth_requestAccounts'
            });
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
        const [types, studentData] = await Promise.all([
          fetchCredentialTypes(),
          fetchStudents()
        ]);
        setCredentialTypes(types);
        setStudents(studentData);
      } catch (error) {
        console.error('Data loading failed:', error);
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
    setFormData(prevState => ({
      ...prevState,
      [name]: files ? files[0] : value
    }));
    if (uploadMessage) setUploadMessage('');
  };

  const resetForm = () => {
    setFormData({
      credentialType: '',
      studentAccount: '',
      credentialFile: null
    });
    const fileInput = document.getElementById('credentialFile');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.credentialType || !formData.studentAccount || !formData.credentialFile) {
      setUploadMessage('Please fill all required fields');
      return;
    }

    const loggedInUserId = localStorage.getItem('userId');
    console.log('Checking userId from localStorage:', loggedInUserId);
    console.log('All localStorage items:', Object.keys(localStorage).map(key => `${key}: ${localStorage.getItem(key)}`));
    
    if (!loggedInUserId) {
      setUploadMessage('Please log in again');
      return;
    }
    
    setUploading(true);
    setUploadMessage('Uploading...');
    
    try {
      const credentialData = {
        credential_type_id: parseInt(formData.credentialType),
        owner_id: parseInt(formData.studentAccount),
        sender_id: parseInt(loggedInUserId)
      };
      
      const response = await uploadCredential(credentialData, formData.credentialFile);
      const blockchainResult = await blockchainService.issueCredential(
        response.ipfs_hash, 
        formData.studentAccount.toString()
      );
      
      const updateResponse = await fetch('http://localhost:3001/api/update-blockchain-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential_id: response.credential_id,
          blockchain_id: blockchainResult.credentialId
        }),
      });
      
      if (!updateResponse.ok) {
        throw new Error('Database update failed');
      }
      
      setUploadMessage(`✅ Success! IPFS: ${response.ipfs_hash} | Blockchain: ${blockchainResult.credentialId} | TX: ${blockchainResult.transactionHash}`);
      resetForm();
      
    } catch (error) {
      setUploadMessage(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
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
          text-decoration: none; /* Added for anchor tags */
        }

        .btn-primary-custom:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(64, 80, 181, 0.3);
          background-color: var(--accent-color);
          border-color: var(--accent-color);
          color: white;
        }
        
        /* Original styles from AcademicInstitution.js */
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
          max-width: 800px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .upload-card {
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

        .upload-message.error {
          background-color: rgba(244, 67, 54, 0.1);
          color: var(--danger-color);
          border: 1px solid rgba(244, 67, 54, 0.3);
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

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
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

        @media (max-width: 768px) {
          .dashboard-title {
            font-size: 2rem;
          }
          
          .upload-card {
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
        }
      `}</style>

      {/* FontAwesome CDN */}
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
      />

      {/* Navbar - Modified */}
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
            <div className="stat-number">{credentialTypes.length}</div>
            <p className="stat-label">Credential Types</p>
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

        {/* Upload Form */}
        <div className="upload-card">
          <h2 className="card-title">
            <div className="card-icon">
              <i className="fas fa-upload"></i>
            </div>
            Issue New Credential
          </h2>

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
                uploadMessage.includes('Success') ? 'success' : 'error'
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
                      <small>{uploadMessage.replace('✅ Success! ', '')}</small>
                    </div>
                  </div>
                ) : (
                  <div className="d-flex align-items-center">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {uploadMessage}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Info Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <div className="stat-card text-start">
              <h3 className="h5 mb-3">
                <i className="fas fa-info-circle text-primary me-2"></i>
                How It Works
              </h3>
              <ul className="list-unstyled">
                <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Select credential type and student</li>
                <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Upload official document</li>
                <li className="mb-2"><i className="fas fa-check text-success me-2"></i>System creates IPFS hash</li>
                <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Records on blockchain</li>
              </ul>
            </div>
          </div>
          <div className="col-md-6">
            <div className="stat-card text-start">
              <h3 className="h5 mb-3">
                <i className="fas fa-shield-alt text-success me-2"></i>
                Security Features
              </h3>
              <ul className="list-unstyled">
                <li className="mb-2"><i className="fas fa-lock text-primary me-2"></i>Immutable blockchain records</li>
                <li className="mb-2"><i className="fas fa-lock text-primary me-2"></i>Cryptographic signatures</li>
                <li className="mb-2"><i className="fas fa-lock text-primary me-2"></i>IPFS distributed storage</li>
                <li className="mb-2"><i className="fas fa-lock text-primary me-2"></i>MetaMask wallet integration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AcademicInstitution;