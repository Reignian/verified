// fileName: StudentManagement.js (Final updated version)

import React, { useState, useEffect } from 'react';
import { 
  fetchStudents, 
  fetchStudentCredentialCount, 
  fetchStudentCredentialsForManagement // Updated to use the new function
} from '../services/apiService';

const StudentManagement = ({ institutionId, onBack }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentCredentials, setStudentCredentials] = useState([]);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentialsLoading, setCredentialsLoading] = useState(false);

  useEffect(() => {
    loadStudents();
  }, [institutionId]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const studentsData = await fetchStudents(institutionId);
      
      // Fetch credential count for each student
      const studentsWithCredentials = await Promise.all(
        studentsData.map(async (student) => {
          try {
            const credentialCount = await fetchStudentCredentialCount(student.id);
            return {
              ...student,
              credential_count: credentialCount.total_credentials || 0
            };
          } catch (error) {
            console.error(`Error fetching credential count for student ${student.id}:`, error);
            return {
              ...student,
              credential_count: 0
            };
          }
        })
      );

      setStudents(studentsWithCredentials);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCredentials = async (student) => {
    try {
      setSelectedStudent(student);
      setCredentialsLoading(true);
      setShowCredentialsModal(true);
      
      // Use the new dedicated function for management view
      const credentials = await fetchStudentCredentialsForManagement(student.id);
      console.log('Fetched credentials for management:', credentials); // Debug log
      setStudentCredentials(credentials);
    } catch (error) {
      console.error('Error loading student credentials:', error);
      setStudentCredentials([]);
    } finally {
      setCredentialsLoading(false);
    }
  };

  // FIXED: Use the same URL pattern as the main dashboard
  const handleViewCredential = (ipfsCid) => {
    if (!ipfsCid) {
      console.error('No IPFS CID provided');
      return;
    }
    const ipfsUrl = `https://amethyst-tropical-jackal-879.mypinata.cloud/ipfs/${ipfsCid}`;
    console.log('Opening URL:', ipfsUrl); // Debug log
    window.open(ipfsUrl, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f9f9f9', minHeight: '100vh', paddingTop: '100px' }}>
      <style>{`
        /* Reuse the same CSS styles from AcademicInstitutionUI */
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

        .btn-sm {
          padding: 8px 16px;
          font-size: 0.9rem;
          min-width: auto;
        }

        .page-header {
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
          color: white;
          padding: 40px 0;
          margin-bottom: 40px;
          /* FIXED: Account for fixed navbar */
          position: relative;
          top: 0;
          z-index: 999;
        }

        .page-title {
          font-size: 2.2rem;
          font-weight: 700;
          margin-bottom: 10px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .page-subtitle {
          font-size: 1rem;
          opacity: 0.9;
          margin-bottom: 20px;
        }

        .back-button {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 500;
          transition: var(--transition);
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.3);
          color: white;
          transform: translateY(-1px);
        }

        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .table-card {
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

        .table-responsive {
          border-radius: 8px;
          overflow: hidden;
        }

        .table {
          margin-bottom: 0;
          width: 100%;
          border-collapse: collapse;
        }

        .table th {
          background-color: #f8f9fa;
          border-bottom: 2px solid var(--border-color);
          font-weight: 600;
          color: var(--text-dark);
          padding: 15px;
          text-align: left;
        }

        .table td {
          padding: 15px;
          vertical-align: middle;
          border-bottom: 1px solid var(--border-color);
        }

        .table tbody tr:hover {
          background-color: rgba(64, 80, 181, 0.05);
        }

        .credential-badge {
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          display: inline-block;
          min-width: 30px;
          text-align: center;
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
          max-width: 800px;
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

        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(64, 80, 181, 0.3);
          border-radius: 50%;
          border-top-color: var(--primary-color);
          animation: spin 1s ease-in-out infinite;
          margin-right: 10px;
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

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .page-title {
            font-size: 1.8rem;
          }
          
          .table-card {
            padding: 25px;
            margin: 0 10px 20px;
          }
          
          .main-content {
            padding: 0 10px;
          }

          .modal-content {
            margin: 10px;
          }

          .modal-body, .modal-header {
            padding: 20px;
          }

          .table {
            font-size: 0.9rem;
          }

          .table th, .table td {
            padding: 10px;
          }
        }
      `}</style>

      {/* FontAwesome CDN */}
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
      />

      {/* Header Section */}
      <div className="page-header">
        <div className="container">
          <div className="row align-items-center">
            <div className="col">
              <button className="back-button" onClick={onBack}>
                <i className="fas fa-arrow-left me-2"></i>
                Back to Dashboard
              </button>
              <h1 className="page-title mt-3">
                <i className="fas fa-users me-3"></i>
                Student Management
              </h1>
              <p className="page-subtitle">
                Manage students and view their credential records
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Students Table */}
        <div className="table-card">
          <h2 className="card-title">
            <div className="card-icon">
              <i className="fas fa-user-graduate"></i>
            </div>
            Registered Students
          </h2>

          {loading ? (
            <div className="text-center py-5">
              <div className="loading-spinner"></div>
              Loading students...
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Full Name</th>
                    <th>Credentials Issued</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length > 0 ? (
                    students.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <strong>{student.student_id}</strong>
                        </td>
                        <td>
                          {student.first_name} {student.middle_name ? student.middle_name + ' ' : ''}{student.last_name}
                        </td>
                        <td>
                          <span className="credential-badge">
                            {student.credential_count}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-primary-custom btn-sm"
                            onClick={() => handleViewCredentials(student)}
                            title="View student credentials"
                          >
                            <i className="fas fa-eye me-1"></i>
                            View Credentials
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">
                        <i className="fas fa-user-slash fa-2x mb-3 d-block"></i>
                        No students registered yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Student Credentials Modal */}
      {showCredentialsModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowCredentialsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-certificate me-2"></i>
                {selectedStudent.first_name} {selectedStudent.last_name}'s Credentials
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowCredentialsModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <strong>Student ID:</strong> {selectedStudent.student_id}<br />
                <strong>Total Credentials:</strong> {selectedStudent.credential_count}
              </div>

              {credentialsLoading ? (
                <div className="text-center py-4">
                  <div className="loading-spinner"></div>
                  Loading credentials...
                </div>
              ) : studentCredentials.length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Credential Type</th>
                        <th>Date Issued</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentCredentials.map((credential) => (
                        <tr key={credential.id}>
                          <td>{credential.credential_type || 'N/A'}</td>
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
                              disabled={!credential.ipfs_cid}
                            >
                              <i className="fas fa-eye me-1"></i>
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="fas fa-certificate fa-2x mb-3 d-block"></i>
                  No credentials issued to this student yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;