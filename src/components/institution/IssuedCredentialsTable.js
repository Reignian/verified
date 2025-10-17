// fileName: IssuedCredentialsTable.js

import React, { useState } from 'react';
import './AcademicInstitution.css';

// Pinata gateway URL from environment variable
const PINATA_GATEWAY = process.env.REACT_APP_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';

function IssuedCredentialsTable({ credentials, onView, onDelete }) {
  const [deletingId, setDeletingId] = useState(null);
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

  return (
    <div className="table-card">

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
            {(credentials && credentials.length > 0) ? (
              credentials.map((credential) => (
                <tr key={credential.id}>
                  <td>
                    <strong>{credential.student_name}</strong>
                  </td>
                  <td>{credential.credential_type}</td>
                  <td>{formatDate(credential.date_issued)}</td>
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
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(credential.id, credential.student_name, credential.credential_type)}
                        title="Delete credential"
                        disabled={deletingId === credential.id}
                      >
                        <i className="fas fa-trash me-1"></i>
                        {deletingId === credential.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
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
  );
}

export default IssuedCredentialsTable;
