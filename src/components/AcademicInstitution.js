// fileName: AcademicInstitution.js

import React, { useState, useEffect } from 'react';

import {
  fetchCredentialTypes,
  fetchStudents,
  fetchIssuedCredentials,
  fetchCredentialStats,
  fetchInstitutionName
} from '../services/apiService';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AcademicInstitution.css';
import StudentManagement from './StudentManagement';
import IssueCredentialModal from './IssueCredentialModal';
import BulkImportStudentsModal from './BulkImportStudentsModal';
import IssuedCredentialsTable from './IssuedCredentialsTable';
import ErrorModal from './ErrorModal';

function AcademicInstitution() {
  const [account, setAccount] = useState(null);
  const [institutionName, setInstitutionName] = useState('');
  const [institutionId, setInstitutionId] = useState(null);

  const [credentialTypes, setCredentialTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [issuedCredentials, setIssuedCredentials] = useState([]);
  const [credentialStats, setCredentialStats] = useState({ total_credentials: 0, new_credentials_week: 0 });
  const [showModal, setShowModal] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Bulk import modal visibility (modal owns its internal state/logic)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  // Modal now owns its own internal state

  // Section navigation (like MyVerifiED): controls which content shows below the stats
  const [activeSection, setActiveSection] = useState('issued'); // 'issued' | 'students'
  // Trigger for refreshing student management data after bulk import
  const [studentsRefreshTick, setStudentsRefreshTick] = useState(0);

  useEffect(() => {
    const getAccount = async () => {
      if (window.ethereum) {
        try {
          let accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length === 0) {
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          }
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (error) {
          console.error('MetaMask connection failed:', error);
        }
      }
    };

    const loadData = async () => {
      try {
        // Get logged-in user info
        const loggedInUserId = localStorage.getItem('userId');
        
        if (!loggedInUserId) {
          setErrorMessage('Please log in again');
          setShowErrorPopup(true);
          return;
        }

        // Set institution ID from logged-in user
        setInstitutionId(parseInt(loggedInUserId));

        // Fetch institution name
        const institutionData = await fetchInstitutionName(loggedInUserId);
        setInstitutionName(institutionData.institution_name);

        // Load institution-specific data
        const [types, studentData, credentials, stats] = await Promise.all([
          fetchCredentialTypes(),
          fetchStudents(loggedInUserId), // Pass institution ID
          fetchIssuedCredentials(loggedInUserId), // Pass institution ID
          fetchCredentialStats(loggedInUserId) // Pass institution ID
        ]);
        
        setCredentialTypes(types);
        setStudents(studentData);
        setIssuedCredentials(credentials);
        setCredentialStats(stats);
      } catch (error) {
        console.error('Data loading failed:', error);
        setErrorMessage('Failed to load institution data. Please refresh the page.');
        setShowErrorPopup(true);
      }
    };

    getAccount();
    loadData();
  }, []);

  // Modal now handles submit flow; define a small refresher for after success
  const refreshIssuedData = async () => {
    if (!institutionId) return;
    try {
      const [credentials, stats] = await Promise.all([
        fetchIssuedCredentials(institutionId),
        fetchCredentialStats(institutionId)
      ]);
      setIssuedCredentials(credentials);
      setCredentialStats(stats);
    } catch (err) {
      console.error('Failed to refresh issued data:', err);
    }
  };

  // Students refresher for after successful bulk import
  const refreshStudentsData = async () => {
    if (!institutionId) return;
    try {
      const studentData = await fetchStudents(institutionId);
      setStudents(studentData);
    } catch (err) {
      console.error('Failed to refresh students:', err);
    }
  };

  const handleViewCredential = (ipfsCid) => {
    const ipfsUrl = `https://amethyst-tropical-jackal-879.mypinata.cloud/ipfs/${ipfsCid}`;
    window.open(ipfsUrl, '_blank');
  };


  // Student management view is toggled via stat card click

  // Always show header + stats, change only the section content below
  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f9f9f9', minHeight: '100vh', paddingTop: '80px' }}>

      {/* Header Section */}
      <div className="dashboard-header">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="dashboard-title">
                <i className="fas fa-university me-3"></i>
                {institutionName ? `${institutionName} Dashboard` : 'Academic Institution Dashboard'}
              </h1>
              <p className="dashboard-subtitle">Issue and manage blockchain-verified academic credentials</p>
            </div>
            {account && (
              <div className="col-lg-4">
                <div className="wallet-info">
                  <div className="wallet-label">Connected Wallet</div>
                  <p className="wallet-address">{account}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Stats Section (KPIs only) */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{credentialStats.total_credentials}</div>
            <p className="stat-label">Total Credentials</p>
          </div>
          <div className="stat-card">
            <div className="stat-number">{students.length}</div>
            <p className="stat-label">Registered Students</p>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              <i className="fas fa-shield-alt text-success"></i>
            </div>
            <p className="stat-label">Blockchain Secured</p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="section-tabs" role="tablist" aria-label="Section navigation">
          <button
            className={`tab ${activeSection === 'issued' ? 'active' : ''}`}
            onClick={() => setActiveSection('issued')}
            role="tab"
            aria-selected={activeSection === 'issued'}
          >
            Issued Credentials
          </button>
          <button
            className={`tab ${activeSection === 'students' ? 'active' : ''}`}
            onClick={() => setActiveSection('students')}
            role="tab"
            aria-selected={activeSection === 'students'}
          >
            Students
          </button>
        </div>

        {/* Section Container - content below changes */}
        {activeSection === 'issued' && (
          <>
            <div className="button-group">
              <button className="btn btn-primary-custom" onClick={() => setShowModal(true)}>
                <i className="fas fa-plus-circle me-2"></i>
                Issue Credential
              </button>
            </div>
            <IssuedCredentialsTable
              credentials={issuedCredentials}
              onView={handleViewCredential}
            />
          </>
        )}

        {activeSection === 'students' && (
          <StudentManagement 
            institutionId={institutionId}
            onOpenBulkImport={() => setShowBulkImportModal(true)}
            refreshTrigger={studentsRefreshTick}
          />
        )}
      </div>

      {/* Error Modal */}
      <ErrorModal
        show={showErrorPopup}
        message={errorMessage}
        onClose={() => setShowErrorPopup(false)}
      />

      {/* Modals */}
      {activeSection === 'issued' && (
        <IssueCredentialModal
          show={showModal}
          onClose={() => setShowModal(false)}
          credentialTypes={credentialTypes}
          students={students}
          onIssued={refreshIssuedData}
        />
      )}

      <BulkImportStudentsModal
        show={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        institutionId={institutionId}
        onImported={async () => { await refreshStudentsData(); setStudentsRefreshTick((v) => v + 1); }}
      />
    </div>
  );
}

export default AcademicInstitution;

