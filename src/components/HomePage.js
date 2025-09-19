import React, { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Navigation.css';
import './HomePage.css';
import VerifierSection from './VerifierSection';

function HomePage() {

  useEffect(() => {
    // Smooth scrolling for anchor links
    const handleSmoothScroll = (e) => {
      const href = e.target.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  return (
    <div className="homepage-container">
      {/* FontAwesome CDN */}
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
      />

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
                  description: "Students access and manage their verified credentials through a decentralized identity portal.",
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
      <VerifierSection />

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

    </div>
  );
}

export default HomePage;