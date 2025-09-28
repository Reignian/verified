import React, { useState, useEffect } from 'react';
import './AccessCodesSection.css';
import { updateAccessCodeStatus, deleteAccessCode, fetchStudentAccessCodes } from '../services/apiService';

function AccessCodesSection({ credentials, totalAccessCodes, onRefresh }) {
  // State to manage access code list and statuses
  const [accessCodes, setAccessCodes] = useState([]);
  const [loadingStates, setLoadingStates] = useState({});
  const [deleteLoadingStates, setDeleteLoadingStates] = useState({});

  // Load access codes with accurate active/inactive state from backend
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
        createdDate: new Date(r.created_at).toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric'
        })
      }));
      setAccessCodes(normalized);
    } catch (err) {
      console.error('Error loading access codes:', err);
    }
  };

  useEffect(() => {
    loadCodes();
  }, []);

  // Build a shareable verification URL with the code prefilled and auto-verify enabled
  const buildShareUrl = (code, { autoVerify = true } = {}) => {
    const origin = window.location.origin;
    // Always use homepage path, where VerifierSection is rendered
    const path = '/';
    const params = new URLSearchParams({ code });
    if (autoVerify) params.set('verify', '1');
    return `${origin}${path}?${params.toString()}#verifier`;
  };

  // Copy the share link to clipboard
  const handleCopyShareLink = async (index) => {
    const accessCode = accessCodes[index];
    const url = buildShareUrl(accessCode.code, { autoVerify: true });
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
      alert('Share link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy share link:', err);
      // As a last resort, show the URL to copy manually
      window.prompt('Copy this verification link:', url);
    }
  };

  // Toggle function to switch between active/inactive
  const handleToggleStatus = async (index) => {
    const accessCode = accessCodes[index];
    const newStatus = accessCode.status === 'active' ? 'inactive' : 'active';
    
    // Set loading state for this specific access code
    setLoadingStates(prev => ({ ...prev, [index]: true }));
    
    try {
      // Update database first
      await updateAccessCodeStatus(accessCode.code, newStatus === 'active');

      // Optimistically update local state
      setAccessCodes(prevCodes =>
        prevCodes.map((code, i) => (i === index ? { ...code, status: newStatus } : code))
      );

      // Re-fetch to ensure UI reflects server state
      await loadCodes();
    } catch (error) {
      console.error('Failed to update access code status:', error);
      alert('Failed to update access code status. Please try again.');
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, [index]: false }));
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

  return (
    <div className="row">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 style={{ color: '#4050b5', fontWeight: '600', margin: '0' }}>
            <i className="fas fa-key me-2"></i>
            Access Codes
          </h2>
        </div>

        {accessCodes.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-code empty-state-icon"></i>
            <h3 className="empty-state-title">No Access Codes Yet</h3>
            <p className="empty-state-text">
              Generate access codes from your credentials to share them securely.<br />
              Access codes will appear here once generated.
            </p>
          </div>
        ) : (
          <div className="access-codes-container mb-5">
            {accessCodes.map((accessCode, index) => (
              <div key={`${accessCode.credentialId}-${index}`} className="access-code-card">
                <div className="access-code-header">
                  <div className="access-code-info">
                    <div className="access-code-value">{accessCode.code}</div>
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
                  </div>
                  <div className="creation-date">
                    <span className="detail-label">Created:</span> {accessCode.createdDate}
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

export default AccessCodesSection;
