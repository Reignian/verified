import React, { useState, useEffect } from 'react';
import { 
  updateInstitutionProfile, 
  fetchInstitutionStaff, 
  addInstitutionStaff, 
  deleteInstitutionStaff 
} from '../../services/institutionApiService';
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

  // Staff management states
  const [staffList, setStaffList] = useState([]);
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [staffFormData, setStaffFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [staffValidationErrors, setStaffValidationErrors] = useState({});
  const [staffLoading, setStaffLoading] = useState(false);

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

  // Load staff list on component mount
  useEffect(() => {
    if (institutionId) {
      loadStaffList();
    }
  }, [institutionId]);

  const loadStaffList = async () => {
    try {
      const staff = await fetchInstitutionStaff(institutionId);
      setStaffList(staff);
    } catch (err) {
      console.error('Error loading staff:', err);
    }
  };

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

  // Staff form validation
  const validateStaffForm = () => {
    const errors = {};

    if (!staffFormData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!staffFormData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!staffFormData.username.trim()) {
      errors.username = 'Username is required';
    } else if (staffFormData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!staffFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffFormData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!staffFormData.password) {
      errors.password = 'Password is required';
    } else if (staffFormData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (staffFormData.password !== staffFormData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setStaffValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStaffChange = (e) => {
    const { name, value } = e.target;
    setStaffFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (staffValidationErrors[name]) {
      setStaffValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    
    if (!validateStaffForm()) {
      setError('Please fix the validation errors in the staff form');
      return;
    }

    setStaffLoading(true);
    setError('');
    setSuccess('');

    try {
      const newStaff = {
        first_name: staffFormData.first_name,
        middle_name: staffFormData.middle_name,
        last_name: staffFormData.last_name,
        username: staffFormData.username,
        email: staffFormData.email,
        password: staffFormData.password
      };

      await addInstitutionStaff(institutionId, newStaff);
      
      setSuccess('Staff member added successfully!');
      
      // Reset form and reload staff list
      setStaffFormData({
        first_name: '',
        middle_name: '',
        last_name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setShowAddStaffForm(false);
      await loadStaffList();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding staff:', err);
      setError(err.response?.data?.error || 'Failed to add staff member. Please try again.');
    } finally {
      setStaffLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    if (!window.confirm(`Are you sure you want to delete ${staffName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteInstitutionStaff(staffId);
      setSuccess('Staff member deleted successfully!');
      await loadStaffList();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting staff:', err);
      setError(err.response?.data?.error || 'Failed to delete staff member. Please try again.');
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

        {/* Staff Management Section */}
        <div className="settings-section staff-section">
          <h3 className="section-title">
            <i className="fas fa-users me-2"></i>
            Staff Management
          </h3>
          
          <button
            type="button"
            className="btn btn-secondary btn-add-staff"
            onClick={() => setShowAddStaffForm(!showAddStaffForm)}
          >
            <i className={`fas ${showAddStaffForm ? 'fa-times' : 'fa-plus'} me-2`}></i>
            {showAddStaffForm ? 'Cancel' : 'Add Staff Member'}
          </button>

          {/* Add Staff Form */}
          {showAddStaffForm && (
            <form onSubmit={handleAddStaff} className="add-staff-form">
              <div className="row">
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="staff_first_name" className="form-label">
                      First Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${staffValidationErrors.first_name ? 'is-invalid' : ''}`}
                      id="staff_first_name"
                      name="first_name"
                      value={staffFormData.first_name}
                      onChange={handleStaffChange}
                      placeholder="Enter first name"
                    />
                    {staffValidationErrors.first_name && (
                      <div className="invalid-feedback">{staffValidationErrors.first_name}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="staff_middle_name" className="form-label">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="staff_middle_name"
                      name="middle_name"
                      value={staffFormData.middle_name}
                      onChange={handleStaffChange}
                      placeholder="Enter middle name (optional)"
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="staff_last_name" className="form-label">
                      Last Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${staffValidationErrors.last_name ? 'is-invalid' : ''}`}
                      id="staff_last_name"
                      name="last_name"
                      value={staffFormData.last_name}
                      onChange={handleStaffChange}
                      placeholder="Enter last name"
                    />
                    {staffValidationErrors.last_name && (
                      <div className="invalid-feedback">{staffValidationErrors.last_name}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="staff_username" className="form-label">
                      Username <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${staffValidationErrors.username ? 'is-invalid' : ''}`}
                      id="staff_username"
                      name="username"
                      value={staffFormData.username}
                      onChange={handleStaffChange}
                      placeholder="Enter username"
                    />
                    {staffValidationErrors.username && (
                      <div className="invalid-feedback">{staffValidationErrors.username}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="staff_email" className="form-label">
                      Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className={`form-control ${staffValidationErrors.email ? 'is-invalid' : ''}`}
                      id="staff_email"
                      name="email"
                      value={staffFormData.email}
                      onChange={handleStaffChange}
                      placeholder="Enter email"
                    />
                    {staffValidationErrors.email && (
                      <div className="invalid-feedback">{staffValidationErrors.email}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="staff_password" className="form-label">
                      Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className={`form-control ${staffValidationErrors.password ? 'is-invalid' : ''}`}
                      id="staff_password"
                      name="password"
                      value={staffFormData.password}
                      onChange={handleStaffChange}
                      placeholder="Enter password"
                    />
                    {staffValidationErrors.password && (
                      <div className="invalid-feedback">{staffValidationErrors.password}</div>
                    )}
                    <small className="form-text text-muted">
                      Password must be at least 6 characters
                    </small>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="staff_confirmPassword" className="form-label">
                      Confirm Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className={`form-control ${staffValidationErrors.confirmPassword ? 'is-invalid' : ''}`}
                      id="staff_confirmPassword"
                      name="confirmPassword"
                      value={staffFormData.confirmPassword}
                      onChange={handleStaffChange}
                      placeholder="Confirm password"
                    />
                    {staffValidationErrors.confirmPassword && (
                      <div className="invalid-feedback">{staffValidationErrors.confirmPassword}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="staff-form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={staffLoading}
                >
                  {staffLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus me-2"></i>
                      Add Staff Member
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Staff List */}
          <div className="staff-list">
            {staffList.length === 0 ? (
              <div className="no-staff-message">
                <i className="fas fa-users-slash"></i>
                <p>No staff members added yet</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((staff) => (
                      <tr key={staff.id}>
                        <td>
                          {staff.first_name} {staff.middle_name} {staff.last_name}
                        </td>
                        <td>{staff.username}</td>
                        <td>{staff.email}</td>
                        <td>
                          <button
                            className="btn-delete-staff"
                            onClick={() => handleDeleteStaff(
                              staff.id,
                              `${staff.first_name} ${staff.last_name}`
                            )}
                            title="Delete staff member"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstitutionSettings;
