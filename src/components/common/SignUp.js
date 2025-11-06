// fileName: SignUp.js
// Modern institution account sign-up with Polygon blockchain integration

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUpPage.css';

function SignUp() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    institution_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const API_URL = process.env.NODE_ENV === 'production' 
        ? 'https://verified-production.up.railway.app/api'
        : 'http://localhost:3001/api';

      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          institution_name: formData.institution_name,
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      setSuccess(true);
    } catch (error) {
      console.error('Signup failed:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="signup-step-indicator">
      <div className={`signup-step-item ${currentStep >= 1 ? 'active' : ''}`}>
        <span className="signup-step-num">1</span>
        <span className="signup-step-text">Setup</span>
      </div>
      <div className="signup-step-divider"></div>
      <div className={`signup-step-item ${currentStep >= 2 ? 'active' : ''}`}>
        <span className="signup-step-num">2</span>
        <span className="signup-step-text">Account</span>
      </div>
    </div>
  );

  if (success) {
    return (
      <div className="signup-page-container">
        <div className="signup-page-card">
          <div className="signup-success-content">
            <div className="signup-success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h2 className="signup-success-title">Request Submitted!</h2>
            <p className="signup-success-subtitle">
              Your account request has been sent to the administrator.
            </p>
            <div className="signup-info-box">
              <div className="signup-info-item">
                <i className="fas fa-clock"></i>
                <span>Approval within 24-48 hours</span>
              </div>
              <div className="signup-info-item">
                <i className="fas fa-envelope"></i>
                <span>Email notification sent</span>
              </div>
              <div className="signup-info-item">
                <i className="fas fa-sign-in-alt"></i>
                <span>Login after approval</span>
              </div>
            </div>
            <button 
              className="signup-btn-primary"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-page-container">
      <div className="signup-page-card">
        <div className="signup-page-header">
          <h1 className="signup-page-title">Create Institution Account</h1>
          <p className="signup-page-subtitle">Join VerifiED to issue blockchain-verified credentials</p>
        </div>

        {renderStepIndicator()}

        {error && (
          <div className="signup-error-box">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Setup & MetaMask */}
        {currentStep === 1 && (
          <div className="signup-setup-grid">
            {/* Blockchain Info */}
            <div className="signup-info-card">
              <div className="signup-info-card-header">
                <i className="fab fa-ethereum"></i>
                <h3>Polygon Blockchain</h3>
              </div>
              <p className="signup-info-text">VerifiED uses <strong>Polygon (Matic) Network</strong> for fast, low-cost credential verification.</p>
              <div className="signup-blockchain-features">
                <div className="signup-feature-item">
                  <i className="fas fa-bolt"></i>
                  <span>Fast transactions</span>
                </div>
                <div className="signup-feature-item">
                  <i className="fas fa-dollar-sign"></i>
                  <span>Low gas fees</span>
                </div>
                <div className="signup-feature-item">
                  <i className="fas fa-shield-alt"></i>
                  <span>Secure & verified</span>
                </div>
              </div>
            </div>

            {/* MetaMask Setup */}
            <div className="signup-info-card">
              <div className="signup-info-card-header">
                <i className="fab fa-ethereum"></i>
                <h3>MetaMask Wallet</h3>
              </div>
              <p className="signup-info-text">Install MetaMask browser extension to interact with Polygon blockchain.</p>
              <div className="signup-steps-compact">
                <div className="signup-compact-step">
                  <span className="signup-badge-num">1</span>
                  <span>Visit <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">metamask.io</a></span>
                </div>
                <div className="signup-compact-step">
                  <span className="signup-badge-num">2</span>
                  <span>Install browser extension</span>
                </div>
                <div className="signup-compact-step">
                  <span className="signup-badge-num">3</span>
                  <span>Create new wallet & save recovery phrase</span>
                </div>
                <div className="signup-compact-step">
                  <span className="signup-badge-num">4</span>
                  <span>Copy your public address (0x...)</span>
                </div>
              </div>
              <button 
                type="button"
                className="signup-btn-info-link"
                onClick={() => setShowModal(true)}
              >
                <i className="fas fa-info-circle"></i>
                View Detailed Instructions
              </button>
            </div>

            {/* Requirements */}
            <div className="signup-info-card full-width">
              <div className="signup-info-card-header">
                <i className="fas fa-clipboard-list"></i>
                <h3>What You'll Need</h3>
              </div>
              <div className="signup-requirements-grid">
                <div className="signup-req-item">
                  <i className="fas fa-university"></i>
                  <div>
                    <strong>Institution Details</strong>
                    <p>Official name & email</p>
                  </div>
                </div>
                <div className="signup-req-item">
                  <i className="fas fa-wallet"></i>
                  <div>
                    <strong>MetaMask Wallet</strong>
                    <p>Polygon-compatible wallet</p>
                  </div>
                </div>
                <div className="signup-req-item">
                  <i className="fas fa-user-check"></i>
                  <div>
                    <strong>Admin Approval</strong>
                    <p>24-48 hour review</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Note */}
            <div className="signup-note-box full-width">
              <i className="fas fa-info-circle"></i>
              <div>
                <strong>Note:</strong> You'll add your MetaMask address <em>after</em> account approval. 
                Just have it ready for when you login.
              </div>
            </div>

            {/* Navigation */}
            <div className="signup-nav-buttons full-width">
              <button 
                type="button"
                className="signup-btn-secondary"
                onClick={() => navigate('/login')}
              >
                <i className="fas fa-arrow-left"></i>
                Back to Login
              </button>
              <button 
                type="button"
                className="signup-btn-primary"
                onClick={handleNextStep}
              >
                Continue to Account Setup
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Account Creation Form */}
        {currentStep === 2 && (
          <div className="signup-form-container">
            <form onSubmit={handleSubmit} className="signup-form">
              <div className="signup-form-row">
                <div className="signup-form-group">
                  <label htmlFor="institution_name">Institution Name *</label>
                  <input
                    type="text"
                    id="institution_name"
                    name="institution_name"
                    value={formData.institution_name}
                    onChange={handleInputChange}
                    placeholder="Harvard University"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="signup-form-group">
                  <label htmlFor="email">Official Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="contact@institution.edu"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="signup-form-row">
                <div className="signup-form-group">
                  <label htmlFor="username">Username *</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="username (min. 3 chars)"
                    required
                    disabled={loading}
                    minLength="3"
                  />
                </div>

                <div className="signup-form-group">
                  <label htmlFor="password">Password *</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength="6"
                      className="form-control"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  <small className="form-text">At least 6 characters</small>
                </div>
              </div>

              <div className="signup-form-group full-width">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <div className="input-group">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="signup-note-box">
                <i className="fas fa-clock"></i>
                <div>
                  <strong>After Submission:</strong> Admin reviews your request (24-48 hrs) → Email notification → Login & add MetaMask address
                </div>
              </div>

              <div className="signup-nav-buttons">
                <button 
                  type="button"
                  className="signup-btn-secondary"
                  onClick={handlePrevStep}
                  disabled={loading}
                >
                  <i className="fas fa-arrow-left"></i>
                  Previous
                </button>
                <button 
                  type="submit"
                  className="signup-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="signup-spinner"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Request
                      <i className="fas fa-paper-plane"></i>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Detailed Instructions Modal */}
      {showModal && (
        <div className="signup-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="signup-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="signup-modal-header">
              <h2>
                <i className="fab fa-ethereum"></i>
                MetaMask Setup Guide
              </h2>
              <button className="signup-modal-close" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="signup-modal-body">
              {/* What is MetaMask */}
              <div className="signup-modal-section">
                <h3><i className="fas fa-question-circle"></i> What is MetaMask?</h3>
                <p>
                  MetaMask is a cryptocurrency wallet that runs as a browser extension. It allows you to interact 
                  with blockchain networks like Polygon (Matic) directly from your web browser. For VerifiED, 
                  you'll use it to issue and manage blockchain-verified credentials.
                </p>
              </div>

              {/* Installation Steps */}
              <div className="signup-modal-section">
                <h3><i className="fas fa-download"></i> Installation Steps</h3>
                
                <div className="signup-detail-step">
                  <div className="signup-step-number-large">1</div>
                  <div className="signup-step-content-detail">
                    <h4>Download MetaMask</h4>
                    <p>Visit <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">metamask.io</a> and click the "Download" button.</p>
                    <p>Select your browser:</p>
                    <ul>
                      <li><strong>Chrome:</strong> Most popular, recommended</li>
                      <li><strong>Firefox:</strong> Privacy-focused option</li>
                      <li><strong>Brave:</strong> Built-in crypto features</li>
                      <li><strong>Edge:</strong> Windows default browser</li>
                    </ul>
                  </div>
                </div>

                <div className="signup-detail-step">
                  <div className="signup-step-number-large">2</div>
                  <div className="signup-step-content-detail">
                    <h4>Install the Extension</h4>
                    <p>Click "Add to [Browser]" or "Install" button</p>
                    <p>Confirm the installation when prompted</p>
                    <p>Pin the extension to your browser toolbar for easy access</p>
                  </div>
                </div>

                <div className="signup-detail-step">
                  <div className="signup-step-number-large">3</div>
                  <div className="signup-step-content-detail">
                    <h4>Create a New Wallet</h4>
                    <p>Click the MetaMask fox icon in your browser</p>
                    <p>Select "Create a new wallet"</p>
                    <p>Create a strong password (minimum 8 characters)</p>
                    <p className="signup-warning-text">
                      <i className="fas fa-exclamation-triangle"></i>
                      <strong>Important:</strong> This password encrypts your wallet on this device only
                    </p>
                  </div>
                </div>

                <div className="signup-detail-step">
                  <div className="signup-step-number-large">4</div>
                  <div className="signup-step-content-detail">
                    <h4>Secure Your Recovery Phrase</h4>
                    <p className="signup-critical-text">
                      <i className="fas fa-shield-alt"></i>
                      <strong>CRITICAL STEP - DO NOT SKIP!</strong>
                    </p>
                    <p>MetaMask will show you a 12-word Secret Recovery Phrase</p>
                    <p><strong>Write it down on paper</strong> in the exact order shown</p>
                    <p>Store it in a safe place (fireproof safe, safety deposit box)</p>
                    <div className="signup-warning-box">
                      <strong>⚠️ Security Warnings:</strong>
                      <ul>
                        <li>NEVER share your recovery phrase with anyone</li>
                        <li>NEVER type it into any website or app</li>
                        <li>NEVER take a screenshot or photo of it</li>
                        <li>NEVER store it digitally (email, cloud, notes app)</li>
                        <li>MetaMask support will NEVER ask for your recovery phrase</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="signup-detail-step">
                  <div className="signup-step-number-large">5</div>
                  <div className="signup-step-content-detail">
                    <h4>Confirm Your Recovery Phrase</h4>
                    <p>MetaMask will ask you to select words in the correct order</p>
                    <p>This ensures you wrote it down correctly</p>
                    <p>Click "Confirm" when done</p>
                  </div>
                </div>

                <div className="signup-detail-step">
                  <div className="signup-step-number-large">6</div>
                  <div className="signup-step-content-detail">
                    <h4>Get Your Public Address</h4>
                    <p>After setup, click the MetaMask icon</p>
                    <p>Your public address is shown at the top (starts with "0x...")</p>
                    <p>Click the address to copy it to clipboard</p>
                    <p className="signup-info-text-box">
                      <i className="fas fa-info-circle"></i>
                      You'll add this address to VerifiED after your account is approved
                    </p>
                  </div>
                </div>
              </div>

              {/* Polygon Network */}
              <div className="signup-modal-section">
                <h3><i className="fas fa-network-wired"></i> Connecting to Polygon Network</h3>
                <p>
                  VerifiED uses the <strong>Polygon (Matic) Network</strong>, not Ethereum mainnet. 
                  You'll need to add Polygon to MetaMask:
                </p>
                <div className="signup-network-info">
                  <p><strong>Network Name:</strong> Polygon Mainnet</p>
                  <p><strong>RPC URL:</strong> https://polygon-rpc.com</p>
                  <p><strong>Chain ID:</strong> 137</p>
                  <p><strong>Currency Symbol:</strong> MATIC</p>
                </div>
                <p className="info-text">
                  <i className="fas fa-lightbulb"></i>
                  Don't worry - VerifiED will guide you through adding Polygon network when you first login.
                </p>
              </div>

              {/* Security Best Practices */}
              <div className="signup-modal-section">
                <h3><i className="fas fa-lock"></i> Security Best Practices</h3>
                <div className="signup-security-grid">
                  <div className="signup-security-item">
                    <i className="fas fa-check-circle"></i>
                    <div>
                      <strong>DO:</strong>
                      <ul>
                        <li>Keep your recovery phrase offline and secure</li>
                        <li>Use a strong, unique password</li>
                        <li>Lock MetaMask when not in use</li>
                        <li>Only share your public address (0x...)</li>
                        <li>Verify transaction details before confirming</li>
                      </ul>
                    </div>
                  </div>
                  <div className="signup-security-item">
                    <i className="fas fa-times-circle"></i>
                    <div>
                      <strong>DON'T:</strong>
                      <ul>
                        <li>Share your recovery phrase or private key</li>
                        <li>Store recovery phrase digitally</li>
                        <li>Click suspicious links or connect to unknown sites</li>
                        <li>Give MetaMask access to untrusted websites</li>
                        <li>Ignore security warnings</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Troubleshooting */}
              <div className="signup-modal-section">
                <h3><i className="fas fa-tools"></i> Common Issues</h3>
                <div className="signup-faq-item">
                  <strong>Q: I lost my recovery phrase. What do I do?</strong>
                  <p>A: Unfortunately, there's no way to recover it. You'll need to create a new wallet. This is why it's critical to store it safely!</p>
                </div>
                <div className="signup-faq-item">
                  <strong>Q: Can I use the same MetaMask wallet on multiple devices?</strong>
                  <p>A: Yes! Install MetaMask on each device and import using your recovery phrase.</p>
                </div>
                <div className="signup-faq-item">
                  <strong>Q: Do I need cryptocurrency to use VerifiED?</strong>
                  <p>A: You'll need a small amount of MATIC for transaction fees (gas). VerifiED will provide guidance on obtaining MATIC.</p>
                </div>
                <div className="signup-faq-item">
                  <strong>Q: Is MetaMask safe?</strong>
                  <p>A: Yes, when used properly. MetaMask is open-source and trusted by millions. Just follow security best practices!</p>
                </div>
              </div>
            </div>

            <div className="signup-modal-footer">
              <button className="signup-btn-primary" onClick={() => setShowModal(false)}>
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SignUp;
