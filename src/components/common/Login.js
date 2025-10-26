// fileName: Login.js (Updated with Admin Support)

import React, { useState } from 'react';
import { login } from '../../services/authApiService';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
    userType: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleAdminToggle = () => {
    setIsAdminLogin(!isAdminLogin);
    setFormData({
      emailOrUsername: '',
      password: '',
      userType: ''
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // For admin login, don't send userType
      const loginData = isAdminLogin ? 
        { emailOrUsername: formData.emailOrUsername, password: formData.password } :
        { emailOrUsername: formData.emailOrUsername, password: formData.password, userType: formData.userType };
      
      const response = await login(loginData.emailOrUsername, loginData.password, loginData.userType);
      console.log('Login successful:', response);
      console.log('User ID from response:', response.user.id);
      console.log('User object:', response.user);
      
      // Store user ID in localStorage for use in credential uploads
      localStorage.setItem('userId', response.user.id);
      localStorage.setItem('userType', response.user.account_type);
      
      // For institution_staff, store the institution_id and public_address
      if (response.user.institution_id) {
        localStorage.setItem('institutionId', response.user.institution_id);
      }
      if (response.user.public_address) {
        localStorage.setItem('publicAddress', response.user.public_address);
      }
      
      // Call success callback to update app state
      if (onLoginSuccess) onLoginSuccess();
      
      // Navigate based on account type using React Router
      if (response.user.account_type === 'student') {
        navigate('/student-dashboard');
      } else if (response.user.account_type === 'institution' || response.user.account_type === 'institution_staff') {
        navigate('/institution-dashboard');
      } else if (response.user.account_type === 'admin') {
        navigate('/admin-dashboard');
      }
      
    } catch (error) {
      console.error('Login failed:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <button
          type="button"
          className="btn-home"
          onClick={() => navigate('/')}
          title="Return to Homepage"
        >
          <i className="fas fa-home"></i>
        </button>
        <div className="text-center mb-4">
          <h1 className="login-title">Welcome to VerifiED</h1>
          <div className="login-toggle">
            <button
              type="button"
              className={`btn ${!isAdminLogin ? 'btn-primary' : 'btn-outline-primary'} me-2`}
              onClick={() => !isAdminLogin || handleAdminToggle()}
              disabled={loading}
            >
              User Login
            </button>
            <button
              type="button"
              className={`btn ${isAdminLogin ? 'btn-danger' : 'btn-outline-danger'}`}
              onClick={() => isAdminLogin || handleAdminToggle()}
              disabled={loading}
            >
              <i className="fas fa-cog me-1"></i>
              Admin
            </button>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error" style={{ marginBottom: '12px' }}>
              {error}
            </div>
          )}
          
          <div className="mb-3">
            <label htmlFor="emailOrUsername" className="form-label">Email or Username</label>
            <input
              type="text"
              id="emailOrUsername"
              name="emailOrUsername"
              className="form-control"
              value={formData.emailOrUsername}
              onChange={handleInputChange}
              placeholder={isAdminLogin ? "Enter admin username or email" : "Enter your email or username"}
              disabled={loading}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={isAdminLogin ? "Enter admin password" : "Enter your password"}
              disabled={loading}
              required
            />
          </div>

          {!isAdminLogin && (
            <div className="mb-3">
              <label className="form-label d-block">User Type</label>
              <div className="login-radios">
                <div className="form-check">
                  <input
                    type="radio"
                    className="form-check-input"
                    name="userType"
                    id="userTypeInstitution"
                    value="institution"
                    checked={formData.userType === 'institution'}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                  />
                  <label className="form-check-label" htmlFor="userTypeInstitution">
                    Academic Institution
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="radio"
                    className="form-check-input"
                    name="userType"
                    id="userTypeStudent"
                    value="student"
                    checked={formData.userType === 'student'}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                  />
                  <label className="form-check-label" htmlFor="userTypeStudent">
                    Student/Graduate
                  </label>
                </div>
              </div>
            </div>
          )}

          {isAdminLogin && (
            <div className="alert alert-warning d-flex align-items-center">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <small>Admin access restricted to authorized personnel only</small>
            </div>
          )}

          <button 
            type="submit" 
            className={`btn w-100 ${isAdminLogin ? 'btn-danger' : 'btn-primary'}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Logging in...
              </>
            ) : (
              <>
                <i className={`fas ${isAdminLogin ? 'fa-shield-alt' : 'fa-sign-in-alt'} me-2`}></i>
                {isAdminLogin ? 'Admin Login' : 'Login'}
              </>
            )}
          </button>
        </form>

        {isAdminLogin && (
          <div className="text-center mt-3">
            <small className="text-muted">
              For support, contact the system administrator
            </small>
          </div>
        )}

        {!isAdminLogin && (
          <div className="text-center mt-4">
            <div className="signup-divider">
              <span>Don't have an account?</span>
            </div>
            <button
              type="button"
              className="btn btn-outline-primary w-100 mt-3"
              onClick={() => navigate('/signup')}
              disabled={loading}
            >
              <i className="fas fa-user-plus me-2"></i>
              Sign Up as Institution
            </button>
            <small className="text-muted d-block mt-2">
              Create an institution account and wait for admin approval
            </small>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;