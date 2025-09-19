import React, { useState } from 'react';
import './VerifierSection.css';
import { verifyCredential } from '../services/apiService';
import blockchainService from '../services/blockchainService';
import { ethers } from 'ethers';

function VerifierSection() {
  const [showVerificationResult, setShowVerificationResult] = useState(false);
  const [verificationInput, setVerificationInput] = useState('');
  const [credentialData, setCredentialData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [onChainData, setOnChainData] = useState(null);
  const [onChainVerification, setOnChainVerification] = useState(null);
  const [onChainError, setOnChainError] = useState('');
  const [issuerAddressMatch, setIssuerAddressMatch] = useState(null);
  const [credentialIdMatch, setCredentialIdMatch] = useState(null);
  const [studentIdMatch, setStudentIdMatch] = useState(null);
  const [cidHashMatch, setCidHashMatch] = useState(null);

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
          setIssuerAddressMatch(null);
          setCredentialIdMatch(null);
          setStudentIdMatch(null);
          setCidHashMatch(null);
          const blockchainId = response.credential.blockchain_id;
          if (blockchainId) {
            try {
              const chainData = await blockchainService.fetchOnChainCredential(blockchainId);
              setOnChainData(chainData);
              const chainVerify = await blockchainService.verifyOnChainCredential(blockchainId);
              setOnChainVerification(chainVerify);

              // Compare DB institution public address vs on-chain issuer
              const dbAddr = (response.credential.issuer_public_address || '').trim().toLowerCase();
              const chainAddr = (chainData.issuer || '').trim().toLowerCase();
              if (chainVerify?.exists && dbAddr && chainAddr) {
                setIssuerAddressMatch(dbAddr === chainAddr);
              } else {
                setIssuerAddressMatch(null);
              }

              // Credential ID match: we treat 'exists on-chain for this ID' as a match
              if (typeof chainVerify?.exists === 'boolean') {
                setCredentialIdMatch(chainVerify.exists);
              } else {
                setCredentialIdMatch(null);
              }

              // Student ID match (DB vs on-chain decoded string)
              const dbStudentId = (response.credential.student_id ?? '').toString().trim();
              const chainStudentId = (chainData.studentId ?? '').toString().trim();
              if (chainVerify?.exists && dbStudentId && chainStudentId) {
                setStudentIdMatch(dbStudentId === chainStudentId);
              } else {
                setStudentIdMatch(null);
              }

              // CID hash match (compute SHA-256 of DB ipfs_cid and compare to on-chain bytes32)
              const dbCid = (response.credential.ipfs_cid ?? '').toString().trim();
              const chainCidHash = (chainData.ipfsCidHashHex ?? '').toString().trim();
              if (chainVerify?.exists && dbCid && chainCidHash) {
                try {
                  const computedCidHashHex = ethers.sha256(ethers.toUtf8Bytes(dbCid));
                  setCidHashMatch(computedCidHashHex.toLowerCase() === chainCidHash.toLowerCase());
                } catch (e) {
                  setCidHashMatch(null);
                }
              } else {
                setCidHashMatch(null);
              }
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
                      {issuerAddressMatch !== null && (
                        <span className={`badge ms-2 ${issuerAddressMatch ? 'bg-success' : 'bg-danger'}`}>
                          {issuerAddressMatch ? 'Issuer match' : 'Issuer mismatch'}
                        </span>
                      )}
                      {credentialIdMatch !== null && (
                        <span className={`badge ms-2 ${credentialIdMatch ? 'bg-success' : 'bg-danger'}`}>
                          {credentialIdMatch ? 'ID match' : 'ID not found'}
                        </span>
                      )}
                      {studentIdMatch !== null && (
                        <span className={`badge ms-2 ${studentIdMatch ? 'bg-success' : 'bg-danger'}`}>
                          {studentIdMatch ? 'Student ID match' : 'Student ID mismatch'}
                        </span>
                      )}
                      {cidHashMatch !== null && (
                        <span className={`badge ms-2 ${cidHashMatch ? 'bg-success' : 'bg-danger'}`}>
                          {cidHashMatch ? 'CID hash match' : 'CID hash mismatch'}
                        </span>
                      )}
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
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="fw-bold">Issuer (on-chain):</span>
                        <span>{onChainData?.issuer}</span>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="fw-bold">Credential ID Match:</span>
                        <span className={credentialIdMatch === true ? 'text-success' : credentialIdMatch === false ? 'text-danger' : ''}>
                          {credentialIdMatch === true ? 'Yes' : credentialIdMatch === false ? 'No' : 'Unknown'}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="fw-bold">Student ID (on-chain):</span>
                        <span>{onChainData?.studentId || onChainData?.studentIdBytes}</span>
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
                        <span className="fw-bold">Issuer Address (DB):</span>
                        <span>{credentialData?.issuer_public_address || 'N/A'}</span>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="fw-bold">Issuer (on-chain):</span>
                        <span>{onChainData.issuer}</span>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="fw-bold">Issuer Address Match:</span>
                        <span className={issuerAddressMatch === true ? 'text-success' : issuerAddressMatch === false ? 'text-danger' : ''}>
                          {issuerAddressMatch === true ? 'Yes' : issuerAddressMatch === false ? 'No' : 'Unknown'}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="fw-bold">Student ID (DB):</span>
                        <span>{credentialData?.student_id || 'N/A'}</span>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="fw-bold">Student ID Match:</span>
                        <span className={studentIdMatch === true ? 'text-success' : studentIdMatch === false ? 'text-danger' : ''}>
                          {studentIdMatch === true ? 'Yes' : studentIdMatch === false ? 'No' : 'Unknown'}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="fw-bold">Student ID (on-chain):</span>
                        <span>{onChainData.studentId || onChainData.studentIdBytes}</span>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="fw-bold">CID Hash (SHA-256 bytes32):</span>
                        <span>{onChainData.ipfsCidHashHex || 'N/A'}</span>
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
