// fileName: SignUp.js
// Institution account sign-up with MetaMask instructions

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';

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
    <div className="step-indicator mb-4">
      <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
        <div className="step-number">1</div>
        <div className="step-label">Instructions</div>
      </div>
      <div className="step-line"></div>
      <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
        <div className="step-number">2</div>
        <div className="step-label">MetaMask Setup</div>
      </div>
      <div className="step-line"></div>
      <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
        <div className="step-number">3</div>
        <div className="step-label">Account Details</div>
      </div>
    </div>
  );

  if (success) {
    return (
      <div className="signup-page">
        <div className="signup-card success-card">
          <div className="text-center">
            <div className="success-icon mb-4">
              <i className="fas fa-check-circle"></i>
            </div>
            <h2 className="mb-3">Request Submitted Successfully!</h2>
            <p className="text-muted mb-4">
              Your institution account request has been sent to the administrator for approval.
              You will be notified via email once your account is approved.
            </p>
            <div className="alert alert-info">
              <i className="fas fa-info-circle me-2"></i>
              <strong>Next Steps:</strong>
              <ul className="text-start mt-2 mb-0">
                <li>Wait for admin approval (usually within 24-48 hours)</li>
                <li>Check your email for approval notification</li>
                <li>Once approved, you can login with your credentials</li>
                <li>After login, you'll be prompted to add your MetaMask public address</li>
              </ul>
            </div>
            <button 
              className="btn btn-primary mt-3"
              onClick={() => navigate('/login')}
            >
              <i className="fas fa-sign-in-alt me-2"></i>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="text-center mb-4">
          <h1 className="signup-title">Institution Account Sign Up</h1>
          <p className="text-muted">Create your institution account to start issuing verified credentials</p>
        </div>

        {renderStepIndicator()}

        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* Step 1: Instructions */}
        {currentStep === 1 && (
          <div className="step-content">
            <h3 className="mb-3">
              <i className="fas fa-info-circle me-2"></i>
              Welcome to VerifiED
            </h3>
            <div className="instruction-box">
              <h5>What You'll Need:</h5>
              <ul>
                <li><strong>Institution Information:</strong> Official name, email, and credentials</li>
                <li><strong>MetaMask Wallet:</strong> A blockchain wallet for credential verification</li>
                <li><strong>Admin Approval:</strong> Your account will be reviewed before activation</li>
              </ul>

              <h5 className="mt-4">Sign-Up Process:</h5>
              <ol>
                <li><strong>Read Instructions:</strong> Understand the requirements (this step)</li>
                <li><strong>Set Up MetaMask:</strong> Install and create your blockchain wallet</li>
                <li><strong>Create Account:</strong> Fill in your institution details</li>
                <li><strong>Wait for Approval:</strong> Admin will review your request</li>
                <li><strong>Login & Add Address:</strong> Once approved, login and add your MetaMask public address</li>
              </ol>

              <div className="alert alert-warning mt-3">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Important:</strong> Your account will be in "pending" status until approved by an administrator.
                You will receive an email notification once your account is approved.
              </div>
            </div>

            <div className="d-flex justify-content-between mt-4">
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/login')}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back to Login
              </button>
              <button 
                type="button"
                className="btn btn-primary"
                onClick={handleNextStep}
              >
                Next: MetaMask Setup
                <i className="fas fa-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: MetaMask Instructions */}
        {currentStep === 2 && (
          <div className="step-content">
            <h3 className="mb-3">
              <i className="fab fa-ethereum me-2"></i>
              MetaMask Wallet Setup
            </h3>
            <div className="instruction-box">
              <p className="lead">
                MetaMask is a blockchain wallet that allows you to interact with the Ethereum blockchain.
                You'll need it to issue and verify credentials on VerifiED.
              </p>

              <h5 className="mt-4">Step-by-Step Guide:</h5>
              
              <div className="metamask-step">
                <div className="step-badge">1</div>
                <div className="step-details">
                  <h6>Install MetaMask Browser Extension</h6>
                  <p>Visit <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">metamask.io</a> and click "Download"</p>
                  <p>Choose your browser (Chrome, Firefox, Brave, or Edge) and install the extension</p>
                </div>
              </div>

              <div className="metamask-step">
                <div className="step-badge">2</div>
                <div className="step-details">
                  <h6>Create a New Wallet</h6>
                  <p>Click the MetaMask icon in your browser</p>
                  <p>Select "Create a new wallet"</p>
                  <p>Create a strong password for your wallet</p>
                </div>
              </div>

              <div className="metamask-step">
                <div className="step-badge">3</div>
                <div className="step-details">
                  <h6>Secure Your Recovery Phrase</h6>
                  <p>MetaMask will show you a 12-word recovery phrase</p>
                  <p><strong className="text-danger">CRITICAL:</strong> Write this down and store it safely offline</p>
                  <p>Never share your recovery phrase with anyone</p>
                  <p>You'll need this to recover your wallet if you lose access</p>
                </div>
              </div>

              <div className="metamask-step">
                <div className="step-badge">4</div>
                <div className="step-details">
                  <h6>Get Your Public Address</h6>
                  <p>After setup, click the MetaMask icon</p>
                  <p>Your public address is shown at the top (starts with "0x...")</p>
                  <p>Click it to copy - you'll add this after your account is approved</p>
                </div>
              </div>

              <div className="alert alert-info mt-3">
                <i className="fas fa-lightbulb me-2"></i>
                <strong>Note:</strong> You don't need to add your public address during sign-up. 
                After your account is approved and you login, you'll be prompted to add your MetaMask public address to your institution profile.
              </div>

              <div className="alert alert-warning mt-3">
                <i className="fas fa-shield-alt me-2"></i>
                <strong>Security Tips:</strong>
                <ul className="mb-0 mt-2">
                  <li>Never share your recovery phrase or private key</li>
                  <li>MetaMask will never ask for your recovery phrase</li>
                  <li>Only share your public address (starts with 0x...)</li>
                  <li>Keep your password secure and unique</li>
                </ul>
              </div>
            </div>

            <div className="d-flex justify-content-between mt-4">
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={handlePrevStep}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Previous
              </button>
              <button 
                type="button"
                className="btn btn-primary"
                onClick={handleNextStep}
              >
                Next: Account Details
                <i className="fas fa-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Account Creation Form */}
        {currentStep === 3 && (
          <div className="step-content">
            <h3 className="mb-3">
              <i className="fas fa-university me-2"></i>
              Create Your Institution Account
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="institution_name" className="form-label">
                  Institution Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="institution_name"
                  name="institution_name"
                  value={formData.institution_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Harvard University"
                  required
                  disabled={loading}
                />
                <small className="form-text text-muted">
                  Enter the official name of your academic institution
                </small>
              </div>

              <div className="mb-3">
                <label htmlFor="username" className="form-label">
                  Username <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Choose a unique username"
                  required
                  disabled={loading}
                  minLength="3"
                />
                <small className="form-text text-muted">
                  This will be used for login (minimum 3 characters)
                </small>
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  Official Email Address <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="contact@institution.edu"
                  required
                  disabled={loading}
                />
                <small className="form-text text-muted">
                  Use your institution's official email address
                </small>
              </div>

              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Password <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a strong password"
                  required
                  disabled={loading}
                  minLength="8"
                />
                <small className="form-text text-muted">
                  Minimum 8 characters
                </small>
              </div>

              <div className="mb-3">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter your password"
                  required
                  disabled={loading}
                  minLength="8"
                />
              </div>

              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                <strong>What happens next?</strong>
                <ul className="mb-0 mt-2">
                  <li>Your account request will be sent to the administrator</li>
                  <li>Admin will review and approve your request</li>
                  <li>You'll receive an email notification once approved</li>
                  <li>After approval, login and add your MetaMask public address</li>
                </ul>
              </div>

              <div className="d-flex justify-content-between mt-4">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={handlePrevStep}
                  disabled={loading}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Previous
                </button>
                <button 
                  type="submit"
                  className="btn btn-success"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-2"></i>
                      Submit Account Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default SignUp;
