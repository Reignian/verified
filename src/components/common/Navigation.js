import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './Navigation.css';

function Navigation({ onLoginClick, isLoggedIn = false, onLogout, userType, currentPage = 'home' }) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Get display name for user type
  const getUserTypeDisplay = () => {
    switch(userType) {
      case 'student':
        return 'Student';
      case 'institution':
      case 'institution_staff':
        return 'Institution';
      case 'admin':
        return 'Admin';
      default:
        return 'User';
    }
  };

  return (
    <>
      
      <nav className="navbar navbar-expand-lg navbar-custom">
        <div className="container">
          <a className="navbar-brand" href="#home">
            Verifi<span>ED</span>
          </a>
          
          <button 
            className="navbar-toggler" 
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              {/* Show navigation links only on homepage or when not logged in */}
              {(currentPage === 'home' || !isLoggedIn) && (
                <>
                  <li className="nav-item">
                    <a className="nav-link" href="#home">Home</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#about">About</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#how-it-works">How It Works</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#verifier">Verifier</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#contact">Contact</a>
                  </li>
                </>
              )}
              <li className="nav-item">
                {isLoggedIn ? (
                  <div className="d-flex align-items-center">
                    <span className="me-3" style={{ color: '#666', fontSize: '14px' }}>
                      {getUserTypeDisplay()}
                    </span>
                    <button 
                      className="btn btn-primary-custom ms-2"
                      onClick={onLogout}
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button 
                    className="btn btn-primary-custom ms-2"
                    onClick={onLoginClick}
                  >
                    Login
                  </button>
                )}
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navigation;
