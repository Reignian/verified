import React, { useState, useEffect } from 'react';
import './CredentialsSection.css';
import { generateCredentialAccessCode, generateMultiAccessCode } from '../../services/studentApiService';

function CredentialsSection({ 
  credentials, 
  setCredentials, 
  generatingId, 
  setGeneratingId,
  calculateTotalAccessCodes,
  setTotalAccessCodes
}) {
  const [selectedCredentials, setSelectedCredentials] = useState(new Set());
  const [generatingMultiCode, setGeneratingMultiCode] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [credentialCount, setCredentialCount] = useState(0);
  const [showSingleConfirmModal, setShowSingleConfirmModal] = useState(false);
  const [selectedSingleCredential, setSelectedSingleCredential] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Copy access code to clipboard
  const handleCopyGeneratedCode = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generatedCode);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = generatedCode;
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      // Show toast notification
      setToastMessage('Access code copied!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      // As a last resort, show the code to copy manually
      window.prompt('Copy this access code:', generatedCode);
    }
  };

  // Auto-close success modal after 3 seconds
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000); // 3 seconds

      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);
  
  const handleGenerateAccessCode = (credentialId) => {
    // Find the credential to show in confirmation
    const credential = credentials.find(c => c.id === credentialId);
    setSelectedSingleCredential(credential);
    setShowSingleConfirmModal(true);
  };

  const handleConfirmSingleGeneration = async () => {
    setShowSingleConfirmModal(false);
    
    if (!selectedSingleCredential) return;

    try {
      setGeneratingId(selectedSingleCredential.id);
      const result = await generateCredentialAccessCode(selectedSingleCredential.id);
      if (result && result.access_code) {
        setCredentials(prev => {
          const updated = prev.map(c => {
            if (c.id !== selectedSingleCredential.id) return c;
            const nextCodes = Array.isArray(c.codes) ? [...c.codes] : [];
            nextCodes.push(result.access_code);
            return { ...c, codes: nextCodes };
          });
          // Update total access codes after credentials update
          setTotalAccessCodes(calculateTotalAccessCodes(updated));
          return updated;
        });

        // Store generated code and show success modal
        setCredentialCount(1);
        setGeneratedCode(result.access_code);
        setShowSuccessModal(true);

        try {
          await navigator.clipboard.writeText(result.access_code);
        } catch (copyErr) {
          // Silent fail for clipboard
        }
      }
    } catch (error) {
      console.error('Failed to generate access code:', error);
      alert('Failed to generate access code. Please try again.');
    } finally {
      setGeneratingId(null);
      setSelectedSingleCredential(null);
    }
  };

  const handleCheckboxChange = (credentialId) => {
    setSelectedCredentials(prev => {
      const newSet = new Set(prev);
      if (newSet.has(credentialId)) {
        newSet.delete(credentialId);
      } else {
        newSet.add(credentialId);
      }
      return newSet;
    });
  };

  const handleGenerateMultiAccessCode = () => {
    if (selectedCredentials.size < 2) {
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirmGeneration = async () => {
    setShowConfirmModal(false);

    try {
      setGeneratingMultiCode(true);
      const studentId = localStorage.getItem('userId');
      const credentialIds = Array.from(selectedCredentials);
      
      const result = await generateMultiAccessCode(studentId, credentialIds);
      
      if (result && result.access_code) {
        // Store count before clearing selections
        setCredentialCount(selectedCredentials.size);
        
        // Clear selections
        setSelectedCredentials(new Set());
        
        // Store generated code and show success modal
        setGeneratedCode(result.access_code);
        setShowSuccessModal(true);
        
        try {
          await navigator.clipboard.writeText(result.access_code);
        } catch (copyErr) {
          // Silent fail for clipboard
        }
      }
    } catch (error) {
      console.error('Failed to generate multi-access code:', error);
      alert('Failed to generate multi-access code. Please try again.');
    } finally {
      setGeneratingMultiCode(false);
    }
  };

  const handleViewCredential = (ipfsHash) => {
    const ipfsUrl = `https://amethyst-tropical-jackal-879.mypinata.cloud/ipfs/${ipfsHash}`;
    window.open(ipfsUrl, '_blank');
  };

  const handleDownloadCredential = async (ipfsHash, studentName, credentialType) => {
    try {
      const url = `https://amethyst-tropical-jackal-879.mypinata.cloud/ipfs/${ipfsHash}`;
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
                    <div className="d-flex align-items-start">
                      <div className="credential-checkbox me-3">
                        <input
                          type="checkbox"
                          id={`credential-${credential.id}`}
                          checked={selectedCredentials.has(credential.id)}
                          onChange={() => handleCheckboxChange(credential.id)}
                          className="form-check-input"
                          style={{ transform: 'scale(1.2)' }}
                        />
                      </div>
                      <div>
                      <h3 className="credential-title">
                        <i className="fas fa-award me-2"></i>
                        {credential.type}
                      </h3>
                      {credential.program_name && (
                        <p className="credential-info">
                          <i className="fas fa-graduation-cap me-2"></i>
                          <strong>Program:</strong>{' '}
                          {credential.program_name}{credential.program_code ? ` (${credential.program_code})` : ''}
                        </p>
                      )}
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
                  </div>
                  
                  <div className="credential-actions d-flex gap-2 mt-3">
                    <div 
                      className="btn-primary-custom" 
                      style={{ 
                        flex: '1',
                        padding: '0',
                        overflow: 'hidden',
                        display: 'flex'
                      }}
                    >
                      <button
                        onClick={() => handleViewCredential(credential.ipfs_hash)}
                        style={{ 
                          flex: '1',
                          padding: '10px',
                          border: 'none',
                          background: 'transparent',
                          color: 'inherit',
                          cursor: 'pointer',
                          fontWeight: '600',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <i className="fas fa-eye me-2"></i>
                        View
                      </button>
                      <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.3)' }}></div>
                      <button
                        onClick={() => handleDownloadCredential(
                          credential.ipfs_hash,
                          `${credential.owner_first_name || ''} ${credential.owner_last_name || ''}`.trim() || 'Student',
                          credential.type
                        )}
                        style={{ 
                          flex: '1',
                          padding: '10px',
                          border: 'none',
                          background: 'transparent',
                          color: 'inherit',
                          cursor: 'pointer',
                          fontWeight: '600',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <i className="fas fa-download me-2"></i>
                        Download
                      </button>
                    </div>
                    <button
                      onClick={() => handleGenerateAccessCode(credential.id)}
                      className="btn-secondary-custom"
                      disabled={generatingId === credential.id}
                      style={{ flex: '1' }}
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

        {/* Floating Action Button for Multi-Access Code */}
        {selectedCredentials.size >= 2 && (
          <div className="floating-action-button">
            <button
              onClick={handleGenerateMultiAccessCode}
              className="btn btn-success rounded-circle shadow-lg"
              disabled={generatingMultiCode}
              style={{
                position: 'fixed',
                bottom: '30px',
                right: '30px',
                width: '60px',
                height: '60px',
                fontSize: '14px',
                fontWeight: 'bold',
                zIndex: 1000,
                border: 'none'
              }}
              title={`Generate Multi-Access Code (${selectedCredentials.size} selected)`}
            >
              {generatingMultiCode ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <div>
                  <i className="fas fa-layer-group d-block"></i>
                  <small style={{ fontSize: '10px' }}>{selectedCredentials.size}</small>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-body">
                  <h5>Generate a single access code for <strong>{selectedCredentials.size}</strong> credentials ?</h5>
                  
                  <div className="mb-3 mt-4">
                    {credentials
                      .filter(cred => selectedCredentials.has(cred.id))
                      .map((cred, index) => (
                        <div key={cred.id} className="d-flex flex-row mb-2">

                          <i className="fas fa-award text-primary p-2"></i>

                          <div className="d-flex flex-column justify-content-center mb-2">
                            <span className="fw-medium">{cred.type}</span>
                            <small className="text-muted ms-2">• {cred.issuer}</small>
                          </div>

                        </div>
                      ))
                    }
                  </div>

                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowConfirmModal(false)}
                  >
                    <i className="fas fa-times me-2"></i>
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary-custom" 
                    onClick={handleConfirmGeneration}
                    disabled={generatingMultiCode}
                  >
                    {generatingMultiCode ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-key me-2"></i>
                        Generate Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div 
            className="modal show d-block" 
            tabIndex="-1" 
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowSuccessModal(false)}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-body text-center py-5">
                  <div className="mb-4">
                    <div className="success-checkmark mb-3">
                      <i className="fas fa-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h4 className="text-success mb-3">Access Code Generated!</h4>
                    <div 
                      onClick={handleCopyGeneratedCode}
                      style={{
                        cursor: 'pointer',
                        padding: '15px 25px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: 'white',
                        fontSize: '1.3rem',
                        fontWeight: '600',
                        fontFamily: 'monospace',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                        transition: 'all 0.2s ease',
                        marginBottom: '15px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                      }}
                      title="Click to copy access code"
                    >
                      <span>{generatedCode}</span>
                      <i className="fas fa-copy" style={{ fontSize: '1.1rem' }}></i>
                    </div>
                    <p className="text-muted mb-4">
                      <i className="fas fa-info-circle me-1"></i>
                      Click the code above to copy it instantly!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Single Credential Confirmation Modal */}
        {showSingleConfirmModal && selectedSingleCredential && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-body">
                  <h5>Generate access code for this credential?</h5>
                  
                  <div className="mb-3 mt-4">
                    <div className="d-flex flex-row mb-2">
                      <i className="fas fa-award text-primary p-2"></i>
                      <div className="mb-2">
                        <div className="fw-medium">{selectedSingleCredential.type}</div>
                        <small className="text-muted ms-2">• {selectedSingleCredential.issuer}</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowSingleConfirmModal(false)}
                  >
                    <i className="fas fa-times me-2"></i>
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary-custom" 
                    onClick={handleConfirmSingleGeneration}
                    disabled={generatingId === selectedSingleCredential?.id}
                  >
                    {generatingId === selectedSingleCredential?.id ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-key me-2"></i>
                        Generate Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {showToast && (
          <div 
            onClick={() => setShowToast(false)}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '12px',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              zIndex: 9999,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'slideInRight 0.3s ease-out',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            <i className="fas fa-check-circle" style={{ fontSize: '1.2rem' }}></i>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CredentialsSection;
