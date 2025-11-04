// fileName: StudentManagement.js (Final updated version)

import React, { useState, useEffect } from 'react';
import './StudentManagement.css';
import AddStudentModal from './AddStudentModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { 
  fetchStudents, 
  fetchStudentCredentialsForManagement,
  deleteStudent
} from '../../services/institutionApiService';
import { 
  fetchStudentCredentialCount
} from '../../services/studentApiService';
import { logStudentDeleted } from '../../services/activityLogService';

// Pinata gateway URL from environment variable
const PINATA_GATEWAY = process.env.REACT_APP_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';

const StudentManagement = ({ institutionId, onBack, showBackButton = false, onOpenBulkImport, refreshTrigger, onStudentListChanged }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentCredentials, setStudentCredentials] = useState([]);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalSuccess, setDeleteModalSuccess] = useState('');
  const [deleteModalError, setDeleteModalError] = useState('');
  
  // Get user type from localStorage to check if admin or staff
  const userType = localStorage.getItem('userType');
  const isAdmin = userType === 'institution';

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

  const handleDeleteStudent = (student) => {
    if (student.credential_count > 0) {
      setDeleteModalError('Cannot delete student with blockchain-verified credentials');
      setShowDeleteModal(true);
      setStudentToDelete(student);
      return;
    }

    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;

    setDeleting(true);
    setDeleteModalError('');

    try {
      await deleteStudent(studentToDelete.id);
      
      // Log the activity
      const userId = localStorage.getItem('userId');
      const studentFullName = `${studentToDelete.first_name} ${studentToDelete.middle_name ? studentToDelete.middle_name + ' ' : ''}${studentToDelete.last_name}`.trim();
      await logStudentDeleted(institutionId, userId, studentFullName);
      
      // Show success message in modal
      setDeleteModalSuccess(`${studentFullName} deleted successfully`);
      
      // Refresh the list
      loadStudents();
      if (onStudentListChanged) {
        onStudentListChanged();
      }
      
      // Auto-close modal after 2 seconds
      setTimeout(() => {
        setShowDeleteModal(false);
        setStudentToDelete(null);
        setDeleteModalSuccess('');
      }, 2000);
    } catch (error) {
      console.error('Error deleting student:', error);
      setDeleteModalError(error.response?.data?.error || 'Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (!deleting && !deleteModalSuccess) {
      setShowDeleteModal(false);
      setStudentToDelete(null);
      setDeleteModalError('');
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
    // Also refresh parent component's students list
    if (onStudentListChanged) {
      onStudentListChanged();
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter((student) => {
    if (searchTerm === '') return true;
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${student.first_name} ${student.middle_name || ''} ${student.last_name}`.toLowerCase();
    const programName = (student.program_name || '').toLowerCase();
    const programCode = (student.program_code || '').toLowerCase();
    
    return student.student_id.toLowerCase().includes(searchLower) ||
           fullName.includes(searchLower) ||
           programName.includes(searchLower) ||
           programCode.includes(searchLower);
  });

  const clearFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm !== '';

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="student-management">
      <div className="table-card">
        <div className="student-filters">
          <div className="student-filters-row">
            <div className="student-filter-group search-group">
              <label htmlFor="studentSearch">
                <i className="fas fa-search"></i>
                Search
              </label>
              <input
                type="text"
                id="studentSearch"
                placeholder="Search by student ID, name, or program..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
              />
            </div>

            {hasActiveFilters && (
              <div className="student-filter-group">
                <label>&nbsp;</label>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={clearFilters}
                  title="Clear all filters"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
          <div className="student-filters-row">
            <div className="student-filter-group">
              <label>&nbsp;</label>
              <button
                className="btn btn-primary-custom"
                onClick={() => setShowAddStudentModal(true)}
              >
                <i className="fas fa-user-plus me-2"></i>
                Add Student
              </button>
            </div>

            <div className="student-filter-group">
              <label>&nbsp;</label>
              <button
                className="btn btn-primary-custom"
                onClick={() => onOpenBulkImport && onOpenBulkImport()}
              >
                <i className="fas fa-users me-2"></i>
                Bulk Import
              </button>
            </div>
          </div>
        </div>

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
                {currentStudents.length > 0 ? (
                  currentStudents.map((student) => (
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
                            {student.program_name}  <strong>{student.program_code ? `(${student.program_code})` : ''} </strong>
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
                          className="btn btn-primary-custom btn-sm me-2"
                          onClick={() => handleViewCredentials(student)}
                          title="View student credentials"
                        >
                          <i className="fas fa-eye me-1"></i>
                          View Credentials
                        </button>
                        {isAdmin && student.credential_count === 0 && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteStudent(student)}
                            title="Delete student (no blockchain-verified credentials)"
                          >
                            <i className="fas fa-trash me-1"></i>
                            Delete
                          </button>
                        )}
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

        {/* Pagination Controls */}
        {!loading && filteredStudents.length > itemsPerPage && (
          <div className="student-pagination-container">
            <div className="student-pagination-info">
              Showing {startIndex + 1} - {Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length} students
            </div>
            <div className="student-pagination-controls">
              <button
                className="student-pagination-btn"
                onClick={handlePrevious}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
                Previous
              </button>

              <div className="student-pagination-numbers">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="student-pagination-ellipsis">...</span>
                  ) : (
                    <button
                      key={page}
                      className={`student-pagination-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              <button
                className="student-pagination-btn"
                onClick={handleNext}
                disabled={currentPage === totalPages}
              >
                Next
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Credentials Modal */}
      {showCredentialsModal && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-content">
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={confirmDeleteStudent}
        studentName={studentToDelete ? `${studentToDelete.first_name} ${studentToDelete.middle_name ? studentToDelete.middle_name + ' ' : ''}${studentToDelete.last_name}` : ''}
        loading={deleting}
        success={deleteModalSuccess}
        error={deleteModalError}
      />
    </div>
  );
};

export default StudentManagement;

