import React, { useState, useEffect } from 'react';
import './AccessCodesSection.css';
import { updateAccessCodeStatus, deleteAccessCode, fetchStudentAccessCodes, fetchStudentMultiAccessCodes, updateMultiAccessCodeStatus, deleteMultiAccessCode } from '../../services/studentApiService';

function AccessCodesSection({ credentials, totalAccessCodes, onRefresh }) {
  // Tab navigation state
  const [activeTab, setActiveTab] = useState('single');
  
  // State to manage access code list and statuses
  const [accessCodes, setAccessCodes] = useState([]);
  const [multiAccessCodes, setMultiAccessCodes] = useState([]);
  const [loadingStates, setLoadingStates] = useState({});
  const [deleteLoadingStates, setDeleteLoadingStates] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Load single access codes with accurate active/inactive state from backend
  const loadCodes = async () => {
    try {
      const studentId = localStorage.getItem('userId');
      if (!studentId) return;
      const rows = await fetchStudentAccessCodes(studentId);
      const normalized = (rows || []).map(r => ({
        code: r.access_code,
        status: r.is_active ? 'active' : 'inactive',
        credentialType: r.credential_type || 'Computer Science Diploma',
        credentialId: r.credential_id,
        institutionName: r.institution_name,
        createdDate: new Date(r.created_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      }));
      setAccessCodes(normalized);
    } catch (err) {
      console.error('Error loading access codes:', err);
    }
  };

  // Load multi-access codes with credential details
  const loadMultiCodes = async () => {
    try {
      const studentId = localStorage.getItem('userId');
      if (!studentId) return;
      const rows = await fetchStudentMultiAccessCodes(studentId);
      const normalized = (rows || []).map(r => ({
        id: r.id,
        code: r.access_code,
        status: r.is_active ? 'active' : 'inactive',
        credentialTypes: r.credential_types || '',
        credentialCount: r.credential_count || 0,
        createdDate: new Date(r.created_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      }));
      setMultiAccessCodes(normalized);
    } catch (err) {
      console.error('Error loading multi-access codes:', err);
    }
  };

  useEffect(() => {
    loadCodes();
    loadMultiCodes();
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'single') {
      loadCodes();
    } else if (activeTab === 'multi') {
      loadMultiCodes();
    }
  }, [activeTab]);

  // Build a shareable verification URL with the code prefilled and auto-verify enabled
  const buildShareUrl = (code, { autoVerify = true } = {}) => {
    const origin = window.location.origin;
    // Always use homepage path, where VerifierSection is rendered
    const path = '/';
    const params = new URLSearchParams({ code });
    if (autoVerify) params.set('verify', '1');
    return `${origin}${path}?${params.toString()}#verifier`;
  };

  // Copy just the access code to clipboard
  const handleCopyAccessCode = async (code) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = code;
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
      window.prompt('Copy this access code:', code);
    }
  };

  // Copy the share link to clipboard
  const handleCopyShareLink = async (index, customCode = null) => {
    const code = customCode || (activeTab === 'single' ? accessCodes[index]?.code : multiAccessCodes[index]?.code);
    const url = buildShareUrl(code, { autoVerify: true });
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      // Show toast notification
      setToastMessage('Share link copied!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      // As a last resort, show the URL to copy manually
      window.prompt('Copy this verification link:', url);
    }
  };

  // Toggle access code status between active and inactive
  const handleToggleStatus = async (index) => {
    const accessCode = accessCodes[index];
    const newStatus = accessCode.status === 'active' ? false : true;
    
    setLoadingStates(prev => ({ ...prev, [index]: true }));
    
    try {
      await updateAccessCodeStatus(accessCode.code, newStatus);
      
      setAccessCodes(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], status: newStatus ? 'active' : 'inactive' };
        return updated;
      });
      
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error updating access code status:', error);
      alert('Failed to update access code status. Please try again.');
    } finally {
      setLoadingStates(prev => ({ ...prev, [index]: false }));
    }
  };

  // Toggle multi-access code status between active and inactive
  const handleToggleMultiStatus = async (index) => {
    const multiCode = multiAccessCodes[index];
    const newStatus = multiCode.status === 'active' ? false : true;
    
    setLoadingStates(prev => ({ ...prev, [`multi-${index}`]: true }));
    
    try {
      await updateMultiAccessCodeStatus(multiCode.code, newStatus);
      
      setMultiAccessCodes(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], status: newStatus ? 'active' : 'inactive' };
        return updated;
      });
      
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error updating multi-access code status:', error);
      alert('Failed to update multi-access code status. Please try again.');
    } finally {
      setLoadingStates(prev => ({ ...prev, [`multi-${index}`]: false }));
    }
  };

  // Delete function to mark access code as deleted
  const handleDeleteAccessCode = async (index) => {
    const accessCode = accessCodes[index];
    
    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete access code "${accessCode.code}"? This action cannot be undone.`)) {
      return;
    }
    
    // Set loading state for this specific access code
    setDeleteLoadingStates(prev => ({ ...prev, [index]: true }));
    
    try {
      await deleteAccessCode(accessCode.code);
      
      // If successful, remove from local state
      setAccessCodes(prevCodes => prevCodes.filter((_, i) => i !== index));

      // Re-fetch to keep list accurate
      await loadCodes();

      // Ask parent to refetch and update stats/sections
      if (typeof onRefresh === 'function') {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to delete access code:', error);
      alert('Failed to delete access code. Please try again.');
    } finally {
      // Clear loading state
      setDeleteLoadingStates(prev => ({ ...prev, [index]: false }));
    }
  };

  // Delete function to mark multi-access code as deleted
  const handleDeleteMultiAccessCode = async (index) => {
    const multiCode = multiAccessCodes[index];
    
    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete multi-access code "${multiCode.code}"? This action cannot be undone.`)) {
      return;
    }
    
    // Set loading state for this specific multi-access code
    setDeleteLoadingStates(prev => ({ ...prev, [`multi-${index}`]: true }));
    
    try {
      await deleteMultiAccessCode(multiCode.code);
      
      // If successful, remove from local state
      setMultiAccessCodes(prevCodes => prevCodes.filter((_, i) => i !== index));

      // Re-fetch to keep list accurate
      await loadMultiCodes();

      // Ask parent to refetch and update stats/sections
      if (typeof onRefresh === 'function') {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to delete multi-access code:', error);
      alert('Failed to delete multi-access code. Please try again.');
    } finally {
      // Clear loading state
      setDeleteLoadingStates(prev => ({ ...prev, [`multi-${index}`]: false }));
    }
  };

  return (
    <div className="row">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 style={{ color: '#4050b5', fontWeight: '600', margin: '0' }}>
            <i className="fas fa-key me-2"></i>
            Access Codes
          </h2>
        </div>

        {/* Tab Navigation */}
        <div className="settings-tabs mb-4">
          <button 
            className={`tab-button ${activeTab === 'single' ? 'active' : ''}`}
            onClick={() => setActiveTab('single')}
          >
            <i className="fas fa-key me-2"></i>
            Single Access Codes
          </button>
          <button 
            className={`tab-button ${activeTab === 'multi' ? 'active' : ''}`}
            onClick={() => setActiveTab('multi')}
          >
            <i className="fas fa-layer-group me-2"></i>
            Multi-Access Codes
          </button>
        </div>

        {/* Single Access Codes Tab */}
        {activeTab === 'single' && (
          <>
            {accessCodes.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-key empty-state-icon"></i>
                <h3 className="empty-state-title">No Single Access Codes Yet</h3>
                <p className="empty-state-text">
                  Generate access codes from individual credentials to share them securely.<br />
                  Single access codes will appear here once generated.
                </p>
              </div>
            ) : (
              <div className="access-codes-container mb-5">
                {accessCodes.map((accessCode, index) => (
                  <div key={`${accessCode.credentialId}-${index}`} className="access-code-card">
                    <div className="access-code-header">
                      <div className="access-code-info">
                        <div 
                          className="access-code-value clickable-code" 
                          onClick={() => handleCopyAccessCode(accessCode.code)}
                          title="Click to copy access code"
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <span>{accessCode.code}</span>
                          <i className="fas fa-copy" style={{ fontSize: '0.9rem', opacity: 0.6 }}></i>
                        </div>
                        <div className="access-code-status">
                          <span className={`status-badge-small ${accessCode.status}`}>{accessCode.status}</span>
                        </div>
                      </div>
                      <div className="access-code-actions">
                        <div className="toggle-switch">
                          <input 
                            type="checkbox" 
                            id={`toggle-${index}`} 
                            className="toggle-input" 
                            checked={accessCode.status === 'active'}
                            onChange={() => handleToggleStatus(index)}
                            disabled={loadingStates[index]}
                          />
                          <label 
                            htmlFor={`toggle-${index}`} 
                            className={`toggle-label ${loadingStates[index] ? 'loading' : ''}`}
                          ></label>
                          {loadingStates[index] && (
                            <div className="toggle-loading">
                              <i className="fas fa-spinner fa-spin"></i>
                            </div>
                          )}
                        </div>
                        <div className="menu-dropdown">
                          <button 
                            className="menu-button"
                            onClick={() => handleCopyShareLink(index)}
                            title="Copy verification link"
                          >
                            <i className="fas fa-link"></i>
                          </button>
                        </div>
                        <div className="menu-dropdown">
                          <button 
                            className="menu-button"
                            onClick={() => handleDeleteAccessCode(index)}
                            disabled={deleteLoadingStates[index]}
                            title="Delete access code"
                          >
                            {deleteLoadingStates[index] ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fas fa-trash"></i>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="access-code-details">
                      <div className="credential-reference">
                        <span className="detail-label">Credential:</span> {accessCode.credentialType}
                        {accessCode.institutionName && (
                          <span> - {accessCode.institutionName}</span>
                        )}
                      </div>
                      <div className="creation-date">
                        <span className="detail-label"></span> {accessCode.createdDate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Multi-Access Codes Tab */}
        {activeTab === 'multi' && (
          <>
            {multiAccessCodes.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-layer-group empty-state-icon"></i>
                <h3 className="empty-state-title">No Multi-Access Codes Yet</h3>
                <p className="empty-state-text">
                  Generate multi-access codes from multiple credentials to share them with a single code.<br />
                  Multi-access codes will appear here once generated.
                </p>
              </div>
            ) : (
              <div className="access-codes-container mb-5">
                {multiAccessCodes.map((multiCode, index) => (
                  <div key={`multi-${multiCode.id}-${index}`} className="access-code-card">
                    <div className="access-code-header">
                      <div className="access-code-info">
                        <div 
                          className="access-code-value clickable-code" 
                          onClick={() => handleCopyAccessCode(multiCode.code)}
                          title="Click to copy access code"
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <span>{multiCode.code}</span>
                          <i className="fas fa-copy" style={{ fontSize: '0.9rem', opacity: 0.6 }}></i>
                        </div>
                        <div className="access-code-status">
                          <span className={`status-badge-small ${multiCode.status}`}>{multiCode.status}</span>
                        </div>
                      </div>
                      <div className="access-code-actions">
                        <div className="toggle-switch">
                          <input 
                            type="checkbox" 
                            id={`multi-toggle-${index}`} 
                            className="toggle-input" 
                            checked={multiCode.status === 'active'}
                            onChange={() => handleToggleMultiStatus(index)}
                            disabled={loadingStates[`multi-${index}`]}
                          />
                          <label 
                            htmlFor={`multi-toggle-${index}`} 
                            className={`toggle-label ${loadingStates[`multi-${index}`] ? 'loading' : ''}`}
                          ></label>
                          {loadingStates[`multi-${index}`] && (
                            <div className="toggle-loading">
                              <i className="fas fa-spinner fa-spin"></i>
                            </div>
                          )}
                        </div>
                        <div className="menu-dropdown">
                          <button 
                            className="menu-button"
                            onClick={() => handleCopyShareLink(index)}
                            title="Copy verification link"
                          >
                            <i className="fas fa-link"></i>
                          </button>
                        </div>
                        <div className="menu-dropdown">
                          <button 
                            className="menu-button"
                            onClick={() => handleDeleteMultiAccessCode(index)}
                            disabled={deleteLoadingStates[`multi-${index}`]}
                            title="Delete multi-access code"
                          >
                            {deleteLoadingStates[`multi-${index}`] ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fas fa-trash"></i>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="access-code-details">
                      <div className="credential-reference">
                        <span className="detail-label">Credentials ({multiCode.credentialCount}):</span>
                        <div className="credential-list">
                          {multiCode.credentialTypes.split(', ').map((credential, idx) => (
                            <div key={idx} className="credential-item">
                              • {credential}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="creation-date">
                        <span className="detail-label"></span> {multiCode.createdDate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
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

export default AccessCodesSection;
