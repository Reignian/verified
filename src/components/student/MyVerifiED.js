import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './MyVerifiED.css';
import { fetchStudentName, fetchStudentCredentialCount, fetchStudentCredentials, fetchStudentAccessCodes, fetchStudentMultiAccessCodes } from '../../services/studentApiService';
import CredentialsSection from './CredentialsSection';
import AccessCodesSection from './AccessCodesSection';
import StudentAccountSettingsSection from './StudentAccountSettingsSection';

function MyVerifiED() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [credentialCount, setCredentialCount] = useState(0);
  const [totalAccessCodes, setTotalAccessCodes] = useState(0);
  const [singleAccessCodesCount, setSingleAccessCodesCount] = useState(0);
  const [multiAccessCodesCount, setMultiAccessCodesCount] = useState(0);
  const [activeSection, setActiveSection] = useState('credentials');
  const [generatingId, setGeneratingId] = useState(null);

  // Calculate total access codes from all credentials (non-deleted only)
  const calculateTotalAccessCodes = (credentialsData) => {
    return credentialsData.reduce((total, c) => {
      if (typeof c.access_codes_non_deleted === 'number') {
        return total + c.access_codes_non_deleted;
      }
      return total + (Array.isArray(c.codes) ? c.codes.length : 0);
    }, 0);
  };

  // Expose loader so children can trigger a refetch (e.g., after delete)
  const loadStudentData = async () => {
    try {
      // Get user info from localStorage
      const userId = localStorage.getItem('userId');
      const userType = localStorage.getItem('userType');
      
      if (!userId || userType !== 'student') {
        setLoading(false);
        return;
      }

      // Fetch student data, credential count, credentials, and access codes
      const [studentData, credentialData, credentialsData, singleAccessCodes, multiAccessCodes] = await Promise.all([
        fetchStudentName(userId),
        fetchStudentCredentialCount(userId),
        fetchStudentCredentials(userId),
        fetchStudentAccessCodes(userId),
        fetchStudentMultiAccessCodes(userId)
      ]);
      
      setUser({ 
        id: userId, 
        type: userType,
        student_id: studentData.student_id,
        first_name: studentData.first_name,
        middle_name: studentData.middle_name,
        last_name: studentData.last_name,
        email: studentData.email,
        username: studentData.username,
        institution_name: studentData.institution_name,
        program_id: studentData.program_id,
        program_name: studentData.program_name,
        program_code: studentData.program_code
      });
      
      setCredentialCount(credentialData.total_credentials);
      // Transform access_codes (comma-separated string) to an array for UI
      const transformed = (credentialsData || []).map(c => ({
        ...c,
        codes: c.access_codes ? c.access_codes.split(',').filter(Boolean) : []
      }));
      setCredentials(transformed);
      
      // Calculate total access codes (single + multi)
      const singleCount = (singleAccessCodes || []).length;
      const multiCount = (multiAccessCodes || []).length;
      setSingleAccessCodesCount(singleCount);
      setMultiAccessCodesCount(multiCount);
      setTotalAccessCodes(singleCount + multiCount);
      setLoading(false);

    } catch (error) {
      console.error('Error loading student data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  if (loading) {
    return (
      <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f9f9f9', minHeight: '100vh', paddingTop: '80px' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 text-center" style={{ paddingTop: '100px' }}>
              <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h3 className="mt-3" style={{ color: '#4050b5' }}>Loading your credentials...</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f9f9f9', minHeight: '100vh', paddingTop: '80px' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 text-center" style={{ paddingTop: '100px' }}>
              <div className="card shadow-lg border-0" style={{ borderRadius: '12px' }}>
                <div className="card-body p-5">
                  <i className="fas fa-user-lock fa-4x text-warning mb-4"></i>
                  <h2 className="mb-3" style={{ color: '#4050b5' }}>Access Required</h2>
                  <p className="text-muted mb-4">Please log in as a student to view your credentials</p>
                  <button className="btn btn-primary" style={{ backgroundColor: '#4050b5', borderColor: '#4050b5' }}>
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Go to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f9f9f9', minHeight: '100vh', paddingTop: '80px' }}>

      {/* Header Section */}
      <div className="dashboard-header">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="dashboard-title">
                <i className="fas fa-user-graduate me-3"></i>
                My VerifiED Dashboard
              </h1>
              <p className="dashboard-subtitle">
                View and manage your blockchain-verified academic credentials
              </p>
            </div>
            <div className="col-lg-4">
              <div className="user-info">
                <p className="m-0 fw-semibold">{user.first_name} {user.middle_name} {user.last_name}</p>
                <div className="fs-6 opacity-75 mb-1">Student ID: {user.student_id}</div>
                {user.program_name && (
                  <div className="fs-6 opacity-75">
                    <i className="fas fa-graduation-cap me-1"></i>
                    {user.program_name}{user.program_code ? ` (${user.program_code})` : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div id="MyVerifiED" className="main-content">
        {/* Stats Section - Navigation */}
        <div className="stats-grid">
          <div 
            className={`stat-card ${activeSection === 'credentials' ? 'active' : ''}`}
            onClick={() => handleSectionChange('credentials')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-number">
              {credentialCount}
            </div>
            <p className="stat-label">Total Credentials</p>
          </div>
          <div 
            className={`stat-card ${activeSection === 'access-codes' ? 'active' : ''}`}
            onClick={() => handleSectionChange('access-codes')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-number">
              {totalAccessCodes}
            </div>
            <p className="stat-label">Total Access Codes</p>
            <div className="stat-breakdown">
              <small className="text-muted">
                {singleAccessCodesCount} Single • {multiAccessCodesCount} Multi
              </small>
            </div>
          </div>

          <div 
            className={`stat-card ${activeSection === 'account-settings' ? 'active' : ''}`}
            onClick={() => handleSectionChange('account-settings')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-number">
              <i className="fas fa-cog" style={{ fontSize: '1.5rem' }}></i>
            </div>
            <p className="stat-label">Account Settings</p>
          </div>
        </div>

        {/* Dynamic Content Section */}
        {activeSection === 'credentials' && (
          <CredentialsSection
            credentials={credentials}
            setCredentials={setCredentials}
            generatingId={generatingId}
            setGeneratingId={setGeneratingId}
            calculateTotalAccessCodes={calculateTotalAccessCodes}
            setTotalAccessCodes={setTotalAccessCodes}
          />
        )}

        {/* Access Codes Section */}
        {activeSection === 'access-codes' && (
          <AccessCodesSection
            credentials={credentials}
            totalAccessCodes={totalAccessCodes}
            onRefresh={loadStudentData}
          />
        )}

        {/* Account Settings Section */}
        {activeSection === 'account-settings' && (
          <StudentAccountSettingsSection
            user={user}
          />
        )}
        
      </div>
    </div>
  );
}

export default MyVerifiED;