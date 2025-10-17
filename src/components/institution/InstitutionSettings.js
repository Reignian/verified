import React, { useState } from 'react';
import InstitutionInformation from './InstitutionInformation';
import StaffManagement from './StaffManagement';
import ProgramManagement from './ProgramManagement';
import './InstitutionSettings.css';

function InstitutionSettings({ institutionId, profile, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState('information');

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
          <StaffManagement institutionId={institutionId} />
        )}

        {activeTab === 'programs' && (
          <ProgramManagement institutionId={institutionId} />
        )}
      </div>
    </div>
  );
}

export default InstitutionSettings;
