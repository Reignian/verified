// fileName: IssuedCredentialsTable.js

import React from 'react';
import './AcademicInstitution.css';

function IssuedCredentialsTable({ credentials, onView }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleView = (ipfsCid) => {
    if (typeof onView === 'function') return onView(ipfsCid);
    const ipfsUrl = `https://amethyst-tropical-jackal-879.mypinata.cloud/ipfs/${ipfsCid}`;
    window.open(ipfsUrl, '_blank');
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
                      {credential.status === 'blockchain_verified' ? 'Verified' : 'Uploaded'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-primary-custom btn-sm"
                      onClick={() => handleView(credential.ipfs_cid)}
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
  );
}

export default IssuedCredentialsTable;
