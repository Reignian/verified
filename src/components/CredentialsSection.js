import React from 'react';
import './CredentialsSection.css';
import { generateCredentialAccessCode } from '../services/apiService';

function CredentialsSection({ 
  credentials, 
  setCredentials, 
  generatingId, 
  setGeneratingId,
  calculateTotalAccessCodes,
  setTotalAccessCodes
}) {
  
  const handleGenerateAccessCode = async (credentialId) => {
    try {
      setGeneratingId(credentialId);
      const result = await generateCredentialAccessCode(credentialId);
      if (result && result.access_code) {
        setCredentials(prev => {
          const updated = prev.map(c => {
            if (c.id !== credentialId) return c;
            const nextCodes = Array.isArray(c.codes) ? [...c.codes] : [];
            nextCodes.push(result.access_code);
            return { ...c, codes: nextCodes };
          });
          // Update total access codes after credentials update
          setTotalAccessCodes(calculateTotalAccessCodes(updated));
          return updated;
        });
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

  return (
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
                  </div>
                  
                  <div className="credential-actions d-flex gap-2 mt-3">
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
  );
}

export default CredentialsSection;
