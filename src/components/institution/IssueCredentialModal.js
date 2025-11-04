// fileName: IssueCredentialModal.js

import React, { useMemo, useState, useEffect } from 'react';
import './AcademicInstitution.css';
import { uploadCredentialAfterBlockchain, fetchInstitutionPrograms, analyzeCredentialFile } from '../../services/institutionApiService';
import blockchainService from '../../services/blockchainService';
import { logCredentialIssued } from '../../services/activityLogService';

function IssueCredentialModal({
  show,
  onClose,
  credentialTypes,
  students,
  onIssued,
  account,
  dbPublicAddress,
  walletMatches,
  institutionId,
}) {
  // Local state moved from parent
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false);
  const [customCredentialType, setCustomCredentialType] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    credentialType: '',
    studentAccount: '',
    credentialFile: null,
    programId: '',
  });
  const [showLoaderModal, setShowLoaderModal] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loaderStatus, setLoaderStatus] = useState('loading'); // 'loading', 'success', 'cancelled'
  const [modalError, setModalError] = useState('');
  const [programs, setPrograms] = useState([]);
  
  // OCR + AI analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [currentStep, setCurrentStep] = useState(1);

  // Reset form function
  const resetForm = () => {
    setFormData({ credentialType: '', studentAccount: '', credentialFile: null, programId: '' });
    setShowCustomTypeInput(false);
    setCustomCredentialType('');
    setStudentSearchTerm('');
    setModalError('');
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setFileUploaded(false);
    setAnalysisProgress(0);
    setAnalysisStage('');
    setTimeRemaining(60);
    setCurrentStep(1);
    const fileInput = document.getElementById('credentialFile');
    if (fileInput) fileInput.value = '';
  };

  // Load programs when modal opens
  useEffect(() => {
    if (show && institutionId) {
      loadPrograms();
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, institutionId]);

  const loadPrograms = async () => {
    try {
      const programList = await fetchInstitutionPrograms(institutionId);
      setPrograms(programList);
    } catch (err) {
      console.error('Error loading programs:', err);
    }
  };

  // Compute filtered students locally for the modal
  const filteredStudents = useMemo(() => {
    if (!studentSearchTerm) {
      return students || [];
    }
    const searchLower = String(studentSearchTerm).toLowerCase();
    return (students || []).filter((student) => {
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
      const studentId = String(student.student_id).toLowerCase();
      return fullName.includes(searchLower) || studentId.includes(searchLower);
    });
  }, [students, studentSearchTerm]);

  // Find selected student for display
  const selectedStudent = useMemo(() => {
    if (!formData.studentAccount) return null;
    return (students || []).find(s => s.id === parseInt(formData.studentAccount));
  }, [students, formData.studentAccount]);

  const handleInputChange = async (e) => {
    const { name, value, files } = e.target;
    if (name === 'credentialType') {
      if (value === 'other') {
        setShowCustomTypeInput(true);
      } else {
        setShowCustomTypeInput(false);
        setCustomCredentialType('');
      }
    }
    
    // When student is selected, clear search term and auto-fill program
    if (name === 'studentAccount' && value) {
      setStudentSearchTerm('');
      
      // Auto-fill program based on student's program
      const student = (students || []).find(s => s.id === parseInt(value));
      
      if (student && student.program_id) {
        setFormData((prev) => ({
          ...prev,
          studentAccount: value,
          programId: student.program_id.toString(),
        }));
        if (uploadMessage) setUploadMessage('');
        if (modalError) setModalError('');
        return; // Exit early since we already updated formData
      }
    }
    
    // Handle file upload - trigger OCR + AI analysis
    if (name === 'credentialFile' && files && files[0]) {
      const file = files[0];
      setFormData((prev) => ({ ...prev, credentialFile: file }));
      setFileUploaded(true);
      setModalError('');
      
      // Start OCR + AI analysis
      await analyzeUploadedFile(file);
      return;
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
    if (uploadMessage) setUploadMessage('');
    if (modalError) setModalError('');
  };

  const handleCustomTypeChange = (e) => {
    setCustomCredentialType(e.target.value);
    if (modalError) setModalError('');
  };

  const handleStudentSearchChange = (e) => {
    setStudentSearchTerm(e.target.value);
    // Only clear selection if search term is empty
    if (e.target.value.trim() === '') {
      setFormData((prev) => ({ ...prev, studentAccount: '' }));
    }
    if (modalError) setModalError('');
  };

  // Step navigation
  const handleNextStep = () => {
    if (currentStep === 1 && fileUploaded && analysisResult && !isAnalyzing) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate required fields before going to step 3
      if (!formData.credentialType || !formData.studentAccount) {
        setModalError('Please fill in all required fields');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setModalError('');
    }
  };

  // Helper function to check if a specific warning exists
  const hasWarning = (keyword) => {
    if (!analysisResult || !analysisResult.warnings) return false;
    return analysisResult.warnings.some(warning => 
      warning.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  // Helper function to get specific warning message
  const getWarningMessage = (keyword) => {
    if (!analysisResult || !analysisResult.warnings) return null;
    const warning = analysisResult.warnings.find(w => 
      w.toLowerCase().includes(keyword.toLowerCase())
    );
    return warning;
  };

  // Analyze uploaded credential file with OCR + AI
  const analyzeUploadedFile = async (file) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisProgress(0);
    setTimeRemaining(60);
    
    // Progress simulation with stages
    const startTime = Date.now();
    const estimatedDuration = 60000; // 60 seconds
    
    // Stage 1: Uploading (0-10%)
    setAnalysisStage('Uploading file...');
    setAnalysisProgress(5);
    setTimeRemaining(60);
    
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(95, (elapsed / estimatedDuration) * 100);
      const remaining = Math.max(0, Math.ceil((estimatedDuration - elapsed) / 1000));
      
      setAnalysisProgress(progress);
      setTimeRemaining(remaining);
      
      // Update stage based on progress
      if (progress < 20) {
        setAnalysisStage('Uploading file...');
      } else if (progress < 40) {
        setAnalysisStage('Extracting text with OCR...');
      } else if (progress < 70) {
        setAnalysisStage('Analyzing with AI...');
      } else {
        setAnalysisStage('Processing results...');
      }
    }, 500);
    
    try {
      console.log('Starting credential analysis...');
      const result = await analyzeCredentialFile(file);
      
      // Clear interval and set to 100%
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      setTimeRemaining(0);
      setAnalysisStage('Analysis complete!');
      
      console.log('Analysis result:', result);
      
      // Track what was found/not found for warnings
      const warnings = [];
      let credentialTypeMatched = false;
      let studentMatched = false;
      let programMatched = false;
      
      if (result.success && result.data) {
        // Auto-fill credential type if found
        if (result.data.documentType) {
          const matchingType = credentialTypes.find(ct => 
            ct.type_name.toLowerCase() === result.data.documentType.toLowerCase() ||
            ct.type_name.toLowerCase().includes(result.data.documentType.toLowerCase()) ||
            result.data.documentType.toLowerCase().includes(ct.type_name.toLowerCase())
          );
          
          if (matchingType) {
            setFormData(prev => ({ ...prev, credentialType: matchingType.id.toString() }));
            console.log('Auto-filled credential type:', matchingType.type_name);
            credentialTypeMatched = true;
          } else {
            warnings.push(`Credential type "${result.data.documentType}" not found in system. Add or double check credential type.`);
          }
        } else {
          warnings.push('No credential type detected in document');
        }
        
        // Auto-fill student if name matches
        if (result.data.recipientName) {
          const nameParts = result.data.recipientName.toLowerCase().split(' ');
          const matchingStudent = students.find(s => {
            const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
            return nameParts.every(part => fullName.includes(part)) || 
                   fullName.split(' ').every(part => result.data.recipientName.toLowerCase().includes(part));
          });
          
          if (matchingStudent) {
            setFormData(prev => ({ 
              ...prev, 
              studentAccount: matchingStudent.id.toString(),
              programId: matchingStudent.program_id ? matchingStudent.program_id.toString() : prev.programId
            }));
            setStudentSearchTerm('');
            console.log('Auto-filled student:', matchingStudent.first_name, matchingStudent.last_name);
            studentMatched = true;
            if (matchingStudent.program_id) {
              programMatched = true;
            }
          } else {
            warnings.push(`Student "${result.data.recipientName}" not found in system. Add or double check student name.`);
          }
        } else {
          warnings.push('No student name detected in document');
        }
        
        // Auto-fill program if found and no student auto-filled (student auto-fill takes precedence)
        if (result.data.program && !studentMatched) {
          const matchingProgram = programs.find(p => 
            p.program_name.toLowerCase().includes(result.data.program.toLowerCase()) ||
            result.data.program.toLowerCase().includes(p.program_name.toLowerCase())
          );
          
          if (matchingProgram) {
            setFormData(prev => ({ ...prev, programId: matchingProgram.id.toString() }));
            console.log('Auto-filled program:', matchingProgram.program_name);
            programMatched = true;
          } else {
            warnings.push(`Program "${result.data.program}" not found in system. Add or double check program name.`);
          }
        } else if (!result.data.program && !programMatched) {
          warnings.push('No program detected in document');
        }
        
        // Add warnings to result
        result.warnings = warnings;
      }
      
      setAnalysisResult(result);
      
    } catch (error) {
      console.error('Analysis error:', error);
      clearInterval(progressInterval);
      setAnalysisProgress(0);
      setAnalysisStage('');
      setAnalysisResult({
        success: false,
        error: error.message || 'Failed to analyze credential file'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    // First check: Wallet verification
    if (!account) {
      setModalError('Please connect your MetaMask wallet before issuing credentials.');
      return;
    }

    if (!walletMatches) {
      setModalError('Wallet mismatch detected! Please switch to the correct MetaMask account that matches your institution\'s registered address before proceeding.');
      return;
    }

    const isCustomType = formData.credentialType === 'other';
    
    // Check each condition individually for better error messages
    if (!isCustomType && !formData.credentialType) {
      setModalError('Please select a credential type');
      return;
    }
    
    if (isCustomType && !customCredentialType.trim()) {
      setModalError('Please enter a custom credential type');
      return;
    }
    
    if (!formData.studentAccount) {
      setModalError('Please select a student');
      return;
    }
    
    if (!formData.credentialFile) {
      setModalError('Please select a file to upload');
      return;
    }

    const loggedInUserId = localStorage.getItem('userId');
    if (!loggedInUserId) {
      setModalError('Please log in again');
      return;
    }

    // Close input modal and show loader modal
    if (typeof onClose === 'function') onClose();
    setShowLoaderModal(true);
    setLoaderStatus('loading');
    setUploadMessage('Switching to Polygon Mainnet...');
    setUploadProgress(0);

    try {
      const selectedStudent = (students || []).find(
        (s) => s.id === parseInt(formData.studentAccount)
      );
      if (!selectedStudent) {
        throw new Error('Selected student not found.');
      }

      // Ensure user is on Polygon Mainnet before proceeding
      if (window.ethereum) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x89' }], // Polygon Mainnet chain ID (137 in hex)
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x89',
                  chainName: 'Polygon Mainnet',
                  nativeCurrency: {
                    name: 'POL',
                    symbol: 'POL',
                    decimals: 18
                  },
                  rpcUrls: ['https://polygon-rpc.com'],
                  blockExplorerUrls: ['https://polygonscan.com/']
                }]
              });
            } catch (addError) {
              throw new Error('Please add Polygon Mainnet to MetaMask');
            }
          } else if (switchError.code === 4001) {
            // User rejected the network switch
            throw new Error('Please switch to Polygon Mainnet to continue');
          } else {
            throw switchError;
          }
        }
      }

      // Update message after successful network switch
      setUploadMessage('Preparing transaction...');

      // Prepare file hash (no progress bar yet - user hasn't confirmed)
      const fileBuffer = await formData.credentialFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Request blockchain transaction - user can cancel here
      const blockchainResult = await blockchainService.issueCredential(
        fileHash,
        selectedStudent.student_id
      );

      // Only show progress bar AFTER MetaMask confirmation
      setUploadMessage('Issuing credential...');
      setUploadProgress(30); // Start at 30% since blockchain is confirmed

      // Prepare data for the API. It will have either a 'credential_type_id'
      // or a 'custom_type' string, but not both.
      const credentialData = {
        owner_id: parseInt(formData.studentAccount),
        sender_id: institutionId, // Use institution ID, not user ID (supports staff accounts)
      };
      if (isCustomType) {
        credentialData.custom_type = customCredentialType.trim();
      } else {
        credentialData.credential_type_id = parseInt(formData.credentialType);
      }
      
      // Add program_id if selected
      if (formData.programId) {
        credentialData.program_id = parseInt(formData.programId);
      }

      // Step 2: Upload to IPFS and save to database (70% progress)
      setUploadProgress(70);
      
      await uploadCredentialAfterBlockchain(
        credentialData, 
        formData.credentialFile, 
        blockchainResult.credentialId,  // Pass credential ID (not transaction hash)
        blockchainResult.transactionHash  // Pass transaction hash for reference
      );

      // Step 3: Complete (100% progress)
      setUploadProgress(100);
      setUploadMessage('Credential issued successfully!');
      setLoaderStatus('success');

      // Log the activity
      const credentialTypeName = isCustomType 
        ? customCredentialType.trim() 
        : credentialTypes.find(ct => ct.id === parseInt(formData.credentialType))?.type_name || 'Unknown';
      const studentFullName = `${selectedStudent.first_name} ${selectedStudent.middle_name ? selectedStudent.middle_name + ' ' : ''}${selectedStudent.last_name}`.trim();
      await logCredentialIssued(institutionId, parseInt(loggedInUserId), credentialTypeName, studentFullName);

      // Notify parent to refresh lists
      if (typeof onIssued === 'function') {
        try {
          await onIssued();
        } catch (e) {
          // ignore refresh errors
        }
      }

      // Auto-close loader after 3 seconds
      setTimeout(() => {
        setShowLoaderModal(false);
      }, 3000);
    } catch (error) {
      // Check if error is from blockchain transaction (user cancellation)
      if (error.message && (
        error.message.includes('User rejected') || 
        error.message.includes('User denied') ||
        error.message.includes('cancelled') ||
        error.message.includes('canceled')
      )) {
        setLoaderStatus('cancelled');
        setUploadMessage('Transaction was cancelled. Nothing was saved.');
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          setShowLoaderModal(false);
        }, 3000);
      } else {
        setLoaderStatus('error');
        setUploadMessage(`Process failed: ${error.message}`);
        
        // Auto-close after 5 seconds for errors
        setTimeout(() => {
          setShowLoaderModal(false);
        }, 5000);
      }
    } finally {
      setUploadProgress(0);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="credential-step-indicator" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      marginBottom: '2rem',
      padding: '1rem 0'
    }}>
      <div className={`credential-step-item ${currentStep >= 1 ? 'active' : ''}`} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      }}>
        <span className="credential-step-num" style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: currentStep >= 1 ? '#0066cc' : '#e9ecef',
          color: currentStep >= 1 ? 'white' : '#6c757d',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          marginBottom: '0.5rem'
        }}>1</span>
        <span className="credential-step-text" style={{
          fontSize: '0.85rem',
          color: currentStep >= 1 ? '#0066cc' : '#6c757d',
          fontWeight: currentStep >= 1 ? '600' : '400'
        }}>Upload</span>
      </div>
      <div className="credential-step-divider" style={{
        width: '80px',
        height: '2px',
        backgroundColor: currentStep >= 2 ? '#0066cc' : '#e9ecef',
        margin: '0 1rem',
        marginBottom: '2rem'
      }}></div>
      <div className={`credential-step-item ${currentStep >= 2 ? 'active' : ''}`} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <span className="credential-step-num" style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: currentStep >= 2 ? '#0066cc' : '#e9ecef',
          color: currentStep >= 2 ? 'white' : '#6c757d',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          marginBottom: '0.5rem'
        }}>2</span>
        <span className="credential-step-text" style={{
          fontSize: '0.85rem',
          color: currentStep >= 2 ? '#0066cc' : '#6c757d',
          fontWeight: currentStep >= 2 ? '600' : '400'
        }}>Details</span>
      </div>
      <div className="credential-step-divider" style={{
        width: '80px',
        height: '2px',
        backgroundColor: currentStep >= 3 ? '#0066cc' : '#e9ecef',
        margin: '0 1rem',
        marginBottom: '2rem'
      }}></div>
      <div className={`credential-step-item ${currentStep >= 3 ? 'active' : ''}`} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <span className="credential-step-num" style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: currentStep >= 3 ? '#0066cc' : '#e9ecef',
          color: currentStep >= 3 ? 'white' : '#6c757d',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          marginBottom: '0.5rem'
        }}>3</span>
        <span className="credential-step-text" style={{
          fontSize: '0.85rem',
          color: currentStep >= 3 ? '#0066cc' : '#6c757d',
          fontWeight: currentStep >= 3 ? '600' : '400'
        }}>Confirm</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Input Modal */}
      {show && (
        <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">
            <i className="fas fa-upload me-2"></i>
            Issue New Credential
          </h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          {renderStepIndicator()}
          {/* Wallet Status Warning */}
          {(!account || !walletMatches) && (
            <div className="wallet-verification-section" style={{ marginBottom: '1rem' }}>
              <div className="wallet-status-header">
                <i className="fas fa-wallet me-2"></i>
                Wallet Verification
              </div>
              {!account ? (
                <div className="alert alert-warning" role="alert">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>MetaMask Not Connected</strong>
                  <br />
                  Please connect your MetaMask wallet to issue credentials.
                </div>
              ) : !walletMatches ? (
                <div className="alert alert-danger" role="alert">
                  <i className="fas fa-times-circle me-2"></i>
                  <strong>Wallet Mismatch Detected!</strong>
                  <br />
                  <small>
                    Please switch to the correct MetaMask account before proceeding.
                  </small>
                </div>
              ) : null}
            </div>
          )}

          {modalError && (
            <div className="alert alert-danger" role="alert" style={{ marginBottom: '1rem' }}>
              {modalError}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            {/* STEP 1: File Upload */}
            {currentStep === 1 && (
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-file-alt me-2"></i>
                  <strong>Step 1:</strong> Upload Credential Document
                </label>
              
              {/* High Quality Tip */}
              <div className="alert alert-info d-flex align-items-start mb-3" style={{ backgroundColor: '#e7f3ff', border: '1px solid #b3d9ff' }}>
                <i className="fas fa-lightbulb me-2 mt-1" style={{ color: '#0066cc', fontSize: '1.1rem' }}></i>
                <div>
                  <strong style={{ color: '#0066cc' }}>Tip:</strong> Upload a <strong>clear, high-quality photo or PDF</strong> for best results. Better image quality helps our AI detect credential details more accurately.
                </div>
              </div>
              
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="credentialFile"
                  name="credentialFile"
                  onChange={handleInputChange}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff"
                  className="file-input"
                  required
                />
                <label htmlFor="credentialFile" className="file-input-label">
                  <i className="fas fa-cloud-upload-alt file-input-icon"></i>
                  {formData?.credentialFile ? 'Change Document' : 'Choose Document to Upload'}
                </label>
              </div>
              {formData?.credentialFile && (
                <div className="selected-file">
                  <i className="fas fa-file-check me-2"></i>
                  Selected: {formData.credentialFile.name}
                </div>
              )}
              <small className="text-muted mt-2 d-block">
                Supported formats: PDF, JPG, PNG, GIF, BMP, TIFF (Max 30MB)
              </small>
              
              {/* Analysis Progress */}
              {isAnalyzing && (
                <div className="alert alert-info mt-3" role="alert">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      <strong>{analysisStage}</strong>
                    </div>
                    <div className="d-flex align-items-center">
                      <span className="badge bg-primary me-2">{Math.round(analysisProgress)}%</span>
                      {timeRemaining > 0 && (
                        <small className="text-muted">~{timeRemaining}s remaining</small>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="progress" style={{ height: '8px', backgroundColor: '#e9ecef' }}>
                    <div 
                      className="progress-bar progress-bar-striped progress-bar-animated" 
                      role="progressbar" 
                      style={{ 
                        width: `${analysisProgress}%`,
                        backgroundColor: '#0066cc',
                        transition: 'width 0.5s ease'
                      }}
                      aria-valuenow={analysisProgress} 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    ></div>
                  </div>
                  
                  <small className="d-block mt-2 text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Analyzing with OCR + AI. This process may take 30-60 seconds.
                  </small>
                </div>
              )}
              
              {/* Analysis Result */}
              {analysisResult && !isAnalyzing && (
                <>
                  <div className={`alert ${analysisResult.success ? 'alert-success' : 'alert-warning'} mt-3`} role="alert">
                    {analysisResult.success ? (
                      <>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-check-circle me-2"></i>
                          <strong>Analysis Complete!</strong>
                          {analysisResult.mode === 'ai' && (
                            <span className="badge bg-primary ms-2">AI-Powered</span>
                          )}
                          {analysisResult.mode === 'ocr-only' && (
                            <span className="badge bg-secondary ms-2">OCR-Only</span>
                          )}
                        </div>
                        {analysisResult.data && (
                          <small className="d-block">
                            {analysisResult.data.documentType && (
                              <div><strong>Type:</strong> {analysisResult.data.documentType}</div>
                            )}
                            {analysisResult.data.recipientName && (
                              <div><strong>Recipient:</strong> {analysisResult.data.recipientName}</div>
                            )}
                            {analysisResult.data.program && (
                              <div><strong>Program:</strong> {analysisResult.data.program}</div>
                            )}
                            {analysisResult.data.confidence && (
                              <div className="mt-1"><em>Confidence: {analysisResult.data.confidence}</em></div>
                            )}
                          </small>
                        )}
                        {analysisResult.quotaExhausted && (
                          <div className="mt-2">
                            <small className="text-warning">
                              <i className="fas fa-exclamation-triangle me-1"></i>
                              AI quota exhausted. Using OCR-only mode.
                            </small>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-exclamation-triangle me-2"></i>
                          <strong>Analysis Failed</strong>
                        </div>
                        <small>{analysisResult.error || 'Could not analyze the file. Please fill the form manually.'}</small>
                      </>
                    )}
                  </div>
                  
                </>
              )}
              
              {/* Step 1 Navigation */}
              <div className="d-flex justify-content-end mt-4">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNextStep}
                  disabled={!fileUploaded || isAnalyzing || !analysisResult}
                >
                  Next: Review Details
                  <i className="fas fa-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
            )}

            {/* STEP 2: Review and Complete Details */}
            {currentStep === 2 && (
              <>
                {/* Allow changing document */}
                <div className="alert alert-info d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <i className="fas fa-file-check me-2"></i>
                    <strong>Document:</strong> {formData.credentialFile?.name}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setCurrentStep(1)}
                  >
                    <i className="fas fa-edit me-1"></i>
                    Change Document
                  </button>
                </div>

                <div className="form-group">
                  <label htmlFor="credentialType" className="form-label d-flex align-items-center justify-content-between">
                    <span>
                      <i className="fas fa-certificate me-2"></i>
                      Credential Type
                    </span>
                    {hasWarning('credential type') && (
                      <span className="badge bg-warning text-dark" style={{ fontSize: '0.75rem' }}>
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        Not found in system
                      </span>
                    )}
                  </label>
                  {hasWarning('credential type') && (
                    <small className="text-warning d-block mb-2">
                      <i className="fas fa-info-circle me-1"></i>
                      {getWarningMessage('credential type')}
                    </small>
                  )}
              <select
                id="credentialType"
                name="credentialType"
                value={formData?.credentialType || ''}
                onChange={handleInputChange}
                className="form-select"
                required={!showCustomTypeInput}
              >
                <option value="">Select Credential Type</option>
                {(credentialTypes || []).map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.type_name}
                  </option>
                ))}
                <option value="other">Other...</option>
              </select>
            </div>

            {showCustomTypeInput && (
              <div className="form-group" style={{ animation: 'fadeIn 0.5s' }}>
                <label htmlFor="customCredentialType" className="form-label">
                  <i className="fas fa-edit me-2"></i>
                  Specify Credential Type
                </label>
                <input
                  type="text"
                  id="customCredentialType"
                  name="customCredentialType"
                  value={customCredentialType || ''}
                  onChange={handleCustomTypeChange}
                  className="form-control"
                  placeholder="e.g., Certificate of Completion"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="studentSearch" className="form-label d-flex align-items-center justify-content-between">
                <span>
                  <i className="fas fa-user me-2"></i>
                  Student Account
                </span>
                {hasWarning('student') && (
                  <span className="badge bg-warning text-dark" style={{ fontSize: '0.75rem' }}>
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    Not found in system
                  </span>
                )}
              </label>
              {hasWarning('student') && (
                <small className="text-warning d-block mb-2">
                  <i className="fas fa-info-circle me-1"></i>
                  {getWarningMessage('student')}
                </small>
              )}
              
              {/* Show selected student with edit option */}
              {selectedStudent ? (
                <div className="selected-student-display p-3 border rounded bg-light d-flex justify-content-between align-items-center">
                  <div className="student-info">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-check me-2 text-success"></i>
                      <strong>{selectedStudent.first_name} {selectedStudent.last_name}</strong>
                      <span className="text-muted ms-2">({selectedStudent.student_id})</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, studentAccount: '' }));
                      setStudentSearchTerm('');
                    }}
                    title="Change student selection"
                  >
                    <i className="fas fa-edit me-1"></i>
                    Change
                  </button>
                </div>
              ) : (
                <>
                  {/* Search input - only show when no student selected */}
                  <input
                    type="text"
                    id="studentSearch"
                    name="studentSearch"
                    value={studentSearchTerm || ''}
                    onChange={handleStudentSearchChange}
                    className="form-control"
                    placeholder="Type student name or ID to search..."
                  />
                  
                  {/* Only show dropdown when user has typed something and no student selected */}
                  {studentSearchTerm && studentSearchTerm.trim().length > 0 && (
                    <div className="student-dropdown-container mt-2" style={{ animation: 'fadeIn 0.3s' }}>
                      <select
                        id="studentAccount"
                        name="studentAccount"
                        value={formData?.studentAccount || ''}
                        onChange={handleInputChange}
                        className="form-select"
                        required
                        size={Math.min(5, Math.max(2, filteredStudents.length))}
                      >
                        {filteredStudents.length === 0 ? (
                          <option value="" disabled>No students found</option>
                        ) : (
                          <>
                            <option value="">Select a student...</option>
                            {filteredStudents.map((student) => (
                              <option key={student.id} value={student.id}>
                                {student.first_name} {student.last_name} ({student.student_id})
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Program Selection */}
            <div className="form-group">
              <label htmlFor="programId" className="form-label d-flex align-items-center justify-content-between">
                <span>
                  <i className="fas fa-graduation-cap me-2"></i>
                  Program
                </span>
                {hasWarning('program') && (
                  <span className="badge bg-warning text-dark" style={{ fontSize: '0.75rem' }}>
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    Not found in system
                  </span>
                )}
              </label>
              {hasWarning('program') && (
                <small className="text-warning d-block mb-2">
                  <i className="fas fa-info-circle me-1"></i>
                  {getWarningMessage('program')}
                </small>
              )}
              <select
                id="programId"
                name="programId"
                value={formData?.programId || ''}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">Select Program (Optional)</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.program_code ? `${program.program_code} - ` : ''}{program.program_name}
                  </option>
                ))}
              </select>
              <small className="text-muted mt-1 d-block">
                <i className="fas fa-info-circle me-1"></i>
                {selectedStudent && selectedStudent.program_id 
                  ? 'Auto-filled from student profile. You can change if needed.' 
                  : 'Select the program for this credential'}
              </small>
            </div>

                {/* Step 2 Navigation */}
                <div className="d-flex justify-content-between mt-4">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handlePrevStep}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleNextStep}
                  >
                    Next: Confirm & Issue
                    <i className="fas fa-arrow-right ms-2"></i>
                  </button>
                </div>
              </>
            )}

            {/* STEP 3: Confirm and Issue */}
            {currentStep === 3 && (
              <>
                <div className="confirmation-section">
                  <h5 className="mb-4 text-center">
                    <i className="fas fa-clipboard-check me-2"></i>
                    Review & Confirm
                  </h5>
                  
                  {/* Summary Cards */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-subtitle mb-2 text-muted">
                            <i className="fas fa-certificate me-2"></i>
                            Credential Type
                          </h6>
                          <p className="card-text fw-bold">
                            {showCustomTypeInput 
                              ? customCredentialType 
                              : credentialTypes.find(ct => ct.id === parseInt(formData.credentialType))?.type_name || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-subtitle mb-2 text-muted">
                            <i className="fas fa-user me-2"></i>
                            Student
                          </h6>
                          <p className="card-text fw-bold">
                            {selectedStudent 
                              ? `${selectedStudent.first_name} ${selectedStudent.last_name} (${selectedStudent.student_id})`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-subtitle mb-2 text-muted">
                            <i className="fas fa-graduation-cap me-2"></i>
                            Program
                          </h6>
                          <p className="card-text fw-bold">
                            {programs.find(p => p.id === parseInt(formData.programId))?.program_name || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-subtitle mb-2 text-muted">
                            <i className="fas fa-file-alt me-2"></i>
                            Document
                          </h6>
                          <p className="card-text fw-bold text-truncate">
                            {formData.credentialFile?.name || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-warning">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Important:</strong> This will create a blockchain transaction. Make sure all details are correct before proceeding.
                  </div>
                </div>

                {/* Step 3 Navigation */}
                <div className="d-flex justify-content-between mt-4">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handlePrevStep}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Back to Details
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-success btn-lg"
                  >
                    <i className="fas fa-check-circle me-2"></i>
                    Confirm & Issue Credential
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
        </div>
      )}

      {/* Loader Modal */}
      {showLoaderModal && (
        <div className="modal-overlay">
          <div className="modal-content loader-modal">
            <div className={`modal-header ${
              loaderStatus === 'success' ? 'success-header' : 
              loaderStatus === 'cancelled' ? 'cancel-header' : 
              loaderStatus === 'error' ? 'error-header' : 'loading-header'
            }`}>
              <div className="status-icon">
                {loaderStatus === 'loading' && <i className="fas fa-spinner fa-spin"></i>}
                {loaderStatus === 'success' && <i className="fas fa-check-circle"></i>}
                {loaderStatus === 'cancelled' && <i className="fas fa-times-circle"></i>}
                {loaderStatus === 'error' && <i className="fas fa-exclamation-triangle"></i>}
              </div>
              <h3 className="modal-title">
                {loaderStatus === 'loading' && 'Processing...'}
                {loaderStatus === 'success' && 'Success!'}
                {loaderStatus === 'cancelled' && 'Cancelled'}
                {loaderStatus === 'error' && 'Error'}
              </h3>
            </div>
            <div className="modal-body">
              {loaderStatus === 'loading' && uploadProgress > 0 && (
                <div className="upload-progress-section">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="progress-label">{uploadMessage}</span>
                    <span className="progress-percentage">{uploadProgress}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {loaderStatus === 'loading' && uploadProgress === 0 && (
                <div className="loading-message">
                  <div className="d-flex align-items-center justify-content-center">
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    {uploadMessage}
                  </div>
                </div>
              )}

              {loaderStatus !== 'loading' && (
                <p className="status-message">
                  {uploadMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default IssueCredentialModal;

