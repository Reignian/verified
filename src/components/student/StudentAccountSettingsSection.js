import React, { useState, useEffect } from 'react';
import './StudentAccountSettingsSection.css';
import { linkAccount, fetchLinkedAccounts, unlinkAccount } from '../../services/studentApiService';

function StudentAccountSettingsSection({ user }) {
  const [activeTab, setActiveTab] = useState('profile');

  // Link account form state
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linkStudentId, setLinkStudentId] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  // Linked accounts state
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [linkedLoading, setLinkedLoading] = useState(false);
  const [linkedError, setLinkedError] = useState('');
  const [unlinkingId, setUnlinkingId] = useState(null);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [unlinkPassword, setUnlinkPassword] = useState('');
  const [unlinkTargetId, setUnlinkTargetId] = useState(null);
  const [unlinkModalError, setUnlinkModalError] = useState('');
  const [unlinkSubmitting, setUnlinkSubmitting] = useState(false);

  const loadLinkedAccounts = async () => {
    if (!user?.id) return;
    setLinkedLoading(true);
    setLinkedError('');
    try {
      const data = await fetchLinkedAccounts(user.id);
      setLinkedAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      setLinkedError(serverMsg || err.message || 'Failed to load linked accounts.');
    } finally {
      setLinkedLoading(false);
    }
  };

  const openUnlinkModal = (targetAccountId) => {
    setUnlinkTargetId(targetAccountId);
    setUnlinkPassword('');
    setUnlinkModalError('');
    setShowUnlinkModal(true);
  };

  const closeUnlinkModal = () => {
    if (unlinkSubmitting) return;
    setShowUnlinkModal(false);
    setUnlinkTargetId(null);
    setUnlinkPassword('');
    setUnlinkModalError('');
  };

  const submitUnlink = async (e) => {
    e.preventDefault();
    if (!user?.id || !unlinkTargetId) return;
    if (!String(unlinkPassword).trim()) {
      setUnlinkModalError('Password is required.');
      return;
    }
    setUnlinkModalError('');
    setLinkedError('');
    try {
      setUnlinkSubmitting(true);
      setUnlinkingId(unlinkTargetId);
      await unlinkAccount(user.id, unlinkTargetId, unlinkPassword);
      await loadLinkedAccounts();
      closeUnlinkModal();
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      setUnlinkModalError(serverMsg || err.message || 'Failed to unlink account.');
    } finally {
      setUnlinkingId(null);
      setUnlinkSubmitting(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'account-linking') {
      loadLinkedAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.id]);

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    setLinkError('');
    setLinkSuccess('');

    if (!linkEmail || !linkPassword || !linkStudentId) {
      setLinkError('Please fill out email, password, and student ID.');
      return;
    }

    try {
      setLinkLoading(true);
      const data = await linkAccount(
        user?.id,
        linkEmail,
        linkPassword,
        linkStudentId
      );
      setLinkSuccess(data?.message || 'Account linked successfully.');
      setLinkPassword('');
      loadLinkedAccounts();
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      setLinkError(serverMsg || err.message || 'An unexpected error occurred.');
    } finally {
      setLinkLoading(false);
    }
  };

  return (
    <div className="student-account-settings-container">
      <div className="settings-header">
        <h2 className="settings-title">
          <i className="fas fa-cog me-3"></i>
          Account Settings
        </h2>
        <p className="settings-subtitle">
          Manage your account information and preferences
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="settings-tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <i className="fas fa-user me-2"></i>
          Profile Information
        </button>
        <button 
          className={`tab-button ${activeTab === 'account-linking' ? 'active' : ''}`}
          onClick={() => setActiveTab('account-linking')}
        >
          <i className="fas fa-link me-2"></i>
          Account Linking
        </button>
      </div>

      {/* Settings Content */}
      <div className="settings-content">
        {/* Profile Information Tab */}
        {activeTab === 'profile' && (
          <div className="settings-section">

            <div className="profile-display">
              <div className="profile-card">
                <div className="profile-header">
                  <div className="profile-avatar">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="profile-info">
                    <h4 className="profile-name">{user?.first_name} {user?.middle_name} {user?.last_name} {user?.email}</h4>
                    <p className="profile-institution">{user?.institution_name || 'Current Institution'}</p>
                  </div>
                </div>
                
                <div className="profile-details">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <div className="detail-item">
                        <label className="detail-label">First Name</label>
                        <p className="detail-value">{user?.first_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="detail-item">
                        <label className="detail-label">Middle Name</label>
                        <p className="detail-value">{user?.middle_name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <div className="detail-item">
                        <label className="detail-label">Last Name</label>
                        <p className="detail-value">{user?.last_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="detail-item">
                        <label className="detail-label">Student ID</label>
                        <p className="detail-value">{user?.student_id || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <div className="detail-item">
                        <label className="detail-label">Email Address</label>
                        <p className="detail-value">{user?.email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account Linking Tab */}
        {activeTab === 'account-linking' && (
          <div className="settings-section">

            {/* Link Account Form */}
            <div className="link-account-form">
              <h5>Link Another Account</h5>
              <p className="text-muted mb-4">Link accounts from other institutions to view all credentials in one place</p>
              <div className="form-card">
                {/* Alerts */}
                {linkError && (
                  <div className="alert alert-danger" role="alert">{linkError}</div>
                )}
                {linkSuccess && (
                  <div className="alert alert-success" role="alert">{linkSuccess}</div>
                )}

                <form onSubmit={handleLinkSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Enter your email from another school"
                        name="linkEmail"
                        value={linkEmail}
                        onChange={(e) => setLinkEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Student ID</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter your student ID"
                        name="linkStudentId"
                        value={linkStudentId}
                        onChange={(e) => setLinkStudentId(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Enter your password for that account"
                        name="linkPassword"
                        value={linkPassword}
                        onChange={(e) => setLinkPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={linkLoading}>
                      <i className="fas fa-link me-2"></i>
                      {linkLoading ? 'Linking…' : 'Link Account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Linked Accounts Display */}
            <div className="linked-accounts">
              <h5 className="mb-4">Linked Accounts</h5>
              {linkedLoading && (
                <p className="text-muted">Loading linked accounts…</p>
              )}
              {!linkedLoading && linkedError && (
                <div className="alert alert-danger" role="alert">{linkedError}</div>
              )}
              {!linkedLoading && !linkedError && (
                (() => {
                  const displayed = (linkedAccounts || []).filter(a => Number(a.account_id) !== Number(user?.id));
                  if (displayed.length === 0) {
                    return (
                      <div className="empty-linked-accounts">
                        <div className="empty-icon">
                          <i className="fas fa-users"></i>
                        </div>
                        <h6>No Linked Accounts</h6>
                        <p className="text-muted">Use the form above to link accounts from other institutions.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="linked-list">
                      {displayed.map(acc => (
                        <div className="account-card" key={acc.account_id}>
                          <div className="account-info">
                            
                            <div className="account-header">
                              <div className="account-icon"><i className="fas fa-user"></i></div>
                              <div className="account-details">
                                <h6 className="account-name">{acc.first_name} {acc.middle_name || ''} {acc.last_name}</h6>
                                <p className="account-school">Email: {acc.email}</p>
                                <p className="account-school">Institution: {acc.institution_name || 'N/A'}</p>
                                <p className="account-id">Student ID: {acc.student_id}</p>
                              </div>
                            </div>

                            <div className="account-actions">
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => openUnlinkModal(acc.account_id)}
                                  disabled={unlinkingId === acc.account_id || linkedLoading}
                                >
                                  {unlinkingId === acc.account_id ? 'Unlinking…' : 'Unlink'}
                                </button>
                              </div>

                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
            {/* Unlink confirmation modal */}
            {showUnlinkModal && (
              <div className="unlink-modal-overlay show" role="dialog" aria-modal="true">
                <div className="unlink-modal">
                  <div className="modal-header">
                    <h5 className="modal-title">Confirm Unlink</h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={closeUnlinkModal} disabled={unlinkSubmitting}></button>
                  </div>
                  <form onSubmit={submitUnlink}>
                    <div className="modal-body">
                      <p className="text-muted">Please enter your password to confirm unlinking this account.</p>
                      {unlinkModalError && (
                        <div className="alert alert-danger" role="alert">{unlinkModalError}</div>
                      )}
                      <label className="form-label">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={unlinkPassword}
                        onChange={(e) => setUnlinkPassword(e.target.value)}
                        autoFocus
                        disabled={unlinkSubmitting}
                      />
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={closeUnlinkModal} disabled={unlinkSubmitting}>Cancel</button>
                      <button type="submit" className="btn btn-danger" disabled={unlinkSubmitting}>
                        {unlinkSubmitting ? 'Unlinking…' : 'Confirm Unlink'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentAccountSettingsSection;
