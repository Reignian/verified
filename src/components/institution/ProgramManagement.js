import React, { useState, useEffect } from 'react';
import {
  fetchInstitutionPrograms,
  addInstitutionProgram,
  deleteInstitutionProgram
} from '../../services/institutionApiService';

function ProgramManagement({ institutionId, profile }) {
  const [programList, setProgramList] = useState([]);
  const [showAddProgramForm, setShowAddProgramForm] = useState(false);
  const [programFormData, setProgramFormData] = useState({
    program_name: '',
    program_code: ''
  });
  const [programValidationErrors, setProgramValidationErrors] = useState({});
  const [programLoading, setProgramLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (institutionId) {
      loadProgramList();
    }
  }, [institutionId]);

  const loadProgramList = async () => {
    try {
      const programs = await fetchInstitutionPrograms(institutionId);
      setProgramList(programs);
    } catch (err) {
      console.error('Error loading programs:', err);
    }
  };

  const validateProgramForm = () => {
    const errors = {};

    if (!programFormData.program_name.trim()) {
      errors.program_name = 'Program name is required';
    }

    setProgramValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProgramChange = (e) => {
    const { name, value } = e.target;
    setProgramFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (programValidationErrors[name]) {
      setProgramValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddProgram = async (e) => {
    e.preventDefault();
    
    if (!validateProgramForm()) {
      setError('Please fix the validation errors in the form');
      return;
    }

    setProgramLoading(true);
    setError('');
    setSuccess('');

    try {
      const newProgram = {
        program_name: programFormData.program_name,
        program_code: programFormData.program_code
      };

      const loggedInUserId = localStorage.getItem('userId');
      await addInstitutionProgram(institutionId, newProgram, loggedInUserId);
      
      setSuccess('Program added successfully!');
      
      setProgramFormData({
        program_name: '',
        program_code: ''
      });
      setShowAddProgramForm(false);
      await loadProgramList();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding program:', err);
      setError(err.response?.data?.error || 'Failed to add program. Please try again.');
    } finally {
      setProgramLoading(false);
    }
  };

  const handleDeleteProgram = async (programId, programName) => {
    if (!window.confirm(`Are you sure you want to delete "${programName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const loggedInUserId = localStorage.getItem('userId');
      await deleteInstitutionProgram(programId, loggedInUserId, institutionId, programName);
      
      setSuccess('Program deleted successfully!');
      await loadProgramList();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting program:', err);
      setError(err.response?.data?.error || 'Failed to delete program. Please try again.');
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

      <div className="program-management">
        <div className="section-header">
          <h3 className="section-title">Programs</h3>
          <button 
            className="btn-add-program"
            onClick={() => setShowAddProgramForm(!showAddProgramForm)}
          >
            <i className={`fas fa-${showAddProgramForm ? 'times' : 'plus'} me-2`}></i>
            {showAddProgramForm ? 'Cancel' : 'Add Program'}
          </button>
        </div>

        {showAddProgramForm && (
          <form onSubmit={handleAddProgram} className="add-program-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="program_name">
                  Program Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="program_name"
                  name="program_name"
                  className={`form-control ${programValidationErrors.program_name ? 'is-invalid' : ''}`}
                  value={programFormData.program_name}
                  onChange={handleProgramChange}
                  placeholder="Enter program name"
                />
                {programValidationErrors.program_name && (
                  <div className="invalid-feedback">{programValidationErrors.program_name}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="program_code">Program Code</label>
                <input
                  type="text"
                  id="program_code"
                  name="program_code"
                  className="form-control"
                  value={programFormData.program_code}
                  onChange={handleProgramChange}
                  placeholder="Enter program code (optional)"
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-save-program"
                disabled={programLoading}
              >
                {programLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    Adding...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus me-2"></i>
                    Add Program
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {programList.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-graduation-cap"></i>
            <p>No programs added yet</p>
          </div>
        ) : (
          <div className="program-list-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Program Name</th>
                  <th>Code</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {programList.map((program) => (
                  <tr key={program.id}>
                    <td>{program.program_name}</td>
                    <td>
                      {program.program_code ? (
                        <span className="program-code-badge">{program.program_code}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn-delete-program"
                        onClick={() => handleDeleteProgram(
                          program.id,
                          program.program_name
                        )}
                        title="Delete program"
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

export default ProgramManagement;
