import React, { useState, useEffect } from 'react';
import { 
  fetchInstitutionStaff, 
  addInstitutionStaff, 
  deleteInstitutionStaff
} from '../../services/institutionApiService';

function StaffManagement({ institutionId, profile }) {
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (institutionId) {
      loadStaffList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId]);

  const loadStaffList = async () => {
    try {
      const staff = await fetchInstitutionStaff(institutionId);
      setStaffList(staff);
    } catch (err) {
      console.error('Error loading staff:', err);
    }
  };

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
      setError('Please fix the validation errors in the form');
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

      const loggedInUserId = localStorage.getItem('userId');
      await addInstitutionStaff(institutionId, newStaff, loggedInUserId);
      
      setSuccess('Staff member added successfully!');
      
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
      const loggedInUserId = localStorage.getItem('userId');
      await deleteInstitutionStaff(staffId, loggedInUserId, institutionId, staffName);
      
      setSuccess('Staff member deleted successfully!');
      await loadStaffList();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting staff:', err);
      setError(err.response?.data?.error || 'Failed to delete staff member. Please try again.');
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

      <div className="staff-management">
        <div className="section-header">
          <h3 className="section-title">Staff Members</h3>
          <button 
            className="btn-add-staff"
            onClick={() => setShowAddStaffForm(!showAddStaffForm)}
          >
            <i className={`fas fa-${showAddStaffForm ? 'times' : 'plus'} me-2`}></i>
            {showAddStaffForm ? 'Cancel' : 'Add Staff Member'}
          </button>
        </div>

        {showAddStaffForm && (
          <form onSubmit={handleAddStaff} className="add-staff-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first_name">
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  className={`form-control ${staffValidationErrors.first_name ? 'is-invalid' : ''}`}
                  value={staffFormData.first_name}
                  onChange={handleStaffChange}
                  placeholder="Enter first name"
                />
                {staffValidationErrors.first_name && (
                  <div className="invalid-feedback">{staffValidationErrors.first_name}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="middle_name">Middle Name</label>
                <input
                  type="text"
                  id="middle_name"
                  name="middle_name"
                  className="form-control"
                  value={staffFormData.middle_name}
                  onChange={handleStaffChange}
                  placeholder="Enter middle name (optional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="last_name">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  className={`form-control ${staffValidationErrors.last_name ? 'is-invalid' : ''}`}
                  value={staffFormData.last_name}
                  onChange={handleStaffChange}
                  placeholder="Enter last name"
                />
                {staffValidationErrors.last_name && (
                  <div className="invalid-feedback">{staffValidationErrors.last_name}</div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="staff_username">
                  Username <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="staff_username"
                  name="username"
                  className={`form-control ${staffValidationErrors.username ? 'is-invalid' : ''}`}
                  value={staffFormData.username}
                  onChange={handleStaffChange}
                  placeholder="Enter username"
                />
                {staffValidationErrors.username && (
                  <div className="invalid-feedback">{staffValidationErrors.username}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="staff_email">
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="staff_email"
                  name="email"
                  className={`form-control ${staffValidationErrors.email ? 'is-invalid' : ''}`}
                  value={staffFormData.email}
                  onChange={handleStaffChange}
                  placeholder="Enter email address"
                />
                {staffValidationErrors.email && (
                  <div className="invalid-feedback">{staffValidationErrors.email}</div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="staff_password">
                  Password <span className="required">*</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="staff_password"
                    name="password"
                    className={`form-control password-input-with-icon ${staffValidationErrors.password ? 'is-invalid' : ''}`}
                    value={staffFormData.password}
                    onChange={handleStaffChange}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    className="password-toggle-icon"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {staffValidationErrors.password && (
                  <div className="invalid-feedback">{staffValidationErrors.password}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="staff_confirmPassword">
                  Confirm Password <span className="required">*</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="staff_confirmPassword"
                    name="confirmPassword"
                    className={`form-control password-input-with-icon ${staffValidationErrors.confirmPassword ? 'is-invalid' : ''}`}
                    value={staffFormData.confirmPassword}
                    onChange={handleStaffChange}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    className="password-toggle-icon"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                  >
                    <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {staffValidationErrors.confirmPassword && (
                  <div className="invalid-feedback">{staffValidationErrors.confirmPassword}</div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-save-staff"
                disabled={staffLoading}
              >
                {staffLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
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

        {staffList.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-users"></i>
            <p>No staff members added yet</p>
          </div>
        ) : (
          <div className="staff-list-table">
            <table className="table">
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
                      {staff.first_name} {staff.middle_name && staff.middle_name + ' '}{staff.last_name}
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
  );
}

export default StaffManagement;
