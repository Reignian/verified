// fileName: DeleteConfirmationModal.js

import React from 'react';
import './DeleteConfirmationModal.css';

const DeleteConfirmationModal = ({ show, onClose, onConfirm, studentName, loading, success, error }) => {
  if (!show) return null;

  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal-content">
        <div className="delete-modal-header">
          <h2>
            <i className="fas fa-exclamation-triangle"></i>
            Confirm Deletion
          </h2>
          <button 
            className="delete-modal-close" 
            onClick={onClose}
            disabled={loading}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="delete-modal-body">
          {success ? (
            <>
              <div className="delete-success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <p className="delete-success-message">
                {success}
              </p>
            </>
          ) : error ? (
            <>
              <div className="delete-error-icon">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <p className="delete-error-message">
                {error}
              </p>
            </>
          ) : (
            <>
              <div className="delete-warning-icon">
                <i className="fas fa-user-times"></i>
              </div>
              <p className="delete-message">
                Are you sure you want to delete <strong>{studentName}</strong>?
              </p>
              <p className="delete-warning">
                This action cannot be undone.
              </p>
            </>
          )}
        </div>

        {!success && (
          <div className="delete-modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Deleting...
                </>
              ) : (
                <>
                  <i className="fas fa-trash"></i>
                  Delete Student
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
