// fileName: StudentManagement.js (Final updated version)

import React, { useState, useEffect } from 'react';
import './StudentManagement.css';
import AddStudentModal from './AddStudentModal';
import { 
  fetchStudents, 
  fetchStudentCredentialsForManagement
} from '../../services/institutionApiService';
import { 
  fetchStudentCredentialCount
} from '../../services/studentApiService';

// Pinata gateway URL from environment variable
const PINATA_GATEWAY = process.env.REACT_APP_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';

const StudentManagement = ({ institutionId, onBack, showBackButton = false, onOpenBulkImport, refreshTrigger }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentCredentials, setStudentCredentials] = useState([]);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  useEffect(() => {
    loadStudents();
  }, [institutionId, refreshTrigger]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const studentsData = await fetchStudents(institutionId);
      const studentsWithCredentials = await Promise.all(
        studentsData.map(async (student) => {
          try {
            const credentialCount = await fetchStudentCredentialCount(student.id);
            return {
              ...student,
              credential_count: credentialCount.total_credentials || 0,
            };
          } catch (error) {
            console.error(`Error fetching credential count for student ${student.id}:`, error);
            return {
              ...student,
              credential_count: 0,
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
      const credentials = await fetchStudentCredentialsForManagement(student.id);
      setStudentCredentials(credentials);
    } catch (error) {
      console.error('Error loading student credentials:', error);
      setStudentCredentials([]);
    } finally {
      setCredentialsLoading(false);
    }
  };

  const handleViewCredential = (ipfsCid) => {
    if (!ipfsCid) {
      console.error('No IPFS CID provided');
      return;
    }
    const ipfsUrl = `${PINATA_GATEWAY}/${ipfsCid}`;
    window.open(ipfsUrl, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const handleStudentAdded = () => {
    // Reload students list after adding a new student
    loadStudents();
  };

  return (
    <div className="student-management">
      {/* Actions */}
      <div className="d-flex">
        <button
          className="btn btn-primary-custom"
          onClick={() => setShowAddStudentModal(true)}
        >
          <i className="fas fa-user-plus me-2"></i>
          Add Student
        </button>
        <button
          className="btn btn-primary-custom"
          onClick={() => onOpenBulkImport && onOpenBulkImport()}
        >
          <i className="fas fa-users me-2"></i>
          Bulk Import Students
        </button>
      </div>
      {/* Students Table */}
      <div className="table-card">
        <h2 className="card-title">
          <div className="card-icon">
            <i className="fas fa-user-graduate"></i>
          </div>
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
                  <th>Program</th>
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
                        {student.program_name ? (
                          <span className="program-badge">
                            {student.program_code ? `${student.program_code} - ` : ''}{student.program_name}
                          </span>
                        ) : (
                          <span className="text-muted">No program</span>
                        )}
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

      {/* Add Student Modal */}
      <AddStudentModal
        show={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        institutionId={institutionId}
        onStudentAdded={handleStudentAdded}
      />
    </div>
  );
};

export default StudentManagement;

