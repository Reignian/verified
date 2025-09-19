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
  // All on-chain integrity checks will be computed and logged to console only.

  const runOnChainIntegrityChecks = async (credential) => {
    const blockchainId = credential?.blockchain_id;
    if (!blockchainId) {
      console.warn('[Verifier] No blockchain_id on credential. Skipping on-chain checks.');
      return;
    }
    try {
      const chainData = await blockchainService.fetchOnChainCredential(blockchainId);
      const chainVerify = await blockchainService.verifyOnChainCredential(blockchainId);

      const exists = !!chainVerify?.exists;

      const dbIssuer = (credential.issuer_public_address || '').trim().toLowerCase();
      const chainIssuer = (chainData.issuer || '').trim().toLowerCase();
      const issuerMatch = exists && dbIssuer && chainIssuer ? dbIssuer === chainIssuer : null;

      const idMatch = typeof chainVerify?.exists === 'boolean' ? chainVerify.exists : null;

      const dbStudentId = (credential.student_id ?? '').toString().trim();
      const chainStudentId = (chainData.studentId ?? '').toString().trim();
      const studentIdMatch = exists && dbStudentId && chainStudentId ? dbStudentId === chainStudentId : null;

      const dbCid = (credential.ipfs_cid ?? '').toString().trim();
      const chainCidHashHex = (chainData.ipfsCidHashHex ?? '').toString().trim();
      let cidHashMatch = null;
      let computedCidHashHex = null;
      if (exists && dbCid && chainCidHashHex) {
        try {
          computedCidHashHex = ethers.sha256(ethers.toUtf8Bytes(dbCid));
          cidHashMatch = computedCidHashHex.toLowerCase() === chainCidHashHex.toLowerCase();
        } catch {
          cidHashMatch = null;
        }
      }

      let dateMatch = null;
      let dbDayForMatch = null;
      let chainDayForMatch = null;
      try {
        const dbDate = new Date(credential.date_issued);
        dbDayForMatch = isNaN(dbDate.getTime()) ? null : dbDate.toISOString().slice(0, 10);
        chainDayForMatch = exists && chainData.createdAt
          ? new Date(chainData.createdAt * 1000).toISOString().slice(0, 10)
          : null;
        dateMatch = dbDayForMatch && chainDayForMatch ? dbDayForMatch === chainDayForMatch : null;
      } catch {
        dateMatch = null;
      }

      const indicators = {
        issuerMatch,
        idMatch,
        studentIdMatch,
        cidHashMatch,
        dateMatch,
        details: {
          blockchainId,
          onChainIssuer: chainData.issuer,
          onChainStudentId: chainData.studentId ?? null,
          onChainCidHashHex: chainCidHashHex,
          onChainCreatedAt: chainData.createdAt ?? null,
          expectedCidHashHex: computedCidHashHex,
          expectedIssueDateUTC: dbDayForMatch,
          onChainIssueDateUTC: chainDayForMatch,
          expectedIssuer: dbIssuer,
          expectedStudentId: dbStudentId,
        }
      };

      const allTrue = [issuerMatch, idMatch, studentIdMatch, cidHashMatch, dateMatch]
        .every(v => v === true);

      if (allTrue) {
        console.log('[Verifier] Blockchain verified');
      } else {
        console.group('[Verifier] Verification mismatches');
        if (idMatch !== true) {
          console.warn('[Verifier] Credential ID mismatch');
        }
        if (issuerMatch !== true) {
          console.warn('[Verifier] Issuer address mismatch');
        }
        if (studentIdMatch !== true) {
          console.warn('[Verifier] Student ID mismatch');
        }
        if (cidHashMatch !== true) {
          console.warn('[Verifier] CID hash mismatch');
        }
        if (dateMatch !== true) {
          console.warn('[Verifier] Issue date mismatch');
        }
        console.groupEnd();
      }

      return indicators;
    } catch (err) {
      console.error('[Verifier] On-chain checks failed:', err);
    }
  };

  const handleVerify = async () => {
    if (verificationInput.trim()) {
      setIsLoading(true);
      
      try {
        const response = await verifyCredential(verificationInput.trim());
        
        if (response.success && response.credential) {
          setCredentialData(response.credential);
          setShowVerificationResult(true);
          // Run all on-chain integrity checks and log indicators to console
          runOnChainIntegrityChecks(response.credential);
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
                      {credentialData?.ipfs_cid && (
                        <div className="d-flex justify-content-between py-2">
                          <span className="fw-bold">Credential File:</span>
                          <span>
                            <a 
                              href={`https://gateway.pinata.cloud/ipfs/${credentialData.ipfs_cid}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="me-2"
                            >
                              View
                            </a>
                          </span>
                        </div>
                      )}
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
