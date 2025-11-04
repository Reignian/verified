import React, { useState, useEffect } from 'react';
import './VerifierSection.css';
import { verifyCredential, compareCredentialFile } from '../../services/publicApiService';
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
  
  // File comparison states
  const [selectedFile, setSelectedFile] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparisonError, setComparisonError] = useState('');
  
  // Progress tracking states
  const [comparisonProgress, setComparisonProgress] = useState({
    stage: '',
    percentage: 0,
    message: '',
    timeRemaining: ''
  });
  
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        showError('Please upload an image or PDF file (JPEG, PNG, GIF, BMP, TIFF, or PDF)');
        return;
      }
      
      // Validate file size (30MB max)
      if (file.size > 30 * 1024 * 1024) {
        showError('File size must be less than 30MB');
        return;
      }
      
      setSelectedFile(file);
      setComparisonError('');
    }
  };

  const handleCompareFiles = async () => {
    if (!selectedFile) {
      setComparisonError('Please select a file to compare');
      return;
    }
    
    const credId = credentialData?.id;
    if (!credId) {
      setComparisonError('No verified credential found');
      return;
    }
    
    setIsComparing(true);
    setComparisonError('');
    
    // Simulate progress tracking
    const isPDF = selectedFile.type === 'application/pdf';
    const stages = [
      { stage: 'upload', message: 'Uploading file...', duration: 2000, percentage: 10 },
      { stage: 'download', message: 'Downloading verified credential...', duration: 3000, percentage: 20 },
    ];
    
    if (isPDF) {
      stages.push({ stage: 'pdf', message: 'Converting PDF to image...', duration: 8000, percentage: 35 });
    }
    
    stages.push(
      { stage: 'ocr1', message: 'Extracting text from verified file...', duration: 15000, percentage: isPDF ? 55 : 50 },
      { stage: 'ocr2', message: 'Extracting text from uploaded file...', duration: 15000, percentage: isPDF ? 75 : 70 },
      { stage: 'ai', message: 'Running AI analysis...', duration: 10000, percentage: isPDF ? 90 : 85 },
      { stage: 'compare', message: 'Comparing results...', duration: 3000, percentage: 95 }
    );
    
    let currentStageIndex = 0;
    
    const updateProgress = () => {
      if (currentStageIndex < stages.length) {
        const stage = stages[currentStageIndex];
        const timeRemaining = Math.ceil(
          stages.slice(currentStageIndex).reduce((sum, s) => sum + s.duration, 0) / 1000
        );
        
        setComparisonProgress({
          stage: stage.stage,
          percentage: stage.percentage,
          message: stage.message,
          timeRemaining: `~${timeRemaining}s remaining`
        });
        
        currentStageIndex++;
        if (currentStageIndex < stages.length) {
          setTimeout(updateProgress, stages[currentStageIndex - 1].duration);
        }
      }
    };
    
    updateProgress();
    
    try {
      const result = await compareCredentialFile(credId, selectedFile);
      
      if (result.success) {
        setComparisonProgress({
          stage: 'complete',
          percentage: 100,
          message: 'Comparison complete!',
          timeRemaining: ''
        });
        setTimeout(() => {
          setComparisonResult(result);
          setShowComparisonModal(true);
        }, 500);
      } else {
        setComparisonError(result.message || result.error || 'Comparison failed');
      }
    } catch (error) {
      console.error('Comparison error:', error);
      setComparisonError(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to compare files. Please try again.'
      );
    } finally {
      setTimeout(() => {
        setIsComparing(false);
        setComparisonProgress({ stage: '', percentage: 0, message: '', timeRemaining: '' });
      }, 500);
    }
  };

  const closeComparisonModal = () => {
    setShowComparisonModal(false);
    setComparisonResult(null);
  };

  const resetComparison = () => {
    setSelectedFile(null);
    setComparisonResult(null);
    setComparisonError('');
    setShowComparisonModal(false);
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

      // Check blockchain issuer against all institution addresses (current + historical)
      const chainIssuer = (chainData.issuer || '').trim().toLowerCase();
      const dbIssuer = (credential.issuer_public_address || '').trim().toLowerCase(); // Current address
      
      // Get all institution addresses (includes historical addresses)
      const institutionAddresses = credential.institution_addresses 
        ? credential.institution_addresses.split(',').map(addr => addr.trim().toLowerCase())
        : [dbIssuer];
      
      // Check if blockchain issuer matches ANY of the institution's addresses
      const issuerMatch = chainIssuer && institutionAddresses.length > 0 
        ? institutionAddresses.includes(chainIssuer)
        : false;

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
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" style={{ width: '14px', height: '14px' }}></span>
                        Verifying
                      </>
                    ) : 'Verify'}
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
                    
                    {/* File Comparison Section */}
                    <div className="file-comparison-section mt-4 pt-4 border-top">
                      <h5 className="mb-3">
                        <i className="fas fa-file-alt me-2"></i>
                        Compare with Another File
                      </h5>
                      <div className="alert alert-info d-flex align-items-start mb-3" style={{ backgroundColor: '#e7f3ff', border: '1px solid #b3d9ff' }}>
                        <i className="fas fa-lightbulb me-2 mt-1" style={{ color: '#0066cc', fontSize: '1.1rem' }}></i>
                        <div>
                          <strong style={{ color: '#0066cc' }}>Tip:</strong> Upload a <strong>clear, high-quality photo or PDF</strong> for best results. Better image quality helps our AI detect tampering more accurately.
                        </div>
                      </div>
                      
                      <div className="file-upload-area mb-3">
                        <input
                          type="file"
                          id="fileUpload"
                          className="d-none"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/tiff,application/pdf"
                          onChange={handleFileSelect}
                        />
                        <label htmlFor="fileUpload" className="file-upload-label">
                          <i className="fas fa-cloud-upload-alt me-2"></i>
                          {selectedFile ? selectedFile.name : 'Choose image or PDF file'}
                        </label>
                      </div>
                      
                      {selectedFile && (
                        <div className="selected-file-info mb-3">
                          <i className={`fas ${selectedFile.type === 'application/pdf' ? 'fa-file-pdf' : 'fa-file-image'} text-primary me-2`}></i>
                          <span className="text-muted small">
                            {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                          <button 
                            className="btn btn-sm btn-link text-danger ms-2 p-0"
                            onClick={resetComparison}
                            disabled={isComparing}
                            title={isComparing ? 'Cannot remove file during comparison' : 'Remove file'}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      )}
                      
                      {comparisonError && (
                        <div className="alert alert-danger py-2 small mb-3">
                          <i className="fas fa-exclamation-triangle me-2"></i>
                          {comparisonError}
                        </div>
                      )}
                      
                      <button
                        className="btn btn-primary w-100"
                        onClick={handleCompareFiles}
                        disabled={!selectedFile || isComparing}
                      >
                        {isComparing ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-exchange-alt me-2"></i>
                            Compare Files
                          </>
                        )}
                      </button>
                      
                      {/* Progress Indicator */}
                      {isComparing && comparisonProgress.percentage > 0 && (
                        <div className="comparison-progress-container mt-3">
                          <div className="progress-header mb-2">
                            <span className="progress-message">
                              <i className="fas fa-cog fa-spin me-2"></i>
                              {comparisonProgress.message}
                            </span>
                            <span className="progress-time text-muted small">
                              {comparisonProgress.timeRemaining}
                            </span>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div 
                              className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                              role="progressbar" 
                              style={{ width: `${comparisonProgress.percentage}%` }}
                              aria-valuenow={comparisonProgress.percentage}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            ></div>
                          </div>
                          <div className="text-center mt-1">
                            <small className="text-muted">{comparisonProgress.percentage}% complete</small>
                          </div>
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

      {/* Verification Loading Overlay */}
      {isLoading && (
        <div className="verification-loading-overlay">
          <div className="verification-loading-content">
            <div className="verification-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <h4 className="verification-loading-text">Verifying...</h4>
            <p className="verification-loading-subtext">Checking blockchain integrity</p>
          </div>
        </div>
      )}

      {/* Comparison Result Modal */}
      {showComparisonModal && comparisonResult && (
        <div className="verifier-modal-overlay" onClick={closeComparisonModal}>
          <div className="comparison-modal" onClick={(e) => e.stopPropagation()}>
            <div className="verifier-modal-header">
              <h5 className="verifier-modal-title">
                <i className="fas fa-file-contract me-2"></i>
                File Comparison Results
              </h5>
              <button 
                type="button" 
                className="verifier-btn-close" 
                onClick={closeComparisonModal}
                aria-label="Close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="verifier-modal-body">
              {/* Quota Warning */}
              {comparisonResult.quotaWarning && (
                <div className="alert alert-warning mb-3">
                  <h6 className="alert-heading">
                    <i className="fas fa-info-circle me-2"></i>
                    Gemini AI Quota Notice
                  </h6>
                  <p className="mb-0">{comparisonResult.quotaWarning}</p>
                  <hr className="my-2" />
                  <small className="text-muted">
                    <i className="fas fa-clock me-1"></i>
                    Free tier quota resets daily. Visit <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer">Google AI Studio</a> to check your usage.
                  </small>
                </div>
              )}
              
              {/* Type Mismatch Error */}
              {!comparisonResult.success && comparisonResult.error === 'Credential type mismatch' && (
                <div className="alert alert-danger">
                  <h6 className="alert-heading">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    Credential Type Mismatch
                  </h6>
                  <p className="mb-2">{comparisonResult.message}</p>
                  <hr />
                  <div className="d-flex justify-content-between small">
                    <div>
                      <strong>Verified File:</strong> {comparisonResult.verifiedType}
                    </div>
                    <div>
                      <strong>Uploaded File:</strong> {comparisonResult.uploadedType}
                    </div>
                  </div>
                </div>
              )}

              {/* Successful Comparison */}
              {comparisonResult.success && (
                <>
                  {/* Overall Status Alert */}
                  <div className={`alert ${
                    comparisonResult.overallStatus === 'identical' || comparisonResult.overallStatus === 'authentic' ? 'alert-success' : 
                    comparisonResult.overallStatus === 'suspicious' ? 'alert-warning' : 
                    'alert-danger'
                  } text-center mb-4`}>
                    <i className={`fas ${
                      comparisonResult.overallStatus === 'identical' ? 'fa-check-double' :
                      comparisonResult.overallStatus === 'authentic' ? 'fa-check-circle' : 
                      comparisonResult.overallStatus === 'suspicious' ? 'fa-exclamation-triangle' : 
                      'fa-times-circle'
                    } me-2 fs-4`}></i>
                    <h5 className="mb-2">{comparisonResult.statusMessage}</h5>
                    <small>AI Confidence: {comparisonResult.matchConfidence}</small>
                  </div>

                  {/* Credential Types */}
                  <div className="comparison-types mb-4">
                    <div className="row">
                      <div className="col-6">
                        <div className="type-card verified-type">
                          <small className="text-muted d-block">Verified File</small>
                          <strong>{comparisonResult.verifiedType}</strong>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="type-card uploaded-type">
                          <small className="text-muted d-block">Uploaded File</small>
                          <strong>{comparisonResult.uploadedType}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis Summary */}
                  {comparisonResult.aiAnalysis && comparisonResult.keyFindings && (
                    <div className="ai-analysis-section mb-4">
                      <h6 className="mb-3">
                        <i className="fas fa-robot me-2 text-primary"></i>
                        AI Visual Analysis
                      </h6>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className="analysis-card">
                            <div className="analysis-icon">
                              {comparisonResult.keyFindings.exactSameDocument ? 
                                <i className="fas fa-equals text-success"></i> : 
                                <i className="fas fa-not-equal text-warning"></i>
                              }
                            </div>
                            <div className="analysis-content">
                              <div className="analysis-label">Document Match</div>
                              <div className="analysis-value">
                                {comparisonResult.keyFindings.exactSameDocument ? 'Identical' : 'Different'}
                              </div>
                            </div>
                          </div>
                        </div>
                        {comparisonResult.keyFindings.authenticityScore !== null && (
                          <div className="col-md-6">
                            <div className="analysis-card">
                              <div className="analysis-icon">
                                <i className="fas fa-shield-alt text-primary"></i>
                              </div>
                              <div className="analysis-content">
                                <div className="analysis-label">Authenticity Score</div>
                                <div className="analysis-value">{comparisonResult.keyFindings.authenticityScore}%</div>
                              </div>
                            </div>
                          </div>
                        )}
                        {comparisonResult.keyFindings.sealMatch !== null && (
                          <div className="col-md-6">
                            <div className="analysis-card">
                              <div className="analysis-icon">
                                {comparisonResult.keyFindings.sealMatch ? 
                                  <i className="fas fa-stamp text-success"></i> : 
                                  <i className="fas fa-stamp text-danger"></i>
                                }
                              </div>
                              <div className="analysis-content">
                                <div className="analysis-label">Official Seal</div>
                                <div className="analysis-value">
                                  {comparisonResult.keyFindings.sealMatch ? 'Match ✓' : 'Mismatch ✗'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {comparisonResult.keyFindings.signatureMatch !== null && (
                          <div className="col-md-6">
                            <div className="analysis-card">
                              <div className="analysis-icon">
                                {comparisonResult.keyFindings.signatureMatch ? 
                                  <i className="fas fa-signature text-success"></i> : 
                                  <i className="fas fa-signature text-danger"></i>
                                }
                              </div>
                              <div className="analysis-content">
                                <div className="analysis-label">Signature</div>
                                <div className="analysis-value">
                                  {comparisonResult.keyFindings.signatureMatch ? 'Match ✓' : 'Mismatch ✗'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Tampering Detection */}
                      {comparisonResult.keyFindings.tamperingDetected && (
                        <div className="alert alert-danger mt-3">
                          <h6 className="alert-heading">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            Tampering Detected
                          </h6>
                          <p className="mb-0">
                            <strong>Severity:</strong> {comparisonResult.keyFindings.tamperingSeverity}
                          </p>
                        </div>
                      )}
                      
                      {/* Specific Tampering Details */}
                      {comparisonResult.specificTampering && comparisonResult.specificTampering.length > 0 && (
                        <div className="tampering-details-section mt-3">
                          <h6 className="mb-3">
                            <i className="fas fa-search-location me-2 text-danger"></i>
                            Specific Tampering Detected ({comparisonResult.specificTampering.length} {comparisonResult.specificTampering.length === 1 ? 'field' : 'fields'})
                          </h6>
                          <div className="tampering-items">
                            {comparisonResult.specificTampering.map((item, idx) => (
                              <div key={idx} className={`tampering-item alert ${
                                item.severity === 'Severe' ? 'alert-danger' :
                                item.severity === 'Moderate' ? 'alert-warning' :
                                'alert-info'
                              }`}>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div className="tampering-field">
                                    <i className="fas fa-exclamation-circle me-2"></i>
                                    <strong>{item.field}</strong>
                                  </div>
                                  <span className={`badge ${
                                    item.severity === 'Severe' ? 'bg-danger' :
                                    item.severity === 'Moderate' ? 'bg-warning' :
                                    'bg-info'
                                  }`}>
                                    {item.severity}
                                  </span>
                                </div>
                                
                                <div className="tampering-comparison mb-2">
                                  <div className="row g-2">
                                    <div className="col-md-6">
                                      <div className="tampering-value verified-value">
                                        <small className="text-muted d-block">
                                          <i className="fas fa-shield-alt me-1"></i>
                                          Original (Verified):
                                        </small>
                                        <code className="text-success">{item.originalValue || 'N/A'}</code>
                                      </div>
                                    </div>
                                    <div className="col-md-6">
                                      <div className="tampering-value tampered-value">
                                        <small className="text-muted d-block">
                                          <i className="fas fa-file-upload me-1"></i>
                                          Tampered (Uploaded):
                                        </small>
                                        <code className="text-danger">{item.tamperedValue || 'N/A'}</code>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="tampering-metadata">
                                  <div className="row g-2 small">
                                    <div className="col-md-6">
                                      <i className="fas fa-map-marker-alt me-1 text-primary"></i>
                                      <strong>Location:</strong> {item.location}
                                    </div>
                                    <div className="col-md-6">
                                      <i className="fas fa-tools me-1 text-warning"></i>
                                      <strong>Method:</strong> {item.tamperingMethod}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* OCR-Only Mode Notice */}
                  {!comparisonResult.aiAnalysis && comparisonResult.matchConfidence && comparisonResult.matchConfidence.includes('OCR-only') && (
                    <div className="alert alert-info mb-4">
                      <i className="fas fa-info-circle me-2"></i>
                      <strong>Note:</strong> AI visual analysis unavailable. Results based on OCR text comparison only.
                    </div>
                  )}

                  {/* Text Similarity Score */}
                  {comparisonResult.ocrComparison && (
                    <div className="similarity-score-container mb-4">
                      <h6 className="mb-3">
                        <i className="fas fa-file-alt me-2"></i>
                        OCR Text Comparison
                      </h6>
                      <div className="text-center mb-3">
                        <h2 className={`similarity-percentage ${
                          comparisonResult.ocrComparison.similarity >= 80 ? 'text-success' : 
                          comparisonResult.ocrComparison.similarity >= 60 ? 'text-warning' : 
                          'text-danger'
                        }`}>
                          {comparisonResult.ocrComparison.similarity}%
                        </h2>
                        <p className="text-muted mb-0">Text Similarity</p>
                      </div>
                      
                      <div className="progress" style={{ height: '25px' }}>
                        <div 
                          className={`progress-bar ${
                            comparisonResult.ocrComparison.similarity >= 80 ? 'bg-success' : 
                            comparisonResult.ocrComparison.similarity >= 60 ? 'bg-warning' : 
                            'bg-danger'
                          }`}
                          role="progressbar" 
                          style={{ width: `${comparisonResult.ocrComparison.similarity}%` }}
                        >
                          {comparisonResult.ocrComparison.similarity >= 10 && `${comparisonResult.ocrComparison.similarity}%`}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Comparison Statistics */}
                  {comparisonResult.ocrComparison && (
                    <div className="comparison-stats mb-4">
                      <h6 className="mb-3">Text Comparison Statistics</h6>
                      <div className="row g-3">
                        <div className="col-6">
                          <div className="stat-card">
                            <div className="stat-value">{comparisonResult.ocrComparison.commonWords}</div>
                            <div className="stat-label">Common Words</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="stat-card">
                            <div className="stat-value">{comparisonResult.ocrComparison.differences.modifiedPercentage}%</div>
                            <div className="stat-label">Differences</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="stat-card">
                            <div className="stat-value text-danger">{comparisonResult.ocrComparison.differences.removedWords}</div>
                            <div className="stat-label">Removed Words</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="stat-card">
                            <div className="stat-value text-success">{comparisonResult.ocrComparison.differences.addedWords}</div>
                            <div className="stat-label">Added Words</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Visual Differences from AI */}
                  {comparisonResult.aiAnalysis?.visualComparison?.visualDifferences && (
                    <div className="visual-differences mb-4">
                      <h6 className="mb-3">
                        <i className="fas fa-eye me-2"></i>
                        AI-Detected Visual Differences
                      </h6>
                      
                      {comparisonResult.aiAnalysis.visualComparison.visualDifferences.textChanges?.length > 0 && (
                        <div className="alert alert-info">
                          <strong>Text Changes:</strong>
                          <ul className="mb-0 mt-2">
                            {comparisonResult.aiAnalysis.visualComparison.visualDifferences.textChanges.map((change, idx) => (
                              <li key={idx}>{change}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {comparisonResult.aiAnalysis.visualComparison.visualDifferences.sealDifferences && 
                       comparisonResult.aiAnalysis.visualComparison.visualDifferences.sealDifferences !== 'none' && (
                        <div className="alert alert-warning">
                          <strong>
                            <i className="fas fa-stamp me-2"></i>
                            Seal Differences:
                          </strong> {comparisonResult.aiAnalysis.visualComparison.visualDifferences.sealDifferences}
                        </div>
                      )}
                      
                      {comparisonResult.aiAnalysis.visualComparison.visualDifferences.signatureDifferences && 
                       comparisonResult.aiAnalysis.visualComparison.visualDifferences.signatureDifferences !== 'none' && (
                        <div className="alert alert-warning">
                          <strong>
                            <i className="fas fa-signature me-2"></i>
                            Signature Differences:
                          </strong> {comparisonResult.aiAnalysis.visualComparison.visualDifferences.signatureDifferences}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Text Differences */}
                  {comparisonResult.ocrComparison?.hasSignificantDifferences && (
                    <div className="text-differences mb-4">
                      <h6 className="mb-3">
                        <i className="fas fa-list-ul me-2"></i>
                        OCR Text Differences
                      </h6>
                      
                      {comparisonResult.ocrComparison.uniqueToVerified?.length > 0 && (
                        <div className="difference-section mb-3">
                          <div className="difference-header bg-danger text-white">
                            <i className="fas fa-minus-circle me-2"></i>
                            Only in Verified File ({comparisonResult.ocrComparison.uniqueToVerified.length} words)
                          </div>
                          <div className="difference-content">
                            {comparisonResult.ocrComparison.uniqueToVerified.slice(0, 30).map((word, idx) => (
                              <span key={idx} className="badge bg-danger-subtle text-danger me-1 mb-1">
                                {word}
                              </span>
                            ))}
                            {comparisonResult.ocrComparison.uniqueToVerified.length > 30 && (
                              <span className="text-muted small">
                                ... and {comparisonResult.ocrComparison.uniqueToVerified.length - 30} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {comparisonResult.ocrComparison.uniqueToUploaded?.length > 0 && (
                        <div className="difference-section">
                          <div className="difference-header bg-success text-white">
                            <i className="fas fa-plus-circle me-2"></i>
                            Only in Uploaded File ({comparisonResult.ocrComparison.uniqueToUploaded.length} words)
                          </div>
                          <div className="difference-content">
                            {comparisonResult.ocrComparison.uniqueToUploaded.slice(0, 30).map((word, idx) => (
                              <span key={idx} className="badge bg-success-subtle text-success me-1 mb-1">
                                {word}
                              </span>
                            ))}
                            {comparisonResult.ocrComparison.uniqueToUploaded.length > 30 && (
                              <span className="text-muted small">
                                ... and {comparisonResult.ocrComparison.uniqueToUploaded.length - 30} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Extracted Text Preview */}
                  <div className="text-preview-section">
                    <h6 className="mb-3">
                      <i className="fas fa-file-alt me-2"></i>
                      Extracted Text Preview
                    </h6>
                    <div className="accordion" id="textPreviewAccordion">
                      <div className="accordion-item">
                        <h2 className="accordion-header">
                          <button 
                            className="accordion-button collapsed" 
                            type="button" 
                            data-bs-toggle="collapse" 
                            data-bs-target="#verifiedText"
                          >
                            <i className="fas fa-shield-alt me-2 text-primary"></i>
                            Verified File Text (OCR)
                          </button>
                        </h2>
                        <div id="verifiedText" className="accordion-collapse collapse" data-bs-parent="#textPreviewAccordion">
                          <div className="accordion-body">
                            <pre className="text-preview">{comparisonResult.verifiedText}</pre>
                          </div>
                        </div>
                      </div>
                      
                      <div className="accordion-item">
                        <h2 className="accordion-header">
                          <button 
                            className="accordion-button collapsed" 
                            type="button" 
                            data-bs-toggle="collapse" 
                            data-bs-target="#uploadedText"
                          >
                            <i className="fas fa-file-upload me-2 text-secondary"></i>
                            Uploaded File Text (OCR)
                          </button>
                        </h2>
                        <div id="uploadedText" className="accordion-collapse collapse" data-bs-parent="#textPreviewAccordion">
                          <div className="accordion-body">
                            <pre className="text-preview">{comparisonResult.uploadedText}</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="verifier-modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={closeComparisonModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default VerifierSection;
