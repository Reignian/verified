// fileName: AcademicInstitutionUI.js

import React, { useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

// The UI component receives all state and handlers as props
const AcademicInstitutionUI = ({
  account,
  institutionName,
  credentialTypes,
  students,
  issuedCredentials,
  credentialStats,
  formData,
  uploading,
  uploadMessage,
  showModal,
  setShowModal,
  showErrorPopup,
  setShowErrorPopup,
  errorMessage,
  // Bulk import props
  showBulkImportModal,
  setShowBulkImportModal,
  bulkImportFile,
  bulkImporting,
  bulkImportMessage,
  handleInputChange,
  handleSubmit,
  handleViewCredential,
  formatDate,
  // Bulk import handlers
  handleBulkImportFileChange,
  handleBulkImportSubmit,
  // Enhanced UI props
  importSuccess,
  showFormatInfo,
  setShowFormatInfo,
  resetBulkImportForm,
  handleCloseBulkImportModal,
  // NEW props for enhanced modal
  showCustomTypeInput,
  customCredentialType,
  handleCustomTypeChange,
  studentSearchTerm,
  handleStudentSearchChange,
  // NEW: Student management handler
  handleShowStudentManagement
}) => {
  // Filter students based on the search term for the new input
  const filteredStudents = useMemo(() => {
    if (!studentSearchTerm) {
      return students;
    }
    return students.filter(student =>
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(studentSearchTerm.toLowerCase())
    );
  }, [students, studentSearchTerm]);

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f9f9f9', minHeight: '100vh', paddingTop: '80px' }}>
      <style>{`
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
          margin: 0 5px;
        }

        .btn-secondary-custom {
          background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
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
          margin: 0 5px;
        }

        .btn-success-custom {
          background: linear-gradient(135deg, var(--success-color), #388e3c);
          border: none;
          color: white;
          padding: 14px 30px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1.1rem;
          transition: var(--transition);
          cursor: pointer;
          min-width: 200px;
          text-decoration: none;
          margin: 0 5px;
        }

        .btn-primary-custom:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(64, 80, 181, 0.3);
          background-color: var(--accent-color);
          border-color: var(--accent-color);
          color: white;
        }

        .btn-secondary-custom:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(121, 134, 203, 0.3);
          color: white;
        }

        .btn-success-custom:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
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
        
        .btn-primary-custom:disabled, .btn-secondary-custom:disabled {
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
          white-space: pre-line;
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

        .button-group {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-bottom: 30px;
        }

        .format-info {
          background-color: rgba(64, 80, 181, 0.05);
          border: 1px solid rgba(64, 80, 181, 0.1);
          border-radius: 8px;
          padding: 15px;
          margin-top: 25px;
          color: var(--primary-color);
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .format-info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          font-weight: 600;
          color: var(--primary-color);
        }

        .format-info-header:hover {
          color: var(--accent-color);
        }

        .format-info ul {
          margin-top: 10px;
          margin-bottom: 10px;
          padding-left: 20px;
        }

        .format-info li {
          margin-bottom: 5px;
        }

        .format-example {
          background-color: #f8f9fa;
          border-left: 4px solid var(--primary-color);
          padding: 10px 15px;
          margin-top: 10px;
          font-family: 'Courier New', monospace;
          font-size: 0.85rem;
          border-radius: 0 4px 4px 0;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
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

          .button-group {
            flex-direction: column;
            align-items: center;
          }

          .btn-primary-custom, .btn-secondary-custom, .btn-success-custom {
            width: 100%;
            max-width: 300px;
            margin: 5px 0;
          }
        }
      `}</style>
      
      {/* FontAwesome CDN */}
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
      />

      {/* Header Section */}
      <div className="dashboard-header">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="dashboard-title">
                <i className="fas fa-university me-3"></i>
                {institutionName ? `${institutionName} Dashboard` : 'Academic Institution Dashboard'}
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

        {/* Action Buttons */}
        <div className="button-group">
          <button 
            className="btn btn-primary-custom"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus-circle me-2"></i>
            Issue Credential
          </button>
          
          <button 
            className="btn btn-secondary-custom"
            onClick={() => setShowBulkImportModal(true)}
          >
            <i className="fas fa-users me-2"></i>
            Bulk Import Students
          </button>
          
          {/* NEW: Student Management Button */}
          <button 
            className="btn btn-success-custom"
            onClick={handleShowStudentManagement}
          >
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

      {/* Issue Credential Modal */}
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
                    required={!showCustomTypeInput}
                  >
                    <option value="">Select Credential Type</option>
                    {credentialTypes.map((type) => (
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
                      value={customCredentialType}
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
                    value={studentSearchTerm}
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
                    value={formData.studentAccount} 
                    onChange={handleInputChange}
                    className="form-select"
                    required
                    size={Math.min(5, Math.max(2, filteredStudents.length + 1))}
                  >
                    <option value="" disabled={!!formData.studentAccount}>
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
      )}

      {/* Enhanced Bulk Import Students Modal */}
      {showBulkImportModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-users me-2"></i>
                Bulk Import Students
              </h3>
              <button 
                className="modal-close"
                onClick={handleCloseBulkImportModal || (() => setShowBulkImportModal(false))}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {importSuccess ? (
                // Success Message View
                <div className="text-center">
                  <div className={`upload-message success`} style={{display: 'block'}}>
                    <i className="fas fa-check-circle fa-2x mb-3 text-success"></i>
                    <h5 className="mb-3">Import Successful!</h5>
                    <pre style={{textAlign: 'left', whiteSpace: 'pre-wrap', fontSize: '0.9rem'}}>
                      {bulkImportMessage.replace('✅ Import completed! ', '')}
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
                        onClick={() => setShowFormatInfo ? setShowFormatInfo(!showFormatInfo) : null}
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
      )}

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
  );
};

export default AcademicInstitutionUI;