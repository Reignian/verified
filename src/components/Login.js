import React, { useState } from 'react';
import { login } from '../services/apiService';
import { useNavigate } from 'react-router-dom';

function Login({ onPageChange, isModal = false, onClose }) {
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
      const response = await login(formData.username, formData.password);
      console.log('Login successful:', response);
      console.log('User ID from response:', response.user.id);
      console.log('User object:', response.user);
      
      // Store user ID in localStorage for use in credential uploads
      localStorage.setItem('userId', response.user.id);
      localStorage.setItem('userType', response.user.account_type);
      
      // Close modal if it's a modal login
      if (isModal && onClose) onClose();
      
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

  if (isModal) {
    return (
      <>
        <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .modal-content-custom {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            max-width: 400px;
            width: 90%;
            position: relative;
          }

          .btn-primary-custom {
            background-color: var(--primary-color);
            border-color: var(--primary-color);
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            font-weight: 600;
            transition: var(--transition);
            border: none;
            text-decoration: none;
          }

          .btn-primary-custom:hover {
            background-color: var(--accent-color);
            border-color: var(--accent-color);
            transform: translateY(-2px);
            box-shadow: var(--shadow);
            color: white;
          }
        `}</style>
        
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose && onClose()}>
          <div className="modal-content-custom">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3>Login to VerifiED</h3>
              <button 
                className="btn-close" 
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}
              
              <div className="mb-3">
                <input name="username" type="text" className="form-control" placeholder="Username/Email" value={formData.username} onChange={handleInputChange} required disabled={loading}/>
              </div>
              <div className="mb-3">
                <input name="password" type="password" className="form-control" placeholder="Password" value={formData.password} onChange={handleInputChange} required disabled={loading}/>
              </div>
              <div className="mb-3">
                <select name="userType" className="form-select" value={formData.userType} onChange={handleInputChange} required disabled={loading}>
                  <option value="" disabled>Select User Type</option>
                  <option value="institution">Academic Institution</option>
                  <option value="student">Student/Graduate</option>
                  <option value="employer">Employer/Verifier</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary-custom w-100 mb-3" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
              <div className="text-center">
                <a href="#" className="text-decoration-none">Forgot Password?</a>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <div>
      <h1>Login</h1>
      <div>
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ color: 'red', marginBottom: '15px' }}>
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="username">Username:</label>
            <input type="text" id="username" name="username" value={formData.username} onChange={handleInputChange} placeholder="Enter your username" disabled={loading}/>
          </div>

          <div>
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Enter your password" disabled={loading}/>
          </div>

          <div>
            <label htmlFor="userType">User Type:</label>
            <select id="userType" name="userType" value={formData.userType} onChange={handleInputChange} disabled={loading} required>
              <option value="" disabled>Select User Type</option>
              <option value="institution">Academic Institution</option>
              <option value="student">Student/Graduate</option>
              <option value="employer">Employer/Verifier</option>
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
