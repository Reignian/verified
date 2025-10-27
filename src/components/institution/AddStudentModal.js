// fileName: AddStudentModal.js

import React, { useState, useEffect } from 'react';
import './AddStudentModal.css';
import { addStudent, fetchInstitutionPrograms } from '../../services/institutionApiService';
import { logStudentAdded } from '../../services/activityLogService';

const AddStudentModal = ({ show, onClose, institutionId, onStudentAdded }) => {
  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    program_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [programs, setPrograms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);

  // Load programs when modal opens
  useEffect(() => {
    if (show && institutionId) {
      loadPrograms();
    }
  }, [show, institutionId]);

  const loadPrograms = async () => {
    try {
      const programList = await fetchInstitutionPrograms(institutionId);
      setPrograms(programList);
    } catch (err) {
      console.error('Error loading programs:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleProgramSearch = (e) => {
    setSearchTerm(e.target.value);
    setShowProgramDropdown(true);
  };

  const selectProgram = (program) => {
    setFormData(prev => ({ 
      ...prev, 
      program_id: program.id 
    }));
    setSearchTerm(program.program_name);
    setShowProgramDropdown(false);
  };

  const filteredPrograms = programs.filter(program =>
    program.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (program.program_code && program.program_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.student_id || !formData.first_name || !formData.last_name || !formData.email) {
      setError('Student ID, First Name, Last Name, and Email are required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const studentData = {
        ...formData,
        program_id: formData.program_id !== '' ? formData.program_id : null
      };
      
      const result = await addStudent(studentData, institutionId);
      setSuccess(result.message || 'Student account created successfully!');
      
      // Log the activity
      const userId = localStorage.getItem('userId');
      const studentFullName = `${formData.first_name} ${formData.middle_name ? formData.middle_name + ' ' : ''}${formData.last_name}`.trim();
      await logStudentAdded(institutionId, userId, studentFullName);
      
      // Reset form
      setFormData({
        student_id: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        username: '',
        email: '',
        password: '',
        program_id: ''
      });
      setSearchTerm('');

      // Notify parent component
      if (onStudentAdded) {
        onStudentAdded(result.student);
      }

      // Close modal after 1.5 seconds
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1500);

    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to create student account';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        student_id: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        username: '',
        email: '',
        password: '',
        program_id: ''
      });
      setSearchTerm('');
      setShowProgramDropdown(false);
      setError('');
      setSuccess('');
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className="add-student-modal-overlay" onClick={handleClose}>
      <div className="add-student-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="add-student-modal-header">
          <h2>
            <i className="fas fa-user-plus"></i>
            Add Student Account
          </h2>
          <button 
            className="add-student-modal-close" 
            onClick={handleClose}
            disabled={loading}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="add-student-modal-body">
          {error && (
            <div className="add-student-alert add-student-alert-error">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          {success && (
            <div className="add-student-alert add-student-alert-success">
              <i className="fas fa-check-circle"></i>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="add-student-form-row">
              <div className="add-student-form-group">
                <label htmlFor="student_id">
                  Student ID <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="student_id"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleChange}
                  placeholder="Enter student ID"
                  disabled={loading}
                  required
                />
              </div>

              <div className="add-student-form-group">
                <label htmlFor="username">
                  Username <span className="text-muted" style={{ fontWeight: 'normal' }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Leave empty for auto-generated username"
                  disabled={loading}
                />
                <small className="text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>
                  <i className="fas fa-info-circle me-1"></i>
                  If left empty, username will be auto-generated
                </small>
              </div>
            </div>

            <div className="add-student-form-row">
              <div className="add-student-form-group program-dropdown-container">
                <label htmlFor="program_search">
                  Program
                </label>
                <input
                  type="text"
                  id="program_search"
                  value={searchTerm}
                  onChange={handleProgramSearch}
                  onFocus={() => setShowProgramDropdown(true)}
                  placeholder="Search and select program (optional)"
                  disabled={loading}
                  autoComplete="off"
                />
                {showProgramDropdown && filteredPrograms.length > 0 && (
                  <div className="program-dropdown">
                    {filteredPrograms.map(program => (
                      <div
                        key={program.id}
                        className="program-dropdown-item"
                        onClick={() => selectProgram(program)}
                      >
                        <div className="program-name">{program.program_name}</div>
                        {program.program_code && (
                          <div className="program-code-small">{program.program_code}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {showProgramDropdown && searchTerm && filteredPrograms.length === 0 && (
                  <div className="program-dropdown">
                    <div className="program-dropdown-item no-results">
                      No programs found
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="add-student-form-row">
              <div className="add-student-form-group">
                <label htmlFor="first_name">
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  disabled={loading}
                  required
                />
              </div>

              <div className="add-student-form-group">
                <label htmlFor="middle_name">
                  Middle Name
                </label>
                <input
                  type="text"
                  id="middle_name"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleChange}
                  placeholder="Enter middle name (optional)"
                  disabled={loading}
                />
              </div>

              <div className="add-student-form-group">
                <label htmlFor="last_name">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="add-student-form-row">
              <div className="add-student-form-group">
                <label htmlFor="email">
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  disabled={loading}
                  required
                />
              </div>

              <div className="add-student-form-group">
                <label htmlFor="password">
                  Password <span className="text-muted" style={{ fontWeight: 'normal' }}>(Optional)</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave empty for auto-generated password"
                  disabled={loading}
                />
                <small className="text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>
                  <i className="fas fa-info-circle me-1"></i>
                  If left empty, password will be auto-generated
                </small>
              </div>
            </div>

            <div className="add-student-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus"></i>
                    Add Student
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddStudentModal;
