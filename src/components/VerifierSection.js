import React, { useState } from 'react';
import './VerifierSection.css';
import { verifyCredential } from '../services/apiService';
import blockchainService from '../services/blockchainService';

function VerifierSection() {
  const [showVerificationResult, setShowVerificationResult] = useState(false);
  const [verificationInput, setVerificationInput] = useState('');
  const [credentialData, setCredentialData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [onChainData, setOnChainData] = useState(null);
  const [onChainVerification, setOnChainVerification] = useState(null);
  const [onChainError, setOnChainError] = useState('');

  const handleVerify = async () => {
    if (verificationInput.trim()) {
      setIsLoading(true);
      
      try {
        const response = await verifyCredential(verificationInput.trim());
        
        if (response.success && response.credential) {
          setCredentialData(response.credential);
          setShowVerificationResult(true);

          // Also fetch on-chain data using blockchain_id from DB
          setOnChainData(null);
          setOnChainVerification(null);
          setOnChainError('');
          const blockchainId = response.credential.blockchain_id;
          if (blockchainId) {
            try {
              const chainData = await blockchainService.fetchOnChainCredential(blockchainId);
              setOnChainData(chainData);
              const chainVerify = await blockchainService.verifyOnChainCredential(blockchainId);
              setOnChainVerification(chainVerify);
            } catch (chainErr) {
              console.warn('On-chain fetch failed:', chainErr);
              setOnChainError(chainErr?.message || 'Failed to fetch on-chain data');
            }
          }
        } else {
          alert('No credential found with this access code.');
          setShowVerificationResult(false);
        }
      } catch (error) {
        console.error('Verification error:', error);
        if (error.response && error.response.status === 404) {
          alert('No credential found with this access code.');
        } else {
          alert('Error occurred during verification. Please try again.');
        }
        setShowVerificationResult(false);
      } finally {
        setIsLoading(false);
      }
    } else {
      alert('Please enter a credential access code to verify.');
    }
  };

  const handleInputChange = (e) => {
    setVerificationInput(e.target.value);
  };

  const verifierBenefits = [
    "Instant verification without calls or emails",
    "Tamper-proof credential validation",
    "Reduced hiring risks and compliance concerns",
  ];

  return (
    <section id="verifier" className="verifier-section py-5 bg-white">
      <div className="container">
        <div className="section-header">
          <h2>Verifier Interface</h2>
          <p>Simple, secure credential verification for employers</p>
        </div>
        
        <div className="row align-items-center">
          <div className="col-lg-6 mb-4">
            <div className="verifier-ui">
              <div className="ui-header">
                <h3 className="mb-0">VerifiED Credential Checker</h3>
              </div>
              <div className="p-4">
                <div className="d-flex mb-3">
                  <input 
                    type="text" 
                    className="form-control me-2" 
                    placeholder="Enter credential access code"
                    value={verificationInput}
                    onChange={handleInputChange}
                  />
                  <button 
                    className="btn btn-primary-custom"
                    onClick={handleVerify}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </button>
                  <button className="btn btn-outline-primary ms-2">
                    <i className="fas fa-qrcode"></i>
                  </button>
                </div>
                
                {showVerificationResult && credentialData && (
                  <div className="verification-result-box">
                    <div className="d-flex align-items-center mb-3">
                      <i className="fas fa-check-circle text-success me-2"></i>
                      <span className="fw-bold text-success">Verified</span>
                    </div>
                    <div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="fw-bold">Student Name:</span>
                        <span>{credentialData.recipient_name}</span>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="fw-bold">Institution:</span>
                        <span>{credentialData.issuer_name}</span>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="fw-bold">Credential Type:</span>
                        <span>{credentialData.credential_type}</span>
                      </div>
                      <div className="d-flex justify-content-between py-2">
                        <span className="fw-bold">Issue Date:</span>
                        <span>{new Date(credentialData.date_issued).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {onChainError && (
                  <div className="alert alert-danger mt-3" role="alert">
                    {onChainError}
                  </div>
                )}
                
                {onChainData && (
                  <div className="verification-result-box mt-3">
                    <div className="d-flex align-items-center mb-3">
                      {onChainVerification?.exists ? (
                        <>
                          <i className="fas fa-check-circle text-success me-2"></i>
                          <span className="fw-bold text-success">On-Chain Record Found</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-times-circle text-danger me-2"></i>
                          <span className="fw-bold text-danger">On-Chain Record Not Found</span>
                        </>
                      )}
                    </div>
                    <div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="fw-bold">Credential ID:</span>
                        <span>{credentialData?.blockchain_id ?? 'N/A'}</span>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="fw-bold">Issuer (on-chain):</span>
                        <span>{onChainData.issuer}</span>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="fw-bold">Student ID (on-chain):</span>
                        <span>{onChainData.studentId || onChainData.studentIdBytes}</span>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="fw-bold">IPFS Prefix (bytes32):</span>
                        <span>{onChainData.ipfsCidPrefix || 'N/A'}</span>
                      </div>
                      <div className="d-flex justify-content-between py-2">
                        <span className="fw-bold">Created At (on-chain):</span>
                        <span>{onChainData.createdAt ? new Date(onChainData.createdAt * 1000).toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-lg-6">
            <h3>Verifier Benefits</h3>
            <ul className="list-unstyled">
              {verifierBenefits.map((benefit, index) => (
                <li key={index} className="d-flex align-items-center mb-3">
                  <i className="fas fa-check text-success me-3"></i>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VerifierSection;
