// fileName: AdminDashboard.js

import React, { useState, useEffect } from 'react';
import { fetchSystemStats } from '../services/adminApiService';
import InstitutionManagement from './InstitutionManagement';
import CredentialMonitoring from './CredentialMonitoring';
import VerificationStats from './VerificationStats';
import ContactMessages from './ContactMessages';
import './AdminDashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      setLoading(true);
      const data = await fetchSystemStats();
      setStats(data);
      setError('');
    } catch (error) {
      console.error('Failed to load system stats:', error);
      setError('Failed to load system statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-overview">
            <h2>System Overview</h2>
            {loading ? (
              <div className="text-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : (
              <div className="row g-4">
                <div className="col-md-6 col-lg-4">
                  <div className="stat-card institutions">
                    <div className="stat-icon">
                      <i className="fas fa-university"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{formatNumber(stats?.total_institutions || 0)}</h3>
                      <p>Academic Institutions</p>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6 col-lg-4">
                  <div className="stat-card students">
                    <div className="stat-icon">
                      <i className="fas fa-user-graduate"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{formatNumber(stats?.total_students || 0)}</h3>
                      <p>Students Registered</p>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6 col-lg-4">
                  <div className="stat-card credentials">
                    <div className="stat-icon">
                      <i className="fas fa-certificate"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{formatNumber(stats?.total_credentials || 0)}</h3>
                      <p>Total Credentials</p>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6 col-lg-4">
                  <div className="stat-card verified">
                    <div className="stat-icon">
                      <i className="fas fa-shield-check"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{formatNumber(stats?.verified_credentials || 0)}</h3>
                      <p>Blockchain Verified</p>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6 col-lg-4">
                  <div className="stat-card verifications">
                    <div className="stat-icon">
                      <i className="fas fa-search"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{formatNumber(stats?.total_verifications || 0)}</h3>
                      <p>Total Verifications</p>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6 col-lg-4">
                  <div className="stat-card messages">
                    <div className="stat-icon">
                      <i className="fas fa-envelope"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{formatNumber(stats?.unread_messages || 0)}</h3>
                      <p>Unread Messages</p>
                      {stats?.unread_messages > 0 && (
                        <span className="badge bg-danger">New</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'institutions':
        return <InstitutionManagement onStatsUpdate={loadSystemStats} />;
      
      case 'credentials':
        return <CredentialMonitoring />;
      
      case 'verifications':
        return <VerificationStats />;
      
      case 'messages':
        return <ContactMessages onStatsUpdate={loadSystemStats} />;
      
      default:
        return null;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>
          <i className="fas fa-cogs me-2"></i>
          Admin Dashboard
        </h1>
        <p className="text-muted">Manage institutions, monitor credentials, and handle system operations</p>
      </div>

      <nav className="admin-nav">
        <div className="nav nav-tabs" role="tablist">
          <button
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <i className="fas fa-tachometer-alt me-1"></i>
            Dashboard
          </button>
          
          <button
            className={`nav-link ${activeTab === 'institutions' ? 'active' : ''}`}
            onClick={() => setActiveTab('institutions')}
          >
            <i className="fas fa-university me-1"></i>
            Institutions
          </button>
          
          <button
            className={`nav-link ${activeTab === 'credentials' ? 'active' : ''}`}
            onClick={() => setActiveTab('credentials')}
          >
            <i className="fas fa-certificate me-1"></i>
            Credentials
          </button>
          
          <button
            className={`nav-link ${activeTab === 'verifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('verifications')}
          >
            <i className="fas fa-chart-line me-1"></i>
            Verification Stats
          </button>
          
          <button
            className={`nav-link ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <i className="fas fa-envelope me-1"></i>
            Messages
            {stats?.unread_messages > 0 && (
              <span className="badge bg-danger ms-1">{stats.unread_messages}</span>
            )}
          </button>
        </div>
      </nav>

      <div className="admin-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default AdminDashboard;