// fileName: StudentManagement.js (Final updated version)

import React, { useState, useEffect } from 'react';
import './StudentManagement.css';
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

