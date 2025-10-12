// fileName: CredentialMonitoring.js

import React, { useState, useEffect } from 'react';
import { fetchAllCredentials } from '../../services/adminApiService';

// Pinata gateway URL from environment variable
const PINATA_GATEWAY = process.env.REACT_APP_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';

function CredentialMonitoring() {
  const [credentials, setCredentials] = useState([]);
  const [filteredCredentials, setFilteredCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    institution: '',
    credentialType: '',
    search: ''
  });

  useEffect(() => {
    loadCredentials();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [credentials, filters]);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const data = await fetchAllCredentials();
      setCredentials(data);
      setError('');
    } catch (error) {
      console.error('Failed to load credentials:', error);
      setError('Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...credentials];

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(cred => cred.status === filters.status);
    }

    // Institution filter
    if (filters.institution) {
      filtered = filtered.filter(cred => 
        cred.institution_name?.toLowerCase().includes(filters.institution.toLowerCase())
      );
    }

    // Credential type filter
    if (filters.credentialType) {
      filtered = filtered.filter(cred => 
        cred.credential_type?.toLowerCase().includes(filters.credentialType.toLowerCase())
      );
    }

    // Search filter (name, student ID)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(cred => 
        cred.owner_first_name?.toLowerCase().includes(searchLower) ||
        cred.owner_last_name?.toLowerCase().includes(searchLower) ||
        cred.student_id?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredCredentials(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'uploaded': { class: 'bg-warning', text: 'Uploaded' },
      'blockchain_verified': { class: 'bg-success', text: 'Verified' },
      'pending': { class: 'bg-info', text: 'Pending' },
      'failed': { class: 'bg-danger', text: 'Failed' }
    };
    
    const config = statusConfig[status] || { class: 'bg-secondary', text: status };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUniqueValues = (field) => {
    return [...new Set(credentials.map(cred => cred[field]).filter(Boolean))];
  };

  return (
    <div className="credential-monitoring">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Credential Monitoring</h2>
          <p className="text-muted">Monitor all credentials uploaded and verified in the system</p>
        </div>
        <button 
          className="btn btn-outline-primary"
          onClick={loadCredentials}
          disabled={loading}
        >
          <i className="fas fa-sync-alt me-2"></i>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <h6 className="card-title mb-3">
            <i className="fas fa-filter me-2"></i>
            Filters
          </h6>
          <div className="row g-3">
            <div className="col-md-3">
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="uploaded">Uploaded</option>
                <option value="blockchain_verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <div className="col-md-3">
              <select
                className="form-select"
                value={filters.institution}
                onChange={(e) => handleFilterChange('institution', e.target.value)}
              >
                <option value="">All Institutions</option>
                {getUniqueValues('institution_name').map(institution => (
                  <option key={institution} value={institution}>{institution}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-3">
              <select
                className="form-select"
                value={filters.credentialType}
                onChange={(e) => handleFilterChange('credentialType', e.target.value)}
              >
                <option value="">All Types</option>
                {getUniqueValues('credential_type').map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or student ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted">
              Showing {filteredCredentials.length} of {credentials.length} credentials
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Student</th>
                  <th>Credential Type</th>
                  <th>Institution</th>
                  <th>Status</th>
                  <th>Verifications</th>
                  <th>Created</th>
                  <th>Last Verified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCredentials.map((credential) => (
                  <tr key={credential.id}>
                    <td>
                      <div>
                        <strong>
                          {credential.owner_first_name} {credential.owner_last_name}
                        </strong>
                        <br />
                        <small className="text-muted">{credential.student_id}</small>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-info">
                        {credential.credential_type}
                      </span>
                    </td>
                    <td>{credential.institution_name}</td>
                    <td>{getStatusBadge(credential.status)}</td>
                    <td>
                      <span className="badge bg-primary">
                        {credential.verification_count || 0}
                      </span>
                    </td>
                    <td>{formatDate(credential.created_at)}</td>
                    <td>
                      {credential.last_verified ? 
                        formatDate(credential.last_verified) : 
                        <span className="text-muted">Never</span>
                      }
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={() => window.open(`${PINATA_GATEWAY}/${credential.ipfs_cid}`, '_blank')}
                          title="View on IPFS"
                          disabled={!credential.ipfs_cid}
                        >
                          <i className="fas fa-external-link-alt"></i>
                        </button>
                        {credential.blockchain_id && (
                          <button
                            className="btn btn-sm btn-outline-success"
                            title={`Blockchain ID: ${credential.blockchain_id}`}
                          >
                            <i className="fas fa-link"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCredentials.length === 0 && !loading && (
              <div className="text-center py-5">
                <i className="fas fa-certificate fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">No credentials found</h5>
                <p className="text-muted">
                  {credentials.length === 0 
                    ? 'No credentials have been uploaded yet'
                    : 'No credentials match your current filters'
                  }
                </p>
                {credentials.length > 0 && (
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => setFilters({ status: '', institution: '', credentialType: '', search: '' })}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default CredentialMonitoring;