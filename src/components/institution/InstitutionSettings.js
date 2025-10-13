import React, { useState, useEffect } from 'react';
import { updateInstitutionProfile } from '../../services/institutionApiService';
import './InstitutionSettings.css';

function InstitutionSettings({ institutionId, profile, onProfileUpdate }) {
  const [formData, setFormData] = useState({
    institution_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (profile) {
      setFormData({
        institution_name: profile.institution_name || '',
        username: profile.username || '',
        email: profile.email || '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [profile]);

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setError('');
        setSuccess('');
      }
    };

    if (error || success) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [error, success]);

  const validateForm = () => {
    const errors = {};

    if (!formData.institution_name.trim()) {
      errors.institution_name = 'Institution name is required';
    }

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (showPasswordFields) {
      if (!formData.password) {
        errors.password = 'Password is required when changing password';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix the validation errors');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        institution_name: formData.institution_name,
        username: formData.username,
        email: formData.email
      };

      // Only include password if changing it
      if (showPasswordFields && formData.password) {
        updateData.password = formData.password;
      }

      await updateInstitutionProfile(institutionId, updateData);
      
      setSuccess('Profile updated successfully!');
      
      // Reset password fields
      if (showPasswordFields) {
        setFormData(prev => ({
          ...prev,
          password: '',
          confirmPassword: ''
        }));
        setShowPasswordFields(false);
      }

      // Notify parent component
      if (onProfileUpdate) {
        onProfileUpdate({
          institution_name: formData.institution_name,
          username: formData.username,
          email: formData.email
        });
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="institution-settings-container">
      {/* Success Modal */}
      {success && (
        <div className="settings-modal-overlay" onClick={() => setSuccess('')}>
          <div className="settings-modal-content success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3 className="modal-title">Success!</h3>
            <p className="modal-message">{success}</p>
            <button className="modal-btn success-btn" onClick={() => setSuccess('')}>
              OK
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {error && (
        <div className="settings-modal-overlay" onClick={() => setError('')}>
          <div className="settings-modal-content error-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon error-icon">
              <i className="fas fa-exclamation-circle"></i>
            </div>
            <h3 className="modal-title">Error</h3>
            <p className="modal-message">{error}</p>
            <button className="modal-btn error-btn" onClick={() => setError('')}>
              Close
            </button>
          </div>
        </div>
      )}

      <div className="settings-card">
        <form onSubmit={handleSubmit}>
          {/* Institution Information Section */}
          <div className="settings-section">
            <h3 className="section-title">
              <i className="fas fa-university me-2"></i>
              Institution Information
            </h3>
            
            <div className="form-group">
              <label htmlFor="institution_name" className="form-label">
                Institution Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${validationErrors.institution_name ? 'is-invalid' : ''}`}
                id="institution_name"
                name="institution_name"
                value={formData.institution_name}
                onChange={handleChange}
                placeholder="Enter institution name"
              />
              {validationErrors.institution_name && (
                <div className="invalid-feedback">{validationErrors.institution_name}</div>
              )}
            </div>
          </div>

          {/* Account Information Section */}
          <div className="settings-section">
            <h3 className="section-title">
              <i className="fas fa-user me-2"></i>
              Account Information
            </h3>
            
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="username" className="form-label">
                    Username <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${validationErrors.username ? 'is-invalid' : ''}`}
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                  />
                  {validationErrors.username && (
                    <div className="invalid-feedback">{validationErrors.username}</div>
                  )}
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className={`form-control ${validationErrors.email ? 'is-invalid' : ''}`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                  />
                  {validationErrors.email && (
                    <div className="invalid-feedback">{validationErrors.email}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="settings-section">
            <h3 className="section-title">
              <i className="fas fa-lock me-2"></i>
              Security
            </h3>
            
            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="changePasswordToggle"
                checked={showPasswordFields}
                onChange={(e) => {
                  setShowPasswordFields(e.target.checked);
                  if (!e.target.checked) {
                    setFormData(prev => ({
                      ...prev,
                      password: '',
                      confirmPassword: ''
                    }));
                    setValidationErrors(prev => ({
                      ...prev,
                      password: '',
                      confirmPassword: ''
                    }));
                  }
                }}
              />
              <label className="form-check-label" htmlFor="changePasswordToggle">
                Change Password
              </label>
            </div>

            {showPasswordFields && (
              <div className="password-fields">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="password" className="form-label">
                        New Password <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        className={`form-control ${validationErrors.password ? 'is-invalid' : ''}`}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter new password"
                      />
                      {validationErrors.password && (
                        <div className="invalid-feedback">{validationErrors.password}</div>
                      )}
                      <small className="form-text text-muted">
                        Password must be at least 6 characters
                      </small>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="confirmPassword" className="form-label">
                        Confirm Password <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        className={`form-control ${validationErrors.confirmPassword ? 'is-invalid' : ''}`}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm new password"
                      />
                      {validationErrors.confirmPassword && (
                        <div className="invalid-feedback">{validationErrors.confirmPassword}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="settings-actions">
            <button
              type="submit"
              className="btn btn-primary btn-save"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InstitutionSettings;
