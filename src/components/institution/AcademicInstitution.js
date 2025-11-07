// fileName: AcademicInstitution.js

import React, { useState, useEffect } from 'react';

import {
  fetchCredentialTypes,
  fetchIssuedCredentials,
  fetchCredentialStats,
  fetchInstitutionName,
  getInstitutionPublicAddress,
  updateInstitutionPublicAddress,
  fetchStudents,
  fetchDashboardStats,
  fetchInstitutionProfile,
  updateInstitutionProfile,
  deleteCredential,
  fetchMaticPrice
} from '../../services/institutionApiService';
import { logCredentialDeleted } from '../../services/activityLogService';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AcademicInstitution.css';
import StudentManagement from './StudentManagement';
import IssueCredentialModal from './IssueCredentialModal';
import BulkImportStudentsModal from './BulkImportStudentsModal';
import IssuedCredentialsTable from './IssuedCredentialsTable';
import InstitutionSettings from './InstitutionSettings';
import ErrorModal from '../common/ErrorModal';
import PublicAddressCheck from './PublicAddressCheck';
import PublicAddressModal from './PublicAddressModal';
import DashboardAnalytics from './DashboardAnalytics';
import TransactionHistoryTable from './TransactionHistoryTable';

function AcademicInstitution() {
  const [account, setAccount] = useState(null);
  const [institutionName, setInstitutionName] = useState('');
  const [institutionId, setInstitutionId] = useState(null);
  const [dbPublicAddress, setDbPublicAddress] = useState(null);
  const [walletMatches, setWalletMatches] = useState(false);

  const [credentialTypes, setCredentialTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [issuedCredentials, setIssuedCredentials] = useState([]);
  const [credentialStats, setCredentialStats] = useState({ total_credentials: 0, new_credentials_week: 0 });
  const [dashboardStats, setDashboardStats] = useState({ total_students: 0, total_credentials: 0, daily_verifications: 0 });
  const [maticPrice, setMaticPrice] = useState({ priceUSD: null, pricePHP: null, change24h: 0, volume24h: 0, lastUpdated: null });
  const [maticPriceLoading, setMaticPriceLoading] = useState(true);
  const [institutionProfile, setInstitutionProfile] = useState({ institution_name: '', username: '', email: '' });
  const [showModal, setShowModal] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Bulk import modal visibility (modal owns its internal state/logic)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  // Modal now owns its own internal state

  // Section navigation (like MyVerifiED): controls which content shows below the stats
  const [activeSection, setActiveSection] = useState('dashboard'); // 'dashboard' | 'issued' | 'students' | 'transactions'
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

    // Listen for MetaMask account changes
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        setAccount(null);
      }
    };

    // Listen for MetaMask network changes
    const handleChainChanged = (chainId) => {
      console.log('MetaMask network changed to:', chainId);
      // Optionally reload the page or refresh data when network changes
      // window.location.reload();
    };

    // Add event listeners for MetaMask changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    const loadData = async () => {
      try {
        // Get logged-in user info
        const loggedInUserId = localStorage.getItem('userId');
        const userType = localStorage.getItem('userType');
        
        if (!loggedInUserId) {
          setErrorMessage('Please log in again');
          setShowErrorPopup(true);
          return;
        }

        // Determine institution ID based on account type
        let actualInstitutionId;
        let publicAddress;
        
        if (userType === 'institution_staff') {
          // For staff, use the stored institution_id and public_address from login
          actualInstitutionId = parseInt(localStorage.getItem('institutionId'));
          publicAddress = localStorage.getItem('publicAddress');
        } else {
          // For regular institutions, userId IS the institution ID
          actualInstitutionId = parseInt(loggedInUserId);
          // Fetch public address from database
          const addressData = await getInstitutionPublicAddress(loggedInUserId);
          publicAddress = addressData.public_address;
        }

        setInstitutionId(actualInstitutionId);
        setDbPublicAddress(publicAddress);

        // Fetch institution name using the actual institution ID
        const institutionData = await fetchInstitutionName(actualInstitutionId);
        setInstitutionName(institutionData.institution_name);

        // Load institution-specific data using the actual institution ID
        const [types, studentData, credentials, stats, dashStats, profile] = await Promise.all([
          fetchCredentialTypes(),
          fetchStudents(actualInstitutionId),
          fetchIssuedCredentials(actualInstitutionId),
          fetchCredentialStats(actualInstitutionId),
          fetchDashboardStats(actualInstitutionId),
          fetchInstitutionProfile(actualInstitutionId)
        ]);
        
        setCredentialTypes(types);
        setStudents(studentData);
        setIssuedCredentials(credentials);
        setCredentialStats(stats);
        setDashboardStats(dashStats);
        setInstitutionProfile(profile);
      } catch (error) {
        console.error('Data loading failed:', error);
        setErrorMessage('Failed to load institution data. Please refresh the page.');
        setShowErrorPopup(true);
      }
    };

    getAccount();
    loadData();
    loadMaticPrice();

    // Auto-refresh POL price every 5 minutes for real-time data
    const priceInterval = setInterval(() => {
      loadMaticPrice();
    }, 300000); // 5 minutes

    // Cleanup event listeners on component unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
      clearInterval(priceInterval); // Clear price refresh interval
    };
  }, []);

  // Check if MetaMask account matches database address whenever either changes
  useEffect(() => {
    if (account && dbPublicAddress) {
      setWalletMatches(account.toLowerCase() === dbPublicAddress.toLowerCase());
    } else {
      setWalletMatches(false);
    }
  }, [account, dbPublicAddress]);

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

  // Students refresher for after successful bulk import or adding individual students
  const refreshStudentsData = async () => {
    if (!institutionId) return;
    try {
      const [studentData, dashStats] = await Promise.all([
        fetchStudents(institutionId),
        fetchDashboardStats(institutionId)
      ]);
      setStudents(studentData);
      setDashboardStats(dashStats);
    } catch (err) {
      console.error('Failed to refresh students:', err);
    }
  };

  const handleViewCredential = (ipfsCid) => {
    const ipfsUrl = `https://amethyst-tropical-jackal-879.mypinata.cloud/ipfs/${ipfsCid}`;
    window.open(ipfsUrl, '_blank');
  };

  // Fetch POL (Polygon) price via backend API from CoinGecko
  const loadMaticPrice = async () => {
    try {
      setMaticPriceLoading(true);
      const data = await fetchMaticPrice();
      if (data.success && data.priceUSD && data.pricePHP) {
        setMaticPrice({
          priceUSD: data.priceUSD,
          pricePHP: data.pricePHP,
          change24h: data.change24h,
          volume24h: data.volume24h || 0,
          lastUpdated: data.lastUpdated || Date.now()
        });
      } else {
        setMaticPrice({ priceUSD: null, pricePHP: null, change24h: 0, volume24h: 0, lastUpdated: null });
      }
    } catch (error) {
      console.error('Failed to fetch POL price:', error);
      setMaticPrice({ priceUSD: null, pricePHP: null, change24h: 0, volume24h: 0, lastUpdated: null });
    } finally {
      setMaticPriceLoading(false);
    }
  };

  const handleDeleteCredential = async (credentialId) => {
    try {
      // Find credential info before deleting for activity log
      const credential = issuedCredentials.find(c => c.id === credentialId);
      
      await deleteCredential(credentialId);
      
      // Log the activity
      if (credential) {
        const userId = localStorage.getItem('userId');
        await logCredentialDeleted(institutionId, userId, credential.credential_type);
      }
      
      // Refresh issued credentials and stats after deletion
      await refreshIssuedData();
    } catch (error) {
      console.error('Error deleting credential:', error);
      setErrorMessage('Failed to delete credential. Please try again.');
      setShowErrorPopup(true);
    }
  };

  const handleAddressUpdated = (newAddress) => {
    setDbPublicAddress(newAddress);
    setShowSettingsModal(false);
  };


  // Student management view is toggled via stat card click

  // Always show header + stats, change only the section content below
  return (
    <PublicAddressCheck
      institutionId={institutionId}
      dbPublicAddress={dbPublicAddress}
      onAddressUpdated={handleAddressUpdated}
    >
      <div className="ai-page academic-institution-page" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#ffffff', minHeight: '100vh', paddingTop: '80px' }}>

        {/* Header Section */}
        <div className="dashboard-header">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-8">
                <h1 className="dashboard-title">
                  <i className="fas fa-university me-3"></i>
                  {institutionName ? `${institutionName}` : 'Academic Institution Dashboard'}
                </h1>
                <p className="dashboard-subtitle">Issue and manage blockchain-verified academic credentials</p>
              </div>
              <div className="col-lg-4">
                <div className="header-actions">
                  {/* Settings Icon */}
                  <button 
                    className="settings-btn"
                    onClick={() => setShowSettingsModal(true)}
                    title="Settings"
                  >
                    <i className="fas fa-cog"></i>
                  </button>
                  
                  {/* Wallet Status */}
                  {dbPublicAddress && (
                    <div className="wallet-info">
                      <div className="wallet-label">Wallet Status</div>
                      <div className="wallet-status">
                        {account ? (
                          walletMatches ? (
                            <span className="status-match">
                              <i className="fas fa-check-circle me-1"></i>
                              MetaMask Connected & Verified
                            </span>
                          ) : (
                            <span className="status-mismatch">
                              <i className="fas fa-exclamation-triangle me-1"></i>
                              MetaMask Account Mismatch
                            </span>
                          )
                        ) : (
                          <span className="status-disconnected">
                            <i className="fas fa-times-circle me-1"></i>
                            MetaMask Not Connected
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Stats removed per request to simplify and maximize content width */}

        {/* Section Tabs */}
        <div className="section-tabs" role="tablist" aria-label="Section navigation">
          <button
            className={`tab ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveSection('dashboard')}
            role="tab"
            aria-selected={activeSection === 'dashboard'}
          >
            Dashboard
          </button>
          <button
            className={`tab ${activeSection === 'issued' ? 'active' : ''}`}
            onClick={() => setActiveSection('issued')}
            role="tab"
            aria-selected={activeSection === 'issued'}
          >
            Credentials
          </button>
          <button
            className={`tab ${activeSection === 'students' ? 'active' : ''}`}
            onClick={() => setActiveSection('students')}
            role="tab"
            aria-selected={activeSection === 'students'}
          >
            Students
          </button>
          <button
            className={`tab ${activeSection === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveSection('transactions')}
            role="tab"
            aria-selected={activeSection === 'transactions'}
          >
            Transactions
          </button>
          {localStorage.getItem('userType') === 'institution' && (
            <button
              className={`tab ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveSection('settings')}
              role="tab"
              aria-selected={activeSection === 'settings'}
            >
              Settings
            </button>
          )}
        </div>

        {/* Section Container - content below changes */}
        {activeSection === 'dashboard' && (
          <div className="dashboard-stats-section">
            {/* Basic Stats Row */}
            <div className="row mb-4">
              <div className="col-md-4">
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="stat-content">
                    <h3>{dashboardStats.total_students}</h3>
                    <p>Total Students</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-certificate"></i>
                  </div>
                  <div className="stat-content">
                    <h3>{dashboardStats.total_credentials}</h3>
                    <p>Issued Credentials</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="stat-card">
                  <div className="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38.4 33.5" width="35" height="35">
                      <g fill="#8247e5">
                        <path d="M29,10.2c-0.7-0.4-1.6-0.4-2.4,0L21,13.5l-3.8,2.1l-5.5,3.3c-0.7,0.4-1.6,0.4-2.4,0L5,16.3c-0.7-0.4-1.2-1.2-1.2-2.1v-5c0-0.8,0.4-1.6,1.2-2.1l4.3-2.5c0.7-0.4,1.6-0.4,2.4,0L16,7.2c0.7,0.4,1.2,1.2,1.2,2.1v3.3l3.8-2.2V7c0-0.8-0.4-1.6-1.2-2.1l-8-4.7c-0.7-0.4-1.6-0.4-2.4,0L1.2,5C0.4,5.4,0,6.2,0,7v9.4c0,0.8,0.4,1.6,1.2,2.1l8.1,4.7c0.7,0.4,1.6,0.4,2.4,0l5.5-3.2l3.8-2.2l5.5-3.2c0.7-0.4,1.6-0.4,2.4,0l4.3,2.5c0.7,0.4,1.2,1.2,1.2,2.1v5c0,0.8-0.4,1.6-1.2,2.1L29,28.8c-0.7,0.4-1.6,0.4-2.4,0l-4.3-2.5c-0.7-0.4-1.2-1.2-1.2-2.1V21l-3.8,2.2v3.3c0,0.8,0.4,1.6,1.2,2.1l8.1,4.7c0.7,0.4,1.6,0.4,2.4,0l8.1-4.7c0.7-0.4,1.2-1.2,1.2-2.1V17c0-0.8-0.4-1.6-1.2-2.1L29,10.2z"/>
                      </g>
                    </svg>
                  </div>
                  <div className="stat-content">
                    {maticPriceLoading ? (
                      <>
                        <h3><span style={{ fontSize: '20px', color: '#7f8c8d' }}>Loading...</span></h3>
                        <p>POL (Polygon)</p>
                      </>
                    ) : maticPrice.priceUSD ? (
                      <>
                        <h3 style={{ margin: 0 }}>${maticPrice.priceUSD.toFixed(4)}</h3>
                        <p style={{ fontSize: '13px', color: '#95a5a6', margin: '0 0 5px 0' }}>
                          ₱{maticPrice.pricePHP.toFixed(2)} PHP
                        </p>
                        <p style={{ 
                          fontSize: '12px', 
                          margin: 0,
                          color: maticPrice.change24h >= 0 ? '#27ae60' : '#e74c3c',
                          fontWeight: '600'
                        }}>
                          <i className={`fas fa-arrow-${maticPrice.change24h >= 0 ? 'up' : 'down'}`}></i>
                          {' '}{Math.abs(maticPrice.change24h).toFixed(2)}% (24h)
                        </p>
                      </>
                    ) : (
                      <>
                        <h3><span style={{ fontSize: '20px', color: '#e74c3c' }}>N/A</span></h3>
                        <p>POL (Polygon)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Analytics Section */}
            <DashboardAnalytics institutionId={institutionId} />
          </div>
        )}

        {activeSection === 'issued' && (
          <IssuedCredentialsTable
            credentials={issuedCredentials}
            onView={handleViewCredential}
            onDelete={handleDeleteCredential}
            onIssueCredential={() => setShowModal(true)}
          />
        )}

        {activeSection === 'students' && (
          <StudentManagement 
            institutionId={institutionId}
            onOpenBulkImport={() => setShowBulkImportModal(true)}
            refreshTrigger={studentsRefreshTick}
            onStudentListChanged={refreshStudentsData}
          />
        )}

        {activeSection === 'transactions' && (
          <TransactionHistoryTable institutionId={institutionId} />
        )}

        {activeSection === 'settings' && (
          <InstitutionSettings 
            institutionId={institutionId}
            profile={institutionProfile}
            onProfileUpdate={(updatedProfile) => {
              setInstitutionProfile(updatedProfile);
              setInstitutionName(updatedProfile.institution_name);
            }}
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
          account={account}
          dbPublicAddress={dbPublicAddress}
          walletMatches={walletMatches}
          institutionId={institutionId}
        />
      )}

      <BulkImportStudentsModal
        show={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        institutionId={institutionId}
        onImported={async () => { await refreshStudentsData(); setStudentsRefreshTick((v) => v + 1); }}
      />

      {/* Settings Modal */}
      <PublicAddressModal
        show={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        institutionId={institutionId}
        currentAddress={dbPublicAddress}
        onAddressUpdated={handleAddressUpdated}
      />
    </div>
    </PublicAddressCheck>
  );
}

export default AcademicInstitution;

