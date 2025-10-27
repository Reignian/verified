// fileName: IssuedCredentialsTable.js

import React, { useState } from 'react';
import './AcademicInstitution.css';

// Pinata gateway URL from environment variable
const PINATA_GATEWAY = process.env.REACT_APP_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';

function IssuedCredentialsTable({ credentials, onView, onDelete, onIssueCredential }) {
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Get user type from localStorage to check if admin or staff
  const userType = localStorage.getItem('userType');
  const isAdmin = userType === 'institution';
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleView = (ipfsCid) => {
    if (typeof onView === 'function') return onView(ipfsCid);
    const ipfsUrl = `${PINATA_GATEWAY}/${ipfsCid}`;
    window.open(ipfsUrl, '_blank');
  };

  const handleDownload = async (ipfsCid, studentName, credentialType) => {
    try {
      const url = `${PINATA_GATEWAY}/${ipfsCid}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Clean filename: remove special characters and spaces, replace with underscores
      const cleanStudentName = studentName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const cleanCredentialType = credentialType.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      link.download = `${cleanStudentName}-${cleanCredentialType}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const handleDelete = async (credentialId, studentName, credentialType) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the credential "${credentialType}" for ${studentName}?\n\nThis will mark the credential as deleted.`
    );
    
    if (!confirmDelete) return;

    setDeletingId(credentialId);
    
    if (typeof onDelete === 'function') {
      try {
        await onDelete(credentialId);
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete credential. Please try again.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Count deleted credentials
  const deletedCount = (credentials || []).filter(c => c.status === 'deleted').length;

  // Filter credentials based on search term, date, and status
  const filteredCredentials = (credentials || []).filter((credential) => {
    // Status filter (show deleted or active based on toggle)
    const statusMatch = showDeleted 
      ? credential.status === 'deleted'
      : credential.status !== 'deleted';

    // Search filter (student name or credential type)
    const searchMatch = searchTerm === '' ||
      credential.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credential.credential_type?.toLowerCase().includes(searchTerm.toLowerCase());

    // Date filter (exact date match)
    let dateMatch = true;
    if (filterDate) {
      const credentialDate = new Date(credential.date_issued).toDateString();
      const selectedDate = new Date(filterDate).toDateString();
      dateMatch = credentialDate === selectedDate;
    }

    return statusMatch && searchMatch && dateMatch;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFilterDate('');
    setShowDeleted(false);
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  const hasActiveFilters = searchTerm !== '' || filterDate !== '' || showDeleted;

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDate, showDeleted]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredCredentials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCredentials = filteredCredentials.slice(startIndex, endIndex);

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
    <div className="table-card">
      {/* Filters Section */}
      <div className="credentials-filters">
        <div className="filters-row">
          <div className="filter-group search-group">
            <label htmlFor="search">
              <i className="fas fa-search"></i>
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by student name or credential type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="filter-group date-group">
            <label htmlFor="filterDate">
              <i className="fas fa-calendar"></i>
              Filter by Date
            </label>
            <input
              type="date"
              id="filterDate"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="form-control"
            />
          </div>

          {isAdmin && (
            <div className="filter-group">
              <label htmlFor="statusFilter">
                <i className="fas fa-filter"></i>
                Status
              </label>
              <select
                id="statusFilter"
                className="form-control"
                value={showDeleted ? 'deleted' : 'active'}
                onChange={(e) => setShowDeleted(e.target.value === 'deleted')}
              >
                <option value="active">Active Credentials</option>
                <option value="deleted">Deleted Credentials</option>
              </select>
            </div>
          )}

          {hasActiveFilters && (
            <div className="filter-group">
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

        <div className="filter-group">
            <label>&nbsp;</label>
            <button 
              className="btn btn-primary-custom" 
              onClick={onIssueCredential}
            >
              <i className="fas fa-plus-circle me-2"></i>
              Issue Credential
            </button>
          </div>        
      </div>

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Credential Type</th>
              <th>Date Issued</th>
              <th>Transaction ID</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {(currentCredentials && currentCredentials.length > 0) ? (
              currentCredentials.map((credential) => (
                <tr key={credential.id} className={credential.status === 'deleted' ? 'deleted-credential-row' : ''}>
                  <td>
                    <strong>{credential.student_name}</strong>
                  </td>
                  <td>{credential.credential_type}</td>
                  <td>{formatDate(credential.date_issued)}</td>
                  <td>
                    {credential.transaction_id ? (
                      <a 
                        href={`https://amoy.polygonscan.com/tx/${credential.transaction_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transaction-link"
                        title="View transaction on Polygon Amoy Explorer"
                      >
                        <i className="fas fa-external-link-alt me-1"></i>
                        {credential.transaction_id.substring(0, 8)}...{credential.transaction_id.substring(credential.transaction_id.length - 6)}
                      </a>
                    ) : (
                      <span className="text-muted">N/A</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge status-${credential.status}`}>
                      {credential.status === 'blockchain_verified' ? 'Verified' : 'Deleted'}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <button
                        className="btn btn-primary-custom btn-sm"
                        onClick={() => handleView(credential.ipfs_cid)}
                        title="View credential document"
                      >
                        <i className="fas fa-eye me-1"></i>
                        View
                      </button>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleDownload(credential.ipfs_cid, credential.student_name, credential.credential_type)}
                        title="Download credential document"
                      >
                        <i className="fas fa-download me-1"></i>
                        Download
                      </button>
                      {isAdmin && credential.status !== 'deleted' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(credential.id, credential.student_name, credential.credential_type)}
                          title="Delete credential"
                          disabled={deletingId === credential.id}
                        >
                          <i className="fas fa-trash me-1"></i>
                          {deletingId === credential.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">
                  <i className="fas fa-inbox fa-2x mb-3 d-block"></i>
                  No credentials issued yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filteredCredentials.length > itemsPerPage && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {startIndex + 1} - {Math.min(endIndex, filteredCredentials.length)} of {filteredCredentials.length} credentials
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={handlePrevious}
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i>
              Previous
            </button>

            <div className="pagination-numbers">
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                ) : (
                  <button
                    key={page}
                    className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                )
              ))}
            </div>

            <button
              className="pagination-btn"
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
  );
}

export default IssuedCredentialsTable;
