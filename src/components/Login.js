import React, { useState } from 'react';
import { login } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    userType: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await login(formData.username, formData.password, formData.userType);
      console.log('Login successful:', response);
      console.log('User ID from response:', response.user.id);
      console.log('User object:', response.user);
      
      // Store user ID in localStorage for use in credential uploads
      localStorage.setItem('userId', response.user.id);
      localStorage.setItem('userType', response.user.account_type);
      
      // Call success callback to update app state
      if (onLoginSuccess) onLoginSuccess();
      
      // Navigate based on account type using React Router
      if (response.user.account_type === 'student') {
        navigate('/student-dashboard');
      } else if (response.user.account_type === 'institution') {
        navigate('/institution-dashboard');
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
        <h1 className="login-title">Welcome to Verified</h1>
        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error" style={{ marginBottom: '12px' }}>
              {error}
            </div>
          )}
          
          <div className="mb-3">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-control"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter your username"
              disabled={loading}
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
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

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
                />
                <label className="form-check-label" htmlFor="userTypeInstitution">Academic Institution</label>
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
                  required
                  disabled={loading}
                />
                <label className="form-check-label" htmlFor="userTypeStudent">Student/Graduate</label>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary-custom" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
