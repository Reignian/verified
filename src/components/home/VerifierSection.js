import React, { useState, useEffect } from 'react';
import './VerifierSection.css';
import { verifyCredential } from '../../services/publicApiService';
import blockchainService from '../../services/blockchainService';
import { ethers } from 'ethers';

// Pinata gateway URL from environment variable
const PINATA_GATEWAY = process.env.REACT_APP_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';

// Enable reading URL params to prefill the access code
function VerifierSection() {
  const [showVerificationResult, setShowVerificationResult] = useState(false);
  const [verificationInput, setVerificationInput] = useState('');
  const [credentialData, setCredentialData] = useState(null);
  const [credentialsData, setCredentialsData] = useState(null);
  const [verificationType, setVerificationType] = useState(null); // 'single' or 'multi'
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // All on-chain integrity checks will be computed and logged to console only.

  // Function to download file from IPFS
  const handleDownload = async (ipfsCid, studentName, credentialType) => {
    try {
      const url = `${PINATA_GATEWAY}/${ipfsCid}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Clean filename: remove special characters and spaces, replace with underscores
      const cleanStudentName = studentName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const cleanCredentialType = credentialType.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      link.download = `${cleanStudentName}-${cleanCredentialType}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  // Prefill access code from URL (?code=XXXXXX) and optionally auto-verify
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('code') || params.get('access_code') || params.get('accessCode');
      if (codeParam && typeof codeParam === 'string') {
        setVerificationInput(codeParam);

        const auto = (params.get('verify') || params.get('auto') || '').toLowerCase();
        if (auto === '1' || auto === 'true' || auto === 'yes') {
          // Defer to next tick and pass code directly to avoid state race
          setTimeout(() => {
            handleVerify(codeParam);
          }, 0);
        }

        // Clean the URL to remove query params, keep anchor for smooth scroll
        const { origin, pathname, hash } = window.location;
        const newUrl = `${origin}${pathname}${hash || '#verifier'}`;
        window.history.replaceState({}, '', newUrl);

        // Ensure verifier section is visible
        setTimeout(() => {
          const section = document.getElementById('verifier');
          if (section && section.scrollIntoView) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    } catch (e) {
      // no-op
    }
  }, []);

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  const runOnChainIntegrityChecks = async (credential) => {
    const blockchainId = credential?.blockchain_id;
    if (!blockchainId) {
      return { isValid: false, error: 'No blockchain ID found' };
    }
    
    try {
      const chainData = await blockchainService.fetchOnChainCredential(blockchainId);
      const chainVerify = await blockchainService.verifyOnChainCredential(blockchainId);

      const exists = !!chainVerify?.exists;
      
      if (!exists) {
        return { isValid: false, error: 'Credential not found on blockchain' };
      }

      const dbIssuer = (credential.issuer_public_address || '').trim().toLowerCase();
      const chainIssuer = (chainData.issuer || '').trim().toLowerCase();
      const issuerMatch = dbIssuer && chainIssuer ? dbIssuer === chainIssuer : false;

      const dbStudentId = (credential.student_id ?? '').toString().trim();
      const chainStudentId = (chainData.studentId ?? '').toString().trim();
      const studentIdMatch = dbStudentId && chainStudentId ? dbStudentId === chainStudentId : false;

      const dbCid = (credential.ipfs_cid ?? '').toString().trim();
      const chainCidHashHex = (chainData.ipfsCidHashHex ?? '').toString().trim();
      let cidHashMatch = false;
      let computedCidHashHex = null;
      
      if (dbCid && chainCidHashHex) {
        try {
          // Download file from IPFS and compute file content hash for verification
          const ipfsUrl = `https://amethyst-tropical-jackal-879.mypinata.cloud/ipfs/${dbCid}`;
          const response = await fetch(ipfsUrl);
          
          if (response.ok) {
            // Compute SHA-256 hash of file content (same as issuance process)
            const fileBuffer = await response.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            const fileHashWithPrefix = '0x' + fileHash;
            
            computedCidHashHex = fileHashWithPrefix;
            cidHashMatch = fileHashWithPrefix.toLowerCase() === chainCidHashHex.toLowerCase();
          } else {
            cidHashMatch = false;
            computedCidHashHex = 'ipfs_download_failed';
          }
        } catch (error) {
          cidHashMatch = false;
          computedCidHashHex = 'error: ' + error.message;
        }
      }

      let dateMatch = false;
      let dbDayForMatch = null;
      let chainDayForMatch = null;
      try {
        const dbDate = new Date(credential.date_issued);
        dbDayForMatch = isNaN(dbDate.getTime()) ? null : dbDate.toISOString().slice(0, 10);
        chainDayForMatch = chainData.createdAt
          ? new Date(chainData.createdAt * 1000).toISOString().slice(0, 10)
          : null;
        dateMatch = dbDayForMatch && chainDayForMatch ? dbDayForMatch === chainDayForMatch : false;
      } catch {
        dateMatch = false;
      }

      const allVerified = issuerMatch && studentIdMatch && cidHashMatch && dateMatch;

      // Temporary debug logging to identify the issue
      if (!allVerified) {
        console.group('🔍 Blockchain Verification Debug');
        console.log('Credential ID:', blockchainId);
        console.log('❌ Verification failed. Details:');
        console.log('  Issuer Match:', issuerMatch, '- Expected:', dbIssuer, 'Got:', chainIssuer);
        console.log('  Student ID Match:', studentIdMatch, '- Expected:', dbStudentId, 'Got:', chainStudentId);
        console.log('  CID Hash Match:', cidHashMatch, '- Expected:', computedCidHashHex, 'Got:', chainCidHashHex);
        console.log('  Date Match:', dateMatch, '- Expected:', dbDayForMatch, 'Got:', chainDayForMatch);
        console.log('  Database CID:', dbCid);
        console.groupEnd();
      }

      const indicators = {
        isValid: allVerified,
        issuerMatch,
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


      return indicators;
    } catch (err) {
      return { isValid: false, error: 'Blockchain verification failed: ' + err.message };
    }
  };

  const handleVerify = async (codeArg) => {
    const code = (typeof codeArg === 'string' ? codeArg : verificationInput).trim();
    if (code) {
      setIsLoading(true);
      
      try {
        const response = await verifyCredential(code);
        
        if (response.success) {
          if (response.type === 'single' && response.credential) {
            // Single credential verification - BLOCKCHAIN FIRST
            const blockchainResult = await runOnChainIntegrityChecks(response.credential);
            
            if (blockchainResult.isValid) {
              setCredentialData(response.credential);
              setCredentialsData(null);
              setVerificationType('single');
              setShowVerificationResult(true);
            } else {
              showError(`Blockchain verification failed: ${blockchainResult.error || 'Data integrity compromised. This credential has been tampered with or is not properly stored on the blockchain.'}`);
              setShowVerificationResult(false);
            }
          } else if (response.type === 'multi' && response.credentials) {
            // Multi-credential verification - BLOCKCHAIN FIRST FOR ALL
            const verifiedCredentials = [];
            const failedCredentials = [];
            
            for (let i = 0; i < response.credentials.length; i++) {
              const credential = response.credentials[i];
              const blockchainResult = await runOnChainIntegrityChecks(credential);
              
              if (blockchainResult.isValid) {
                verifiedCredentials.push(credential);
              } else {
                failedCredentials.push({
                  credential,
                  error: blockchainResult.error
                });
              }
            }
            
            if (verifiedCredentials.length > 0) {
              setCredentialsData(verifiedCredentials);
              setCredentialData(null);
              setVerificationType('multi');
              setShowVerificationResult(true);
            } else {
              showError(`All credentials failed blockchain verification. These credentials have been tampered with or are not properly stored on the blockchain.`);
              setShowVerificationResult(false);
            }
          } else {
            showError('No credential found with this access code.');
            setShowVerificationResult(false);
          }
        } else {
          showError('No credential found with this access code.');
          setShowVerificationResult(false);
        }
      } catch (error) {
        console.error('Verification error:', error);
        if (error.response && error.response.status === 404) {
          showError('No credential found with this access code.');
        } else {
          showError('Error occurred during verification. Please try again.');
        }
        setShowVerificationResult(false);
      } finally {
        setIsLoading(false);
      }
    } else {
      showError('Please enter a credential access code to verify.');
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
                </div>
                
                {showVerificationResult && verificationType === 'single' && credentialData && (
                  <div className="verification-result-box">
                    <div className="d-flex align-items-center mb-3">
                      <i className="fas fa-check-circle text-success me-2"></i>
                      <span className="fw-bold text-success">Verified</span>
                    </div>
                    <div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="fw-bold">Name:</span>
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
                      {credentialData.program_name && (
                        <div className="d-flex justify-content-between py-2 border-bottom">
                          <span className="fw-bold">Program:</span>
                          <span>{credentialData.program_name}{credentialData.program_code ? ` (${credentialData.program_code})` : ''}</span>
                        </div>
                      )}
                      <div className="d-flex justify-content-between py-2">
                        <span className="fw-bold">Issue Date:</span>
                        <span>{new Date(credentialData.date_issued).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                      {credentialData?.ipfs_cid && (
                        <div id="credential-file" className="d-flex justify-content-between py-2">
                          <span className="fw-bold"></span>
                          <span>
                            <a 
                              href={`${PINATA_GATEWAY}/${credentialData.ipfs_cid}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-secondary text-decoration-none me-3"
                              style={{ cursor: 'pointer' }}
                            >
                              <i className="fas fa-eye me-1"></i>
                              View
                            </a>
                            <button 
                              onClick={() => handleDownload(credentialData.ipfs_cid, credentialData.recipient_name, credentialData.credential_type)}
                              className="text-secondary border-0 bg-transparent text-decoration-none"
                              style={{ cursor: 'pointer' }}
                            >
                              <i className="fas fa-download me-1"></i>
                              Download
                            </button>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {showVerificationResult && verificationType === 'multi' && credentialsData && (
                  <div className="verification-result-box">
                    <div className="d-flex align-items-center mb-3">
                      <i className="fas fa-check-circle text-success me-2"></i>
                      <span className="fw-bold text-success">Verified ({credentialsData.length} Credentials)</span>
                    </div>
                    <div className="multi-credentials-container">
                      {credentialsData.map((credential, index) => (
                        <div key={credential.id} className="credential-card mb-3">
                          <div className="credential-header">
                            <h6 className="mb-2">
                              <i className="fas fa-award text-primary me-2"></i>
                              Credential {index + 1}
                            </h6>
                          </div>
                          <div className="credential-details">
                            <div className="d-flex justify-content-between py-1 border-bottom">
                              <span className="fw-bold">Name:</span>
                              <span>{credential.recipient_name}</span>
                            </div>
                            <div className="d-flex justify-content-between py-1 border-bottom">
                              <span className="fw-bold">Institution:</span>
                              <span>{credential.issuer_name}</span>
                            </div>
                            <div className="d-flex justify-content-between py-1 border-bottom">
                              <span className="fw-bold">Credential Type:</span>
                              <span>{credential.credential_type}</span>
                            </div>
                            {credential.program_name && (
                              <div className="d-flex justify-content-between py-1 border-bottom">
                                <span className="fw-bold">Program:</span>
                                <span>{credential.program_name}{credential.program_code ? ` (${credential.program_code})` : ''}</span>
                              </div>
                            )}
                            <div className="d-flex justify-content-between py-1">
                              <span className="fw-bold">Issue Date:</span>
                              <span>{new Date(credential.date_issued).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}</span>
                            </div>
                            {credential?.ipfs_cid && (
                              <div id="credential-file" className="d-flex justify-content-between py-1">
                                <span className="fw-bold"></span>
                                <span>
                                  <a 
                                    href={`${PINATA_GATEWAY}/${credential.ipfs_cid}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-secondary text-decoration-none me-3"
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <i className="fas fa-eye me-1"></i>
                                    View
                                  </a>
                                  <button 
                                    onClick={() => handleDownload(credential.ipfs_cid, credential.recipient_name, credential.credential_type)}
                                    className="text-secondary border-0 bg-transparent text-decoration-none"
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <i className="fas fa-download me-1"></i>
                                    Download
                                  </button>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
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

      {/* Error Modal */}
      {showErrorModal && (
        <div className="verifier-modal-overlay" onClick={closeErrorModal}>
          <div className="verifier-error-modal" onClick={(e) => e.stopPropagation()}>
            <div className="verifier-modal-header">
              <h5 className="verifier-modal-title">
                <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                Verification Error
              </h5>
              <button 
                type="button" 
                className="verifier-btn-close" 
                onClick={closeErrorModal}
                aria-label="Close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="verifier-modal-body">
              <p className="mb-0">{errorMessage}</p>
            </div>
            <div className="verifier-modal-footer">
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={closeErrorModal}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default VerifierSection;
