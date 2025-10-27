import React, { useState, useEffect } from 'react';
import InstitutionInformation from './InstitutionInformation';
import StaffManagement from './StaffManagement';
import ProgramManagement from './ProgramManagement';
import ActivityLog from './ActivityLog';
import './InstitutionSettings.css';

function InstitutionSettings({ institutionId, profile, onProfileUpdate }) {
  const [isMainAdmin, setIsMainAdmin] = useState(false);
  
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    setIsMainAdmin(userType === 'institution');
  }, []);
  const [activeTab, setActiveTab] = useState('information');

  if (!isMainAdmin) {
    return (
      <div className="institution-settings-container">
        <div className="alert alert-warning" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          You do not have permission to access institution settings. Only the main institution administrator can access this section.
        </div>
      </div>
    );
  }

  return (
    <div className="institution-settings-container">
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'information' ? 'active' : ''}`}
          onClick={() => setActiveTab('information')}
        >
          <i className="fas fa-info-circle me-2"></i>
          Information
        </button>
        <button
          className={`settings-tab ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          <i className="fas fa-users me-2"></i>
          Staff Management
        </button>
        <button
          className={`settings-tab ${activeTab === 'programs' ? 'active' : ''}`}
          onClick={() => setActiveTab('programs')}
        >
          <i className="fas fa-graduation-cap me-2"></i>
          Program Management
        </button>
        <button
          className={`settings-tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <i className="fas fa-history me-2"></i>
          Activity Log
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'information' && (
          <InstitutionInformation
            institutionId={institutionId}
            profile={profile}
            onProfileUpdate={onProfileUpdate}
          />
        )}

        {activeTab === 'staff' && (
          <StaffManagement 
            institutionId={institutionId}
            profile={profile}
          />
        )}

        {activeTab === 'programs' && (
          <ProgramManagement 
            institutionId={institutionId}
            profile={profile}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityLog institutionId={institutionId} />
        )}
      </div>
    </div>
  );
}

export default InstitutionSettings;
