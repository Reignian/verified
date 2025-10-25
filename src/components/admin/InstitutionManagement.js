// fileName: InstitutionManagement.js

import React, { useState, useEffect } from 'react';
import { 
  fetchAllInstitutions, 
  createInstitution, 
  updateInstitution, 
  deleteInstitution,
  approveInstitution,
  rejectInstitution
} from '../../services/adminApiService';

function InstitutionManagement({ onStatsUpdate }) {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    institution_name: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    try {
      setLoading(true);
      const data = await fetchAllInstitutions();
      setInstitutions(data);
      setError('');
    } catch (error) {
      console.error('Failed to load institutions:', error);
      setError('Failed to load institutions');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editingInstitution) {
        await updateInstitution(editingInstitution.id, {
          username: formData.username,
          email: formData.email,
          institution_name: formData.institution_name
        });
      } else {
        await createInstitution(formData);
      }
      
      await loadInstitutions();
      if (onStatsUpdate) onStatsUpdate();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save institution:', error);
      setError(error.response?.data?.error || 'Failed to save institution');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (institution) => {
    setEditingInstitution(institution);
    setFormData({
      username: institution.username,
      password: '',
      email: institution.email,
      institution_name: institution.institution_name
    });
    setShowModal(true);
  };

  const handleDelete = async (institutionId) => {
    if (!window.confirm('Are you sure you want to delete this institution? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteInstitution(institutionId);
      await loadInstitutions();
      if (onStatsUpdate) onStatsUpdate();
    } catch (error) {
      console.error('Failed to delete institution:', error);
      setError('Failed to delete institution');
    }
  };

  const handleApprove = async (institutionId) => {
    if (!window.confirm('Are you sure you want to approve this institution account?')) {
      return;
    }

    try {
      await approveInstitution(institutionId);
      await loadInstitutions();
      if (onStatsUpdate) onStatsUpdate();
    } catch (error) {
      console.error('Failed to approve institution:', error);
      setError('Failed to approve institution');
    }
  };

  const handleReject = async (institutionId) => {
    if (!window.confirm('Are you sure you want to reject this institution account? This action cannot be undone.')) {
      return;
    }

    try {
      await rejectInstitution(institutionId);
      await loadInstitutions();
      if (onStatsUpdate) onStatsUpdate();
    } catch (error) {
      console.error('Failed to reject institution:', error);
      setError('Failed to reject institution');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      email: '',
      institution_name: ''
    });
    setEditingInstitution(null);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="institution-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Institution Management</h2>
          <p className="text-muted">Manage academic institution accounts and access</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Add Institution
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-dark">
              <tr>
                <th>Institution Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Status</th>
                <th>Students</th>
                <th>Credentials</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((institution) => (
                <tr key={institution.id}>
                  <td>
                    <strong>{institution.institution_name}</strong>
                  </td>
                  <td>{institution.username}</td>
                  <td>{institution.email}</td>
                  <td>
                    {institution.status === 'pending' && (
                      <span className="badge bg-warning text-dark">
                        <i className="fas fa-clock me-1"></i>
                        Pending
                      </span>
                    )}
                    {institution.status === 'approved' && (
                      <span className="badge bg-success">
                        <i className="fas fa-check me-1"></i>
                        Approved
                      </span>
                    )}
                    {institution.status === 'rejected' && (
                      <span className="badge bg-danger">
                        <i className="fas fa-times me-1"></i>
                        Rejected
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="badge bg-info">
                      {institution.student_count}
                    </span>
                  </td>
                  <td>
                    <span className="badge bg-success">
                      {institution.issued_credentials}
                    </span>
                  </td>
                  <td>{formatDate(institution.created_at)}</td>
                  <td>
                    {institution.status === 'pending' ? (
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleApprove(institution.id)}
                          title="Approve"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleReject(institution.id)}
                          title="Reject"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEdit(institution)}
                          title="Edit"
                          disabled={institution.status === 'rejected'}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(institution.id)}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {institutions.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-university fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No institutions found</h5>
              <p className="text-muted">Start by adding your first academic institution</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Institution Modal */}
      {showModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingInstitution ? 'Edit Institution' : 'Add New Institution'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseModal}
                ></button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="institution_name" className="form-label">
                      Institution Name *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="institution_name"
                      name="institution_name"
                      value={formData.institution_name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Harvard University"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">
                      Username *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      placeholder="Unique username for login"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="contact@institution.edu"
                    />
                  </div>

                  {!editingInstitution && (
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">
                        Password *
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        placeholder="Secure password for the account"
                      />
                    </div>
                  )}

                  {editingInstitution && (
                    <div className="alert alert-info">
                      <i className="fas fa-info-circle me-2"></i>
                      Password cannot be updated through this interface for security reasons.
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handleCloseModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {editingInstitution ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        {editingInstitution ? 'Update Institution' : 'Create Institution'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstitutionManagement;