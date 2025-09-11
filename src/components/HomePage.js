import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom'; // <-- Import useNavigate

function HomePage() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showVerificationResult, setShowVerificationResult] = useState(false);
  const navigate = useNavigate(); // <-- Get the navigate function

  useEffect(() => {
    // Smooth scrolling for anchor links
    const handleSmoothScroll = (e) => {
      const href = e.target.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setShowMobileMenu(false);
        }
      }
    };

    document.addEventListener('click', handleSmoothScroll);
    return () => document.removeEventListener('click', handleSmoothScroll);
  }, []);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your message! We will get back to you soon.');
    e.target.reset();
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');
    const userType = formData.get('userType');
    
    if (userType !== 'institution') {
      alert('Only institution accounts are supported in this demo');
      return;
    }
    
    try {
      // Import the login function
      const { login } = await import('../services/apiService');
      const response = await login(username, password);
      console.log('Login successful:', response);
      console.log('User ID from response:', response.user.id);
      console.log('User object:', response.user);
      
      // Store user ID in localStorage for use in credential uploads
      localStorage.setItem('userId', response.user.id);
      localStorage.setItem('userType', response.user.account_type);
      
      setShowLoginModal(false);
      navigate('/institution-dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please check your credentials.');
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <style>{`
        :root {
          --primary-color: #4050b5;
          --secondary-color: #7986cb;
          --accent-color: #3d5afe;
          --success-color: #4caf50;
          --danger-color: #f44336;
          --text-dark: #333;
          --text-light: #666;
          --text-lightest: #999;
          --background-light: #f9f9f9;
          --background-white: #ffffff;
          --background-dark: #212121;
          --border-color: #e0e0e0;
          --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          --transition: all 0.3s ease;
        }

        body {
          background-color: var(--background-light);
          color: var(--text-dark);
        }

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

        .btn-secondary-custom {
          background-color: transparent;
          color: var(--primary-color);
          border: 2px solid var(--primary-color);
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: 600;
          transition: var(--transition);
          text-decoration: none;
        }

        .btn-secondary-custom:hover {
          background-color: var(--primary-color);
          color: white;
          transform: translateY(-2px);
          box-shadow: var(--shadow);
        }

        .hero-section {
          padding-top: 160px;
          padding-bottom: 80px;
          background: linear-gradient(to right, #f5f7ff, #e8eaff);
        }

        .hero-content h1 {
          font-size: 3rem;
          margin-bottom: 20px;
          color: var(--text-dark);
        }

        .hero-content p {
          font-size: 1.2rem;
          margin-bottom: 30px;
          color: var(--text-light);
        }

        .section-header {
          text-align: center;
          margin-bottom: 50px;
        }

        .section-header h2 {
          font-size: 2.5rem;
          margin-bottom: 15px;
          color: var(--primary-color);
        }

        .section-header p {
          color: var(--text-light);
          font-size: 1.2rem;
          max-width: 600px;
          margin: 0 auto;
        }

        .feature-card {
          background-color: var(--background-light);
          padding: 30px;
          border-radius: 8px;
          box-shadow: var(--shadow);
          text-align: center;
          transition: var(--transition);
          height: 100%;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        }

        .feature-icon {
          font-size: 2.5rem;
          color: var(--primary-color);
          margin-bottom: 20px;
        }

        .step-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: var(--shadow);
          overflow: hidden;
          margin-bottom: 30px;
        }

        .step-number {
          background-color: var(--primary-color);
          color: white;
          font-size: 1.5rem;
          font-weight: bold;
          width: 60px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 80px;
        }

        .verifier-ui {
          background-color: var(--background-light);
          border-radius: 8px;
          box-shadow: var(--shadow);
          overflow: hidden;
        }

        .ui-header {
          background-color: var(--primary-color);
          color: white;
          padding: 15px 20px;
        }

        .credential-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: var(--shadow);
          overflow: hidden;
          transition: var(--transition);
        }

        .credential-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
        }

        .verification-status {
          background-color: rgba(76, 175, 80, 0.1);
          color: var(--success-color);
          padding: 8px;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .use-case-card {
          background-color: var(--background-light);
          padding: 30px;
          border-radius: 8px;
          box-shadow: var(--shadow);
          text-align: center;
          transition: var(--transition);
          height: 100%;
        }

        .use-case-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        }

        .use-case-icon {
          font-size: 2.5rem;
          color: var(--primary-color);
          margin-bottom: 20px;
        }

        .cta-section {
          background: linear-gradient(to right, var(--primary-color), var(--secondary-color));
          color: white;
          text-align: center;
          padding: 80px 0;
        }

        .cta-section h2 {
          font-size: 2.5rem;
          margin-bottom: 20px;
        }

        .cta-section p {
          font-size: 1.2rem;
          margin-bottom: 30px;
          opacity: 0.9;
        }

        .cta-section .btn-light:hover {
          background-color: rgba(255, 255, 255, 0.9);
          transform: translateY(-2px);
        }

        .footer-custom {
          background-color: var(--background-dark);
          color: white;
          padding: 60px 0 30px;
        }

        .footer-custom h2 {
          font-size: 1.8rem;
          margin-bottom: 15px;
        }

        .footer-custom span {
          color: var(--secondary-color);
        }

        .footer-custom .footer-link {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: var(--transition);
        }

        .footer-custom .footer-link:hover {
          color: white;
        }

        .social-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background-color: var(--primary-color);
          color: white;
          border-radius: 50%;
          transition: var(--transition);
          text-decoration: none;
          margin-right: 15px;
        }

        .social-link:hover {
          background-color: var(--accent-color);
          transform: translateY(-3px);
          color: white;
        }

        .modal-overlay {
          display: ${showLoginModal ? 'flex' : 'none'};
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 2000;
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

        .verification-result-box {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          margin-top: 20px;
        }

        @media (max-width: 768px) {
          .hero-content h1 {
            font-size: 2.2rem;
          }
          
          .section-header h2 {
            font-size: 2rem;
          }

          .navbar-toggler {
            border: none;
            padding: 4px 8px;
          }

          .navbar-toggler:focus {
            box-shadow: none;
          }
        }

        @media (max-width: 576px) {
          .hero-content h1 {
            font-size: 1.8rem;
          }
          
          .cta-section h2 {
            font-size: 2rem;
          }
        }
      `}</style>

      {/* FontAwesome CDN */}
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
      />

      {/* Navbar */}
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
                  onClick={() => setShowLoginModal(true)}
                >
                  Login
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="hero-content">
                <h1>Secure Credential Verification on Blockchain</h1>
                <p>VerifiED revolutionizes academic credential verification with decentralized blockchain technology, ensuring authenticity, privacy, and security.</p>
                <div className="d-flex gap-3 flex-wrap">
                  <a href="#how-it-works" className="btn btn-primary-custom">Learn More</a>
                  <a href="#verifier" className="btn btn-secondary-custom">Go Verify</a>
                </div>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <img 
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 400'%3E%3Crect fill='%234050b5' x='50' y='50' width='100' height='100' rx='10'/%3E%3Crect fill='%237986cb' x='200' y='100' width='100' height='100' rx='10'/%3E%3Crect fill='%233d5afe' x='350' y='50' width='100' height='100' rx='10'/%3E%3Cpath stroke='%234050b5' stroke-width='3' fill='none' d='M100 150 L250 200 L400 150'/%3E%3Ccircle fill='%234caf50' cx='100' cy='150' r='5'/%3E%3Ccircle fill='%234caf50' cx='250' cy='200' r='5'/%3E%3Ccircle fill='%234caf50' cx='400' cy='150' r='5'/%3E%3Ctext x='250' y='350' text-anchor='middle' fill='%23333' font-family='Arial' font-size='16'%3EBlockchain Verification%3C/text%3E%3C/svg%3E" 
                alt="Blockchain credential verification illustration" 
                className="img-fluid" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-5 bg-white">
        <div className="container">
          <div className="section-header">
            <h2>About VerifiED</h2>
            <p>A decentralized application transforming credential verification</p>
          </div>
          
          <div className="row mb-5">
            <div className="col-lg-8 mx-auto text-center">
              <p className="lead">VerifiED is a blockchain-based credential verification platform that addresses the challenges of credential fraud, verification inefficiency, and privacy concerns. Our solution provides a secure, transparent, and efficient way for academic institutions to issue credentials and for companies to verify them.</p>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <h3>Secure & Tamper-proof</h3>
                <p>Blockchain technology ensures credentials cannot be altered or falsified.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-user-shield"></i>
                </div>
                <h3>Privacy-Focused</h3>
                <p>Allow selective disclosure of credential information.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-bolt"></i>
                </div>
                <h3>Efficient Verification</h3>
                <p>Instant verification without manual processing or intermediaries.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-5" style={{backgroundColor: 'var(--background-light)'}}>
        <div className="container">
          <div className="section-header">
            <h2>How VerifiED Works</h2>
            <p>Secure verification through essential credential data</p>
          </div>
          
          <div className="row">
            <div className="col-lg-8 mx-auto">
              {[
                {
                  number: 1,
                  title: "Digital Credentialing",
                  description: "Institutions record essential credential metadata and cryptographically sign it, ensuring authenticity without requiring complete document uploads.",
                  icon: "fas fa-signature"
                },
                {
                  number: 2,
                  title: "Blockchain Anchoring",
                  description: "Credential data is hashed and anchored to the blockchain via smart contracts, creating an immutable, tamper-proof record without storing sensitive details.",
                  icon: "fas fa-link"
                },
                {
                  number: 3,
                  title: "Self-Sovereign Access",
                  description: "Students access and manage their verified credentials through a decentralized identity portal, maintaining full control over their personal data.",
                  icon: "fas fa-user-shield"
                },
                {
                  number: 4,
                  title: "Selective Disclosure",
                  description: "Students generate secure sharing links that reveal only necessary credential metadata to verifiers, protecting privacy while enabling verification.",
                  icon: "fas fa-filter"
                },
                {
                  number: 5,
                  title: "Instant Verification",
                  description: "Employers verify credentials instantly by checking the blockchain record, eliminating fraudulent credentials without complex verification processes.",
                  icon: "fas fa-check-circle"
                }
              ].map((step, index) => (
                <div key={index} className="step-card">
                  <div className="d-flex">
                    <div className="step-number">
                      {step.number}
                    </div>
                    <div className="p-3 flex-grow-1">
                      <h3>{step.title}</h3>
                      <p className="mb-0 text-muted">{step.description}</p>
                    </div>
                    <div className="p-3 d-flex align-items-center">
                      <i className={`${step.icon} fa-2x text-primary`}></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Verifier Section */}
      <section id="verifier" className="py-5 bg-white">
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
                      placeholder="Enter shared link or scan QR code" 
                    />
                    <button 
                      className="btn btn-primary-custom"
                      onClick={() => setShowVerificationResult(true)}
                    >
                      Verify
                    </button>
                    <button className="btn btn-outline-primary ms-2">
                      <i className="fas fa-qrcode"></i>
                    </button>
                  </div>
                  
                  {showVerificationResult && (
                    <div className="verification-result-box">
                      <div className="d-flex align-items-center mb-3">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        <span className="fw-bold text-success">Verified</span>
                      </div>
                      <div>
                        <div className="d-flex justify-content-between py-2 border-bottom">
                          <span className="fw-bold">Type:</span>
                          <span>Bachelor's Degree</span>
                        </div>
                        <div className="d-flex justify-content-between py-2 border-bottom">
                          <span className="fw-bold">Issuer:</span>
                          <span>Western Mindanao State University</span>
                        </div>
                        <div className="d-flex justify-content-between py-2">
                          <span className="fw-bold">Issue Date:</span>
                          <span>May 15, 2024</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="col-lg-6">
              <h3>Verifier Benefits</h3>
              <ul className="list-unstyled">
                {[
                  "Instant verification without calls or emails",
                  "Tamper-proof credential validation",
                  "Reduced hiring risks and compliance concerns",
                  "API integration with existing HR systems",
                  "Audit trail for compliance purposes"
                ].map((benefit, index) => (
                  <li key={index} className="d-flex align-items-center mb-3">
                    <i className="fas fa-check text-success me-3"></i>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Credentials Section */}
      <section id="samples" className="py-5" style={{backgroundColor: 'var(--background-light)'}}>
        <div className="container">
          <div className="section-header">
            <h2>Sample Credentials</h2>
            <p>Examples of verified credentials on our platform</p>
          </div>
          
          <div className="row g-4">
            {[
              {
                logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'%3E%3Ccircle fill='%234050b5' cx='30' cy='30' r='30'/%3E%3Ctext x='30' y='38' text-anchor='middle' fill='white' font-family='Arial' font-size='20' font-weight='bold'%3EM%3C/text%3E%3C/svg%3E",
                title: "Bachelor of Science",
                subtitle: "Computer Science",
                recipient: "John Smith",
                issuer: "MIT",
                date: "June 10, 2024"
              },
              {
                logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'%3E%3Ccircle fill='%23dc3545' cx='30' cy='30' r='30'/%3E%3Ctext x='30' y='38' text-anchor='middle' fill='white' font-family='Arial' font-size='20' font-weight='bold'%3EH%3C/text%3E%3C/svg%3E",
                title: "Master of Business Administration",
                subtitle: "Finance Specialization",
                recipient: "Sarah Johnson",
                issuer: "Harvard Business School",
                date: "May 20, 2024"
              },
              {
                logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'%3E%3Ccircle fill='%23ffc107' cx='30' cy='30' r='30'/%3E%3Ctext x='30' y='38' text-anchor='middle' fill='white' font-family='Arial' font-size='20' font-weight='bold'%3EB%3C/text%3E%3C/svg%3E",
                title: "Professional Certification",
                subtitle: "Blockchain Development",
                recipient: "David Chen",
                issuer: "Blockchain Academy",
                date: "March 5, 2024"
              }
            ].map((credential, index) => (
              <div key={index} className="col-md-4">
                <div className="credential-card">
                  <div className="d-flex align-items-center p-3 border-bottom">
                    <img 
                      src={credential.logo} 
                      alt="University logo" 
                      className="rounded-circle me-3" 
                      style={{width: '60px', height: '60px'}} 
                    />
                    <div>
                      <h4 className="mb-1">{credential.title}</h4>
                      <p className="mb-0 text-muted small">{credential.subtitle}</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="d-flex mb-2">
                      <span className="fw-bold me-2" style={{minWidth: '80px'}}>Recipient:</span>
                      <span>{credential.recipient}</span>
                    </div>
                    <div className="d-flex mb-2">
                      <span className="fw-bold me-2" style={{minWidth: '80px'}}>Issuer:</span>
                      <span>{credential.issuer}</span>
                    </div>
                    <div className="d-flex mb-3">
                      <span className="fw-bold me-2" style={{minWidth: '80px'}}>Date:</span>
                      <span>{credential.date}</span>
                    </div>
                    <div className="verification-status d-flex align-items-center">
                      <i className="fas fa-shield-check me-2"></i>
                      <span>Blockchain Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-5 bg-white">
        <div className="container">
          <div className="section-header">
            <h2>Use Cases</h2>
            <p>How VerifiED helps different stakeholders</p>
          </div>
          
          <div className="row g-4">
            {[
              {
                icon: "fas fa-university",
                title: "Academic Institutions",
                description: "Issue tamper-proof digital credentials that reduce administrative burden and enhance institutional reputation."
              },
              {
                icon: "fas fa-user-graduate",
                title: "Students & Graduates",
                description: "Manage and share verified credentials securely while maintaining control over personal data."
              },
              {
                icon: "fas fa-building",
                title: "Employers",
                description: "Instantly verify applicant credentials, reducing hiring risks and streamlining recruitment processes."
              },
              {
                icon: "fas fa-globe",
                title: "Global Mobility",
                description: "Facilitate international credential recognition for students seeking education or employment abroad."
              }
            ].map((useCase, index) => (
              <div key={index} className="col-md-6 col-lg-3">
                <div className="use-case-card">
                  <div className="use-case-icon">
                    <i className={useCase.icon}></i>
                  </div>
                  <h3>{useCase.title}</h3>
                  <p>{useCase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="cta-section">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <h2>Ready to Transform Credential Verification?</h2>
              <p>Join the growing network of institutions and companies using VerifiED.</p>
              <div className="d-flex justify-content-center gap-3">
                <a href="#contact" className="btn btn-light btn-lg">Contact Us</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-5" style={{backgroundColor: 'var(--background-light)'}}>
        <div className="container">
          <div className="section-header">
            <h2>Contact Us</h2>
            <p>Get in touch with our team</p>
          </div>
          
          <div className="row">
            <div className="col-lg-6 mb-4">
              <form onSubmit={handleContactSubmit} className="bg-white p-4 rounded shadow-sm">
                <div className="mb-3">
                  <input type="text" className="form-control" placeholder="Name" required />
                </div>
                <div className="mb-3">
                  <input type="email" className="form-control" placeholder="Email" required />
                </div>
                <div className="mb-3">
                  <select className="form-select" defaultValue="" required>
                    <option value="" disabled>I am a...</option>
                    <option value="institution">Academic Institution</option>
                    <option value="employer">Employer/Verifier</option>
                    <option value="student">Student/Graduate</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="mb-3">
                  <textarea className="form-control" placeholder="Message" rows="5" required></textarea>
                </div>
                <button type="submit" className="btn btn-primary-custom w-100">Send Message</button>
              </form>
            </div>
            
            <div className="col-lg-6">
              <div className="h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center mb-4">
                    <i className="fas fa-envelope fa-2x text-primary me-3"></i>
                    <p className="mb-0">verified@gmail.com</p>
                  </div>
                  <div className="d-flex align-items-center mb-4">
                    <i className="fas fa-phone fa-2x text-primary me-3"></i>
                    <p className="mb-0">+63 (956) 230-7646</p>
                  </div>
                  <div className="d-flex align-items-center mb-4">
                    <i className="fas fa-map-marker-alt fa-2x text-primary me-3"></i>
                    <p className="mb-0">Western Mindanao State University</p>
                  </div>
                </div>
                
                <div>
                  <a href="#" className="social-link">
                    <i className="fas fa-envelope"></i>
                  </a>
                  <a href="#" className="social-link">
                    <i className="fab fa-facebook"></i>
                  </a>
                  <a href="#" className="social-link">
                    <i className="fab fa-github"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-custom">
        <div className="container">
          <div className="row mb-4">
            <div className="col-lg-4 mb-4">
              <h2>Verifi<span>ED</span></h2>
              <p className="opacity-75">Blockchain-based credential verification</p>
            </div>
            
            <div className="col-lg-8">
              <div className="row">
                <div className="col-md-4">
                  <h5 className="text-primary mb-3">Platform</h5>
                  <ul className="list-unstyled">
                    <li><a href="#" className="footer-link">For Institutions</a></li>
                    <li><a href="#" className="footer-link">For Students</a></li>
                    <li><a href="#" className="footer-link">For Employers</a></li>
                    <li><a href="#" className="footer-link">API Documentation</a></li>
                  </ul>
                </div>
                <div className="col-md-4">
                  <h5 className="text-primary mb-3">Resources</h5>
                  <ul className="list-unstyled">
                    <li><a href="#" className="footer-link">Documentation</a></li>
                    <li><a href="#" className="footer-link">Blog</a></li>
                    <li><a href="#" className="footer-link">Case Studies</a></li>
                    <li><a href="#" className="footer-link">FAQs</a></li>
                  </ul>
                </div>
                <div className="col-md-4">
                  <h5 className="text-primary mb-3">Company</h5>
                  <ul className="list-unstyled">
                    <li><a href="#" className="footer-link">About Us</a></li>
                    <li><a href="#" className="footer-link">Careers</a></li>
                    <li><a href="#" className="footer-link">Press</a></li>
                    <li><a href="#" className="footer-link">Contact</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-top pt-4">
            <div className="row align-items-center">
              <div className="col-md-6">
                <p className="mb-0 opacity-75">&copy; 2025 VerifiED. All rights reserved.</p>
              </div>
              <div className="col-md-6 text-md-end">
                <a href="#" className="footer-link me-3">Privacy Policy</a>
                <a href="#" className="footer-link">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowLoginModal(false)}>
          <div className="modal-content-custom">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3>Login to VerifiED</h3>
              <button 
                className="btn-close" 
                onClick={() => setShowLoginModal(false)}
                aria-label="Close"
              ></button>
            </div>
            
            <form onSubmit={handleLoginSubmit}>
              <div className="mb-3">
                <input name="username" type="text" className="form-control" placeholder="Username/Email" required />
              </div>
              <div className="mb-3">
                <input name="password" type="password" className="form-control" placeholder="Password" required />
              </div>
              <div className="mb-3">
                <select name="userType" className="form-select" defaultValue="" required>
                  <option value="" disabled>Select User Type</option>
                  <option value="institution">Academic Institution</option>
                  <option value="student">Student/Graduate</option>
                  <option value="employer">Employer/Verifier</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary-custom w-100 mb-3">Login</button>
              <div className="text-center">
                <a href="#" className="text-decoration-none">Forgot Password?</a>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;