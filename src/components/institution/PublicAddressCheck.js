// fileName: PublicAddressCheck.js
// Component to check if institution has public address and show modal if needed

import React, { useState, useEffect } from 'react';
import PublicAddressModal from './PublicAddressModal';
import './PublicAddressCheck.css';

function PublicAddressCheck({ institutionId, dbPublicAddress, onAddressUpdated, children }) {
  const [showModal, setShowModal] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Check if institution has public address when component mounts
    if (institutionId && !hasChecked) {
      setHasChecked(true);
      
      // If no public address exists, show the modal after a short delay
      if (!dbPublicAddress) {
        const timer = setTimeout(() => {
          setShowModal(true);
        }, 1000); // 1 second delay to allow page to load
        
        return () => clearTimeout(timer);
      }
    }
  }, [institutionId, dbPublicAddress, hasChecked]);

  const handleAddressUpdated = (newAddress) => {
    setShowModal(false);
    onAddressUpdated(newAddress);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // If no public address, show a restricted access overlay
  if (!dbPublicAddress && hasChecked) {
    return (
      <div className="public-address-check">
        <div className="restricted-access-overlay">
          <div className="restricted-content">
            <div className="restriction-icon">
              <i className="fas fa-lock"></i>
            </div>
            <h2>Public Address Required</h2>
            <p>
              To access the full institution dashboard and issue blockchain-verified credentials, 
              you need to add your institution's public Ethereum address.
            </p>
            <button 
              className="btn btn-primary add-address-btn"
              onClick={() => setShowModal(true)}
            >
              <i className="fas fa-plus-circle me-2"></i>
              Add Public Address
            </button>
          </div>
        </div>

        <div className="blurred-content">
          {children}
        </div>

        <PublicAddressModal
          show={showModal}
          onClose={handleCloseModal}
          institutionId={institutionId}
          currentAddress={dbPublicAddress}
          onAddressUpdated={handleAddressUpdated}
        />
      </div>
    );
  }

  // If public address exists, render children normally
  return (
    <>
      {children}
      <PublicAddressModal
        show={showModal}
        onClose={handleCloseModal}
        institutionId={institutionId}
        currentAddress={dbPublicAddress}
        onAddressUpdated={handleAddressUpdated}
      />
    </>
  );
}

export default PublicAddressCheck;
