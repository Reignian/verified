// fileName: ErrorModal.js

import React from 'react';
import './AcademicInstitution.css';

function ErrorModal({ show, title = 'Error', message, onClose }) {
  if (!show) return null;
  return (
    <div className="error-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="error-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="error-modal-header">
          <h4 className="error-modal-title">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {title}
          </h4>
          <button className="error-modal-close" onClick={onClose} aria-label="Close">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="error-modal-body">
          <p className="error-message">{message}</p>
          <div className="text-center mt-4">
            <button className="btn btn-primary-custom" onClick={onClose} style={{ minWidth: '120px' }}>
              <i className="fas fa-check me-2"></i>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorModal;
