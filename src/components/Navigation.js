import React, { useState } from 'react';
import './Navigation.css';

function Navigation({ onLoginClick }) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      <style>{`
        .navbar-custom {
          background-color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          height: 80px;
        }

        .navbar-brand {
          font-size: 1.8rem;
          color: var(--text-dark) !important;
          font-weight: bold;
          text-decoration: none;
        }

        .navbar-brand span {
          color: var(--primary-color);
        }

        .nav-link {
          color: var(--text-dark) !important;
          font-weight: 500;
          transition: var(--transition);
        }

        .nav-link:hover {
          color: var(--primary-color) !important;
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

        @media (max-width: 768px) {
          .navbar-toggler {
            border: none;
            padding: 4px 8px;
          }

          .navbar-toggler:focus {
            box-shadow: none;
          }
        }
      `}</style>
      
      <nav className="navbar navbar-expand-lg navbar-custom">
        <div className="container">
          <a className="navbar-brand" href="#home">
            Verifi<span>ED</span>
          </a>
          
          <button 
            className="navbar-toggler" 
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className={`collapse navbar-collapse ${showMobileMenu ? 'show' : ''}`}>
            <ul className="navbar-nav ms-auto">
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
              <li className="nav-item">
                <button 
                  className="btn btn-primary-custom ms-2"
                  onClick={onLoginClick}
                >
                  Login
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navigation;
