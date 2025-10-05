// fileName: PublicAddressModal.js
// Modal for adding/editing institution public address

import React, { useState, useEffect } from 'react';
import { updateInstitutionPublicAddress } from '../../services/institutionApiService';
import './PublicAddressModal.css';

function PublicAddressModal({ show, onClose, institutionId, currentAddress, onAddressUpdated }) {
  const [publicAddress, setPublicAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (show) {
      setPublicAddress(currentAddress || '');
      setError('');
    }
  }, [show, currentAddress]);

  const validateEthereumAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to connect your wallet.');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setPublicAddress(accounts[0]);
        setError('');
      }
    } catch (error) {
      console.error('MetaMask connection failed:', error);
      setError('Failed to connect to MetaMask. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!publicAddress.trim()) {
      setError('Public address is required');
      return;
    }

    if (!validateEthereumAddress(publicAddress)) {
      setError('Please enter a valid Ethereum address (0x followed by 40 hexadecimal characters)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await updateInstitutionPublicAddress(institutionId, publicAddress);
      onAddressUpdated(publicAddress);
      onClose();
    } catch (error) {
      console.error('Error updating public address:', error);
      setError(error.response?.data?.error || 'Failed to update public address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError('');
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content public-address-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="fas fa-wallet me-2"></i>
            {currentAddress ? 'Update Public Address' : 'Add Public Address'}
          </h3>
          <button 
            className="close-btn" 
            onClick={handleClose}
            disabled={isLoading}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="address-info">
            <p className="info-text">
              <i className="fas fa-info-circle me-2"></i>
              Your public address is required to issue blockchain-verified credentials. 
              This should be your institution's Ethereum wallet address.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="publicAddress">
                <i className="fas fa-key me-2"></i>
                Ethereum Public Address
              </label>
              <div className="input-group">
                <input
                  type="text"
                  id="publicAddress"
                  className={`form-control ${error ? 'is-invalid' : ''}`}
                  value={publicAddress}
                  onChange={(e) => setPublicAddress(e.target.value)}
                  placeholder="0x..."
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="btn btn-outline-primary connect-btn"
                  onClick={connectMetaMask}
                  disabled={isLoading || isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <i className="fab fa-ethereum me-2"></i>
                      Connect MetaMask
                    </>
                  )}
                </button>
              </div>
              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="address-validation">
              <small className="text-muted">
                <i className="fas fa-shield-alt me-1"></i>
                Address format: 0x followed by 40 hexadecimal characters
              </small>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !publicAddress.trim()}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    {currentAddress ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    {currentAddress ? 'Update Address' : 'Add Address'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PublicAddressModal;
