import React, { useState, useEffect } from 'react';
import { updateInstitutionProfile } from '../../services/institutionApiService';
import { logProfileUpdate } from '../../services/activityLogService';

function InstitutionInformation({ institutionId, profile, onProfileUpdate }) {
  const [formData, setFormData] = useState({
    institution_name: '',
    username: '',
    email: '',
    currentPassword: '',
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
        currentPassword: '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [profile]);

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
    
    if (!formData.institution_name?.trim()) {
      errors.institution_name = 'Institution name is required';
    }
    
    if (!formData.username?.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (showPasswordFields) {
      if (!formData.currentPassword) {
        errors.currentPassword = 'Current password is required';
      }
      
      if (!formData.password) {
        errors.password = 'New password is required';
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
    
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
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
      
      if (showPasswordFields && formData.password) {
        updateData.currentPassword = formData.currentPassword;
        updateData.password = formData.password;
      }
      
      await updateInstitutionProfile(institutionId, updateData);
      
      // Log the activity
      const changes = [];
      if (formData.username !== profile.username) changes.push('username');
      if (formData.email !== profile.email) changes.push('email');
      if (showPasswordFields && formData.password) changes.push('password');
      
      if (changes.length > 0) {
        const loggedInUserId = localStorage.getItem('userId');
        await logProfileUpdate(
          institutionId,
          loggedInUserId,
          changes.join(', ')
        );
      }
      
      setSuccess('Profile updated successfully!');
      
      if (onProfileUpdate) {
        onProfileUpdate({
          ...profile,
          institution_name: formData.institution_name,
          username: formData.username,
          email: formData.email
        });
      }
      
      if (showPasswordFields) {
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          password: '',
          confirmPassword: ''
        }));
        setShowPasswordFields(false);
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update profile';
      
      // If it's a password error, show it on the field
      if (err.response?.status === 401 && errorMessage.includes('password')) {
        setValidationErrors(prev => ({
          ...prev,
          currentPassword: errorMessage
        }));
      }
      
      setError(errorMessage);
      setTimeout(() => {
        setError('');
        setValidationErrors({});
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-section">
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-group">
          <label htmlFor="institution_name">
            Institution Name <span className="required"></span>
          </label>
          <input
            type="text"
            id="institution_name"
            name="institution_name"
            className={`form-control ${validationErrors.institution_name ? 'is-invalid' : ''}`}
            value={formData.institution_name}
            onChange={handleChange}
            placeholder="Enter institution name"
            readOnly
          />
          {validationErrors.institution_name && (
            <div className="invalid-feedback">{validationErrors.institution_name}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="username">
            Username <span className="required">*</span>
          </label>
          <input
            type="text"
            id="username"
            name="username"
            className={`form-control ${validationErrors.username ? 'is-invalid' : ''}`}
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter username"
          />
          {validationErrors.username && (
            <div className="invalid-feedback">{validationErrors.username}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">
            Email <span className="required">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className={`form-control ${validationErrors.email ? 'is-invalid' : ''}`}
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
          />
          {validationErrors.email && (
            <div className="invalid-feedback">{validationErrors.email}</div>
          )}
        </div>

        <div className="password-section">
          <button
            type="button"
            className="btn-toggle-password"
            onClick={() => setShowPasswordFields(!showPasswordFields)}
          >
            <i className={`fas fa-${showPasswordFields ? 'eye-slash' : 'key'} me-2`}></i>
            {showPasswordFields ? 'Cancel Password Change' : 'Change Password'}
          </button>

          {showPasswordFields && (
            <>
              <div className="form-group">
                <label htmlFor="currentPassword">
                  Current Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  className={`form-control ${validationErrors.currentPassword ? 'is-invalid' : ''}`}
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter current password"
                />
                {validationErrors.currentPassword && (
                  <div className="invalid-feedback">{validationErrors.currentPassword}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  New Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className={`form-control ${validationErrors.password ? 'is-invalid' : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                />
                {validationErrors.password && (
                  <div className="invalid-feedback">{validationErrors.password}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  Confirm New Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`form-control ${validationErrors.confirmPassword ? 'is-invalid' : ''}`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                />
                {validationErrors.confirmPassword && (
                  <div className="invalid-feedback">{validationErrors.confirmPassword}</div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-save-profile"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin me-2"></i>
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
  );
}

export default InstitutionInformation;
