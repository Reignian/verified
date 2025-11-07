import React, { useState, useEffect } from 'react';
import './StudentAccountSettingsSection.css';
import { linkAccount, fetchLinkedAccounts, unlinkAccount, changePassword } from '../../services/studentApiService';

function StudentAccountSettingsSection({ user }) {
  const [activeTab, setActiveTab] = useState('profile');

  // Link account form state
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linkStudentId, setLinkStudentId] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  const [showLinkPassword, setShowLinkPassword] = useState(false);

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
  const [showUnlinkPassword, setShowUnlinkPassword] = useState(false);

  // Change password modal state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [changePasswordSubmitting, setChangePasswordSubmitting] = useState(false);

  // Change username modal state
  const [showChangeUsernameModal, setShowChangeUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernamePassword, setUsernamePassword] = useState('');
  const [changeUsernameError, setChangeUsernameError] = useState('');
  const [changeUsernameSuccess, setChangeUsernameSuccess] = useState('');
  const [changeUsernameSubmitting, setChangeUsernameSubmitting] = useState(false);
  const [showUsernamePassword, setShowUsernamePassword] = useState(false);

  // Change email modal state
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [changeEmailError, setChangeEmailError] = useState('');
  const [changeEmailSuccess, setChangeEmailSuccess] = useState('');
  const [changeEmailSubmitting, setChangeEmailSubmitting] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  // Change password modal state - show/hide toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const openChangePasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setChangePasswordError('');
    setChangePasswordSuccess('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowChangePasswordModal(true);
  };

  const closeChangePasswordModal = () => {
    if (changePasswordSubmitting) return;
    setShowChangePasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setChangePasswordError('');
    setChangePasswordSuccess('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const submitChangePassword = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    // Validation
    if (!currentPassword.trim()) {
      setChangePasswordError('Current password is required.');
      return;
    }
    if (!newPassword.trim()) {
      setChangePasswordError('New password is required.');
      return;
    }
    if (newPassword.length < 6) {
      setChangePasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError('New passwords do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setChangePasswordError('New password must be different from current password.');
      return;
    }

    setChangePasswordError('');
    setChangePasswordSuccess('');

    try {
      setChangePasswordSubmitting(true);
      await changePassword(user.id, currentPassword, newPassword);
      setChangePasswordSuccess('Password changed successfully!');
      // Clear form after success
      setTimeout(() => {
        closeChangePasswordModal();
        window.location.reload(); // Refresh to update user data
      }, 2000);
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      setChangePasswordError(serverMsg || err.message || 'Failed to change password.');
    } finally {
      setChangePasswordSubmitting(false);
    }
  };

  const openChangeUsernameModal = () => {
    console.log('Opening username modal, current user:', user);
    console.log('Current username:', user?.username);
    setNewUsername(''); // Start with empty field, not current username
    setUsernamePassword('');
    setChangeUsernameError('');
    setChangeUsernameSuccess('');
    setShowUsernamePassword(false);
    setShowChangeUsernameModal(true);
  };

  const closeChangeUsernameModal = () => {
    if (changeUsernameSubmitting) return;
    setShowChangeUsernameModal(false);
    setNewUsername('');
    setUsernamePassword('');
    setChangeUsernameError('');
    setChangeUsernameSuccess('');
    setShowUsernamePassword(false);
  };

  const submitChangeUsername = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    // Validation
    if (!newUsername.trim()) {
      setChangeUsernameError('Username is required.');
      return;
    }
    if (newUsername.length < 3) {
      setChangeUsernameError('Username must be at least 3 characters long.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setChangeUsernameError('Username can only contain letters, numbers, and underscores.');
      return;
    }
    if (newUsername === user?.username) {
      setChangeUsernameError('New username must be different from current username.');
      return;
    }
    if (!usernamePassword.trim()) {
      setChangeUsernameError('Password is required to change username.');
      return;
    }

    setChangeUsernameError('');
    setChangeUsernameSuccess('');

    try {
      setChangeUsernameSubmitting(true);
      const response = await fetch(`/api/student/${user.id}/change-username`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUsername, password: usernamePassword })
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error: Invalid response format. Please check if the backend server is running on port 3001.');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change username');
      }
      
      setChangeUsernameSuccess('Username changed successfully!');
      setTimeout(() => {
        closeChangeUsernameModal();
        window.location.reload(); // Refresh to update user data
      }, 2000);
    } catch (err) {
      console.error('Change username error:', err);
      setChangeUsernameError(err.message || 'Failed to change username.');
    } finally {
      setChangeUsernameSubmitting(false);
    }
  };

  const openChangeEmailModal = () => {
    setNewEmail(''); // Start with empty field, not current email
    setEmailPassword('');
    setChangeEmailError('');
    setChangeEmailSuccess('');
    setShowEmailPassword(false);
    setShowChangeEmailModal(true);
  };

  const closeChangeEmailModal = () => {
    if (changeEmailSubmitting) return;
    setShowChangeEmailModal(false);
    setNewEmail('');
    setEmailPassword('');
    setChangeEmailError('');
    setChangeEmailSuccess('');
    setShowEmailPassword(false);
  };

  const submitChangeEmail = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    // Validation
    if (!newEmail.trim()) {
      setChangeEmailError('Email is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setChangeEmailError('Please enter a valid email address.');
      return;
    }
    if (newEmail === user?.email) {
      setChangeEmailError('New email must be different from current email.');
      return;
    }
    if (!emailPassword.trim()) {
      setChangeEmailError('Password is required to change email.');
      return;
    }

    setChangeEmailError('');
    setChangeEmailSuccess('');

    try {
      setChangeEmailSubmitting(true);
      const response = await fetch(`/api/student/${user.id}/change-email`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail, password: emailPassword })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change email');
      }
      
      setChangeEmailSuccess('Email changed successfully!');
      setTimeout(() => {
        closeChangeEmailModal();
        window.location.reload(); // Refresh to update user data
      }, 2000);
    } catch (err) {
      setChangeEmailError(err.message || 'Failed to change email.');
    } finally {
      setChangeEmailSubmitting(false);
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
                    <h4 className="profile-name">{user?.first_name} {user?.middle_name} {user?.last_name} </h4>
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
                    <div className="col-md-6 mb-3">
                      <div className="detail-item">
                        <label className="detail-label">Username</label>
                        <p className="detail-value">{user?.username || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="detail-item">
                        <label className="detail-label">Email Address</label>
                        <p className="detail-value">{user?.email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="profile-actions mt-4">
                  <button 
                    type="button" 
                    className="btn btn-outline-primary action-btn"
                    onClick={openChangeUsernameModal}
                  >
                    <i className="fas fa-user me-2"></i>
                    Change Username
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-primary action-btn"
                    onClick={openChangeEmailModal}
                  >
                    <i className="fas fa-envelope me-2"></i>
                    Change Email
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-primary action-btn"
                    onClick={openChangePasswordModal}
                  >
                    <i className="fas fa-key me-2"></i>
                    Change Password
                  </button>
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
                      <div className="password-input-wrapper">
                        <input
                          type={showLinkPassword ? "text" : "password"}
                          className="form-control password-input-with-icon"
                          placeholder="Enter your password for that account"
                          name="linkPassword"
                          value={linkPassword}
                          onChange={(e) => setLinkPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle-icon"
                          onClick={() => setShowLinkPassword(!showLinkPassword)}
                          tabIndex="-1"
                        >
                          <i className={`fas ${showLinkPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
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
                      <div className="password-input-wrapper">
                        <input
                          type={showUnlinkPassword ? "text" : "password"}
                          className="form-control password-input-with-icon"
                          value={unlinkPassword}
                          onChange={(e) => setUnlinkPassword(e.target.value)}
                          autoFocus
                          disabled={unlinkSubmitting}
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle-icon"
                          onClick={() => setShowUnlinkPassword(!showUnlinkPassword)}
                          disabled={unlinkSubmitting}
                          tabIndex="-1"
                        >
                          <i className={`fas ${showUnlinkPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={closeUnlinkModal} disabled={unlinkSubmitting}>Cancel</button>
                      <button type="submit" className="btn btn-danger" disabled={unlinkSubmitting}>
                        {unlinkSubmitting ? 'Unlinking...' : 'Unlink Account'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Change Username Modal */}
      {showChangeUsernameModal && (
        <div className="change-password-modal-overlay show" role="dialog" aria-modal="true">
          <div className="change-password-modal">
            <div className="modal-header">
              <h5 className="modal-title">Change Username</h5>
              <button 
                type="button" 
                className="btn-close" 
                aria-label="Close" 
                onClick={closeChangeUsernameModal} 
                disabled={changeUsernameSubmitting}
              ></button>
            </div>
            <form onSubmit={submitChangeUsername}>
              <div className="modal-body">
                <p className="text-muted mb-4">Enter your new username and confirm with your password.</p>
                
                {changeUsernameError && (
                  <div className="alert alert-danger" role="alert">{changeUsernameError}</div>
                )}
                {changeUsernameSuccess && (
                  <div className="alert alert-success" role="alert">{changeUsernameSuccess}</div>
                )}

                <div className="mb-3">
                  <label className="form-label">Current Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={user?.username || ''}
                    disabled
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">New Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    disabled={changeUsernameSubmitting}
                    minLength="3"
                    pattern="[a-zA-Z0-9_]+"
                    autoFocus
                    required
                  />
                  <div className="form-text">Username must be at least 3 characters (letters, numbers, underscores only).</div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showUsernamePassword ? "text" : "password"}
                      className="form-control password-input-with-icon"
                      value={usernamePassword}
                      onChange={(e) => setUsernamePassword(e.target.value)}
                      disabled={changeUsernameSubmitting}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-icon"
                      onClick={() => setShowUsernamePassword(!showUsernamePassword)}
                      disabled={changeUsernameSubmitting}
                      tabIndex="-1"
                    >
                      <i className={`fas ${showUsernamePassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeChangeUsernameModal} 
                  disabled={changeUsernameSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={changeUsernameSubmitting}
                >
                  <i className="fas fa-user me-2"></i>
                  {changeUsernameSubmitting ? 'Changing Username...' : 'Change Username'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Email Modal */}
      {showChangeEmailModal && (
        <div className="change-password-modal-overlay show" role="dialog" aria-modal="true">
          <div className="change-password-modal">
            <div className="modal-header">
              <h5 className="modal-title">Change Email</h5>
              <button 
                type="button" 
                className="btn-close" 
                aria-label="Close" 
                onClick={closeChangeEmailModal} 
                disabled={changeEmailSubmitting}
              ></button>
            </div>
            <form onSubmit={submitChangeEmail}>
              <div className="modal-body">
                <p className="text-muted mb-4">Enter your new email address and confirm with your password.</p>
                
                {changeEmailError && (
                  <div className="alert alert-danger" role="alert">{changeEmailError}</div>
                )}
                {changeEmailSuccess && (
                  <div className="alert alert-success" role="alert">{changeEmailSuccess}</div>
                )}

                <div className="mb-3">
                  <label className="form-label">Current Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={user?.email || ''}
                    disabled
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">New Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    disabled={changeEmailSubmitting}
                    autoFocus
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showEmailPassword ? "text" : "password"}
                      className="form-control password-input-with-icon"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      disabled={changeEmailSubmitting}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-icon"
                      onClick={() => setShowEmailPassword(!showEmailPassword)}
                      disabled={changeEmailSubmitting}
                      tabIndex="-1"
                    >
                      <i className={`fas ${showEmailPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeChangeEmailModal} 
                  disabled={changeEmailSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={changeEmailSubmitting}
                >
                  <i className="fas fa-envelope me-2"></i>
                  {changeEmailSubmitting ? 'Changing Email...' : 'Change Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="change-password-modal-overlay show" role="dialog" aria-modal="true">
          <div className="change-password-modal">
            <div className="modal-header">
              <h5 className="modal-title">Change Password</h5>
              <button 
                type="button" 
                className="btn-close" 
                aria-label="Close" 
                onClick={closeChangePasswordModal} 
                disabled={changePasswordSubmitting}
              ></button>
            </div>
            <form onSubmit={submitChangePassword}>
              <div className="modal-body">
                <p className="text-muted mb-4">Enter your current password and choose a new password.</p>
                
                {changePasswordError && (
                  <div className="alert alert-danger" role="alert">{changePasswordError}</div>
                )}
                {changePasswordSuccess && (
                  <div className="alert alert-success" role="alert">{changePasswordSuccess}</div>
                )}

                <div className="mb-3">
                  <label className="form-label">Current Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      className="form-control password-input-with-icon"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={changePasswordSubmitting}
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-icon"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      disabled={changePasswordSubmitting}
                      tabIndex="-1"
                    >
                      <i className={`fas ${showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="form-control password-input-with-icon"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={changePasswordSubmitting}
                      minLength="6"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-icon"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={changePasswordSubmitting}
                      tabIndex="-1"
                    >
                      <i className={`fas ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  <div className="form-text">Password must be at least 6 characters long.</div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Confirm New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="form-control password-input-with-icon"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={changePasswordSubmitting}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-icon"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={changePasswordSubmitting}
                      tabIndex="-1"
                    >
                      <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={closeChangePasswordModal} 
                  disabled={changePasswordSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={changePasswordSubmitting}
                >
                  <i className="fas fa-key me-2"></i>
                  {changePasswordSubmitting ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentAccountSettingsSection;
