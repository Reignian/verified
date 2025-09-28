// fileName: VerificationStats.js

import React, { useState, useEffect } from 'react';
import { fetchCredentialVerificationStats } from '../services/adminApiService';

function VerificationStats() {
  const [verificationStats, setVerificationStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState('verification_count');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    loadVerificationStats();
  }, []);

  useEffect(() => {
    sortData();
  }, [sortField, sortDirection, verificationStats]);

  const loadVerificationStats = async () => {
    try {
      setLoading(true);
      const data = await fetchCredentialVerificationStats();
      setVerificationStats(data);
      setError('');
    } catch (error) {
      console.error('Failed to load verification stats:', error);
      setError('Failed to load verification statistics');
    } finally {
      setLoading(false);
    }
  };

  const sortData = () => {
    const sorted = [...verificationStats].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      // Handle date sorting
      if (sortField.includes('_verified')) {
        aVal = aVal ? new Date(aVal) : new Date(0);
        bVal = bVal ? new Date(bVal) : new Date(0);
      }
      
      // Handle numeric sorting
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      // Handle string/date sorting
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    setVerificationStats(sorted);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <i className="fas fa-sort text-muted"></i>;
    }
    return sortDirection === 'asc' ? 
      <i className="fas fa-sort-up text-primary"></i> : 
      <i className="fas fa-sort-down text-primary"></i>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVerificationBadgeClass = (count) => {
    if (count >= 50) return 'bg-danger';
    if (count >= 20) return 'bg-warning';
    if (count >= 5) return 'bg-success';
    return 'bg-info';
  };

  const calculateTotalVerifications = () => {
    return verificationStats.reduce((total, stat) => total + (stat.verification_count || 0), 0);
  };

  const getTopVerifiedCredentials = () => {
    return verificationStats.slice(0, 5);
  };

  const getRecentlyVerifiedCredentials = () => {
    return verificationStats
      .filter(stat => stat.last_verified)
      .sort((a, b) => new Date(b.last_verified) - new Date(a.last_verified))
      .slice(0, 5);
  };

  return (
    <div className="verification-stats">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Verification Statistics</h2>
          <p className="text-muted">Monitor how often credentials are being verified</p>
        </div>
        <button 
          className="btn btn-outline-primary"
          onClick={loadVerificationStats}
          disabled={loading}
        >
          <i className="fas fa-sync-alt me-2"></i>
          Refresh
        </button>
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
          {/* Summary Cards */}
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center">
                  <h3 className="text-primary">{calculateTotalVerifications()}</h3>
                  <p className="text-muted mb-0">Total Verifications</p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center">
                  <h3 className="text-success">{verificationStats.length}</h3>
                  <p className="text-muted mb-0">Credentials Verified</p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center">
                  <h3 className="text-info">
                    {verificationStats.length > 0 ? 
                      Math.round(calculateTotalVerifications() / verificationStats.length) : 0
                    }
                  </h3>
                  <p className="text-muted mb-0">Avg. Verifications per Credential</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Verified and Recently Verified */}
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-transparent border-bottom-0">
                  <h6 className="mb-0">
                    <i className="fas fa-trophy text-warning me-2"></i>
                    Most Verified Credentials
                  </h6>
                </div>
                <div className="card-body">
                  {getTopVerifiedCredentials().map((stat, index) => (
                    <div key={stat.credential_id} className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <strong>{stat.owner_first_name} {stat.owner_last_name}</strong>
                        <br />
                        <small className="text-muted">{stat.credential_type}</small>
                      </div>
                      <span className={`badge ${getVerificationBadgeClass(stat.verification_count)}`}>
                        {stat.verification_count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-transparent border-bottom-0">
                  <h6 className="mb-0">
                    <i className="fas fa-clock text-info me-2"></i>
                    Recently Verified
                  </h6>
                </div>
                <div className="card-body">
                  {getRecentlyVerifiedCredentials().map((stat, index) => (
                    <div key={stat.credential_id} className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <strong>{stat.owner_first_name} {stat.owner_last_name}</strong>
                        <br />
                        <small className="text-muted">{stat.credential_type}</small>
                      </div>
                      <small className="text-muted">
                        {formatDate(stat.last_verified)}
                      </small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-bottom-0">
              <h6 className="mb-0">All Verification Statistics</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th 
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('owner_first_name')}
                      >
                        Student {getSortIcon('owner_first_name')}
                      </th>
                      <th 
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('credential_type')}
                      >
                        Credential {getSortIcon('credential_type')}
                      </th>
                      <th 
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('institution_name')}
                      >
                        Institution {getSortIcon('institution_name')}
                      </th>
                      <th 
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('verification_count')}
                      >
                        Verifications {getSortIcon('verification_count')}
                      </th>
                      <th 
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('first_verified')}
                      >
                        First Verified {getSortIcon('first_verified')}
                      </th>
                      <th 
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('last_verified')}
                      >
                        Last Verified {getSortIcon('last_verified')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationStats.map((stat) => (
                      <tr key={stat.credential_id}>
                        <td>
                          <div>
                            <strong>{stat.owner_first_name} {stat.owner_last_name}</strong>
                            <br />
                            <small className="text-muted">{stat.student_id}</small>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-info">
                            {stat.credential_type}
                          </span>
                        </td>
                        <td>{stat.institution_name}</td>
                        <td>
                          <span className={`badge ${getVerificationBadgeClass(stat.verification_count)}`}>
                            {stat.verification_count}
                          </span>
                        </td>
                        <td>{formatDate(stat.first_verified)}</td>
                        <td>{formatDate(stat.last_verified)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {verificationStats.length === 0 && (
                  <div className="text-center py-5">
                    <i className="fas fa-chart-line fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">No verification data found</h5>
                    <p className="text-muted">Credentials haven't been verified yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default VerificationStats;