// fileName: HomePage.js (Updated with working contact form)

import React, { useEffect, useState } from 'react';
import '../common/Navigation.css';
import './HomePage.css';
import VerifierSection from './VerifierSection';
import { submitContactForm } from '../../services/publicApiService';

function HomePage() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    user_type: '',
    message: ''
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactMessageType, setContactMessageType] = useState('');

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

  const handleContactInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactSubmitting(true);
    setContactMessage('');
    
    try {
      const response = await submitContactForm(contactForm);
      setContactMessage(response.message || 'Thank you for your message! We will get back to you soon.');
      setContactMessageType('success');
      
      // Reset form
      setContactForm({
        name: '',
        email: '',
        user_type: '',
        message: ''
      });
    } catch (error) {
      console.error('Contact form submission failed:', error);
      setContactMessage(error.response?.data?.error || 'Failed to submit message. Please try again.');
      setContactMessageType('error');
    } finally {
      setContactSubmitting(false);
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setContactMessage('');
        setContactMessageType('');
      }, 5000);
    }
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
                src="/icon_verify.png" 
                alt="VerifiED - Secure credential verification" 
                className="img-fluid" 
                style={{
                  maxWidth: '400px',
                  height: 'auto',
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none'
                }}
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
                {contactMessage && (
                  <div className={`alert ${contactMessageType === 'success' ? 'alert-success' : 'alert-danger'} mb-3`}>
                    <i className={`fas ${contactMessageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2`}></i>
                    {contactMessage}
                  </div>
                )}
                
                <div className="mb-3">
                  <input 
                    type="text" 
                    className="form-control" 
                    name="name"
                    placeholder="Name" 
                    value={contactForm.name}
                    onChange={handleContactInputChange}
                    required 
                    disabled={contactSubmitting}
                  />
                </div>
                <div className="mb-3">
                  <input 
                    type="email" 
                    className="form-control" 
                    name="email"
                    placeholder="Email" 
                    value={contactForm.email}
                    onChange={handleContactInputChange}
                    required 
                    disabled={contactSubmitting}
                  />
                </div>
                <div className="mb-3">
                  <select 
                    className="form-select" 
                    name="user_type"
                    value={contactForm.user_type}
                    onChange={handleContactInputChange}
                    required
                    disabled={contactSubmitting}
                  >
                    <option value="">I am a...</option>
                    <option value="institution">Academic Institution</option>
                    <option value="employer">Employer/Verifier</option>
                    <option value="student">Student/Graduate</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="mb-3">
                  <textarea 
                    className="form-control" 
                    name="message"
                    placeholder="Message" 
                    rows="5" 
                    value={contactForm.message}
                    onChange={handleContactInputChange}
                    required
                    disabled={contactSubmitting}
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary-custom w-100"
                  disabled={contactSubmitting}
                >
                  {contactSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-2"></i>
                      Send Message
                    </>
                  )}
                </button>
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