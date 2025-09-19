import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './MyVerifiED.css';
import { fetchStudentName, fetchStudentCredentialCount, fetchStudentCredentials, generateCredentialAccessCode } from '../services/apiService';

function MyVerifiED() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [credentialCount, setCredentialCount] = useState(0);
  const [generatingId, setGeneratingId] = useState(null);

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        // Get user info from localStorage
        const userId = localStorage.getItem('userId');
        const userType = localStorage.getItem('userType');
        
        if (!userId || userType !== 'student') {
          setLoading(false);
          return;
        }

        // Fetch student data, credential count, and actual credentials
        const [studentData, credentialData, credentialsData] = await Promise.all([
          fetchStudentName(userId),
          fetchStudentCredentialCount(userId),
          fetchStudentCredentials(userId)
        ]);
        
        setUser({ 
          id: userId, 
          type: userType,
          student_id: studentData.student_id,
          first_name: studentData.first_name,
          middle_name: studentData.middle_name,
          last_name: studentData.last_name
        });
        
        setCredentialCount(credentialData.total_credentials);
        // Transform access_codes (comma-separated string) to an array for UI
        const transformed = (credentialsData || []).map(c => ({
          ...c,
          codes: c.access_codes ? c.access_codes.split(',').filter(Boolean) : []
        }));
        setCredentials(transformed);
        setLoading(false);

      } catch (error) {
        console.error('Error loading student data:', error);
        setLoading(false);
      }
    };

    loadStudentData();
  }, []);

  const handleGenerateAccessCode = async (credentialId) => {
    try {
      setGeneratingId(credentialId);
      const result = await generateCredentialAccessCode(credentialId);
      if (result && result.access_code) {
        setCredentials(prev => prev.map(c => {
          if (c.id !== credentialId) return c;
          const nextCodes = Array.isArray(c.codes) ? [...c.codes] : [];
          nextCodes.push(result.access_code);
          return { ...c, codes: nextCodes };
        }));
        try {
          await navigator.clipboard.writeText(result.access_code);
          alert(`New access code generated and copied to clipboard: ${result.access_code}`);
        } catch (copyErr) {
          alert(`New access code generated: ${result.access_code}`);
        }
      }
    } catch (error) {
      console.error('Failed to generate access code:', error);
      alert('Failed to generate access code. Please try again.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleViewCredential = (ipfsHash) => {
    const ipfsUrl = `https://amethyst-tropical-jackal-879.mypinata.cloud/ipfs/${ipfsHash}`;
    window.open(ipfsUrl, '_blank');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f9f9f9', minHeight: '100vh', paddingTop: '80px' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 text-center" style={{ paddingTop: '100px' }}>
              <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h3 className="mt-3" style={{ color: '#4050b5' }}>Loading your credentials...</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f9f9f9', minHeight: '100vh', paddingTop: '80px' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 text-center" style={{ paddingTop: '100px' }}>
              <div className="card shadow-lg border-0" style={{ borderRadius: '12px' }}>
                <div className="card-body p-5">
                  <i className="fas fa-user-lock fa-4x text-warning mb-4"></i>
                  <h2 className="mb-3" style={{ color: '#4050b5' }}>Access Required</h2>
                  <p className="text-muted mb-4">Please log in as a student to view your credentials</p>
                  <button className="btn btn-primary" style={{ backgroundColor: '#4050b5', borderColor: '#4050b5' }}>
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Go to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f9f9f9', minHeight: '100vh', paddingTop: '80px' }}>

      {/* Header Section */}
      <div className="dashboard-header">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="dashboard-title">
                <i className="fas fa-user-graduate me-3"></i>
                My VerifiED Dashboard
              </h1>
              <p className="dashboard-subtitle">
                View and manage your blockchain-verified academic credentials
              </p>
            </div>
            <div className="col-lg-4">
              <div className="user-info">
                <p className="m-0 fw-semibold">{user.first_name} {user.middle_name} {user.last_name}</p>
                <div className="fs-6 opacity-75 mb-1">Student ID: {user.student_id}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Stats Section */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{credentialCount}</div>
            <p className="stat-label">Total Credentials</p>
          </div>
          <div className="stat-card">
            <div className="stat-number">
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
            </div>
          </div>
        </div>

        {/* Credentials Section */}
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 style={{ color: '#4050b5', fontWeight: '600', margin: '0' }}>
                <i className="fas fa-certificate me-2"></i>
                My Credentials
              </h2>
            </div>

            {credentials.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-inbox empty-state-icon"></i>
                <h3 className="empty-state-title">No Credentials Yet</h3>
                <p className="empty-state-text">
                  Your verified credentials will appear here once issued by institutions.<br />
                  Contact your academic institution to request credential verification.
                </p>
              </div>
            ) : (
              <div className="row">
                {credentials.map((credential) => (
                  <div key={credential.id} className="col-12 mb-4">
                    <div className="credential-card">
                      <div className="credential-header">
                        <div>
                          <h3 className="credential-title">
                            <i className="fas fa-award me-2"></i>
                            {credential.type}
                          </h3>
                          <p className="credential-info">
                            <i className="fas fa-book me-2"></i>
                            <strong>Subject:</strong>
                          </p>
                          <p className="credential-info">
                            <i className="fas fa-university me-2"></i>
                            <strong>Issued by:</strong> {credential.issuer}
                          </p>
                          <p className="credential-info">
                            <i className="fas fa-calendar me-2"></i>
                            <strong>Date:</strong> {formatDate(credential.date)}
                          </p>
                          <p className="credential-info">
                            <i className="fas fa-key me-2"></i>
                            <strong>Access Codes:</strong>{' '}
                            {credential.codes && credential.codes.length > 0 ? (
                              credential.codes.map((code, idx) => (
                                <span key={`${credential.id}-code-${idx}`} className="badge bg-light text-dark ms-2">{code}</span>
                              ))
                            ) : (
                              '—'
                            )}
                          </p>
                        </div>
                        <div>
                          <span className={`status-badge status-${credential.status.toLowerCase()}`}>
                            {credential.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="d-flex flex-wrap gap-2 mt-3">
                        <button
                          onClick={() => handleViewCredential(credential.ipfs_hash)}
                          className="btn-primary-custom"
                        >
                          <i className="fas fa-eye me-2"></i>
                          View Document
                        </button>
                        <button
                          onClick={() => handleGenerateAccessCode(credential.id)}
                          className="btn-secondary-custom"
                          disabled={generatingId === credential.id}
                        >
                          <i className="fas fa-key me-2"></i>
                          {generatingId === credential.id ? 'Generating...' : 'Generate Access Code'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyVerifiED;