// fileName: SystemSettings.js
// Component for managing system settings like reply email

import React, { useState, useEffect } from 'react';
import { fetchSystemSettings, updateSystemSettings } from '../../services/adminApiService';

function SystemSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchSystemSettings();
      
      // Convert array to object for easier handling
      const settingsObj = {};
      data.forEach(setting => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });
      
      setSettings(settingsObj);
      setError('');
    } catch (error) {
      console.error('Failed to load settings:', error);
      setError('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await updateSystemSettings(settings);
      setSuccess('Settings updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="system-settings">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>System Settings</h2>
          <p className="text-muted">Configure system-wide settings and preferences</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {success}
        </div>
      )}

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="fas fa-envelope me-2"></i>
                Email Reply Settings
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="replyEmail" className="form-label">
                  <strong>Reply Email Address</strong>
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="replyEmail"
                  value={settings.reply_email || ''}
                  onChange={(e) => handleInputChange('reply_email', e.target.value)}
                  placeholder="Enter the email address for replies"
                />
                <div className="form-text">
                  This email will be used as the "from" address when replying to contact messages via Gmail.
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="systemName" className="form-label">
                  <strong>System Name</strong>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="systemName"
                  value={settings.system_name || ''}
                  onChange={(e) => handleInputChange('system_name', e.target.value)}
                  placeholder="Enter the system name for email signatures"
                />
                <div className="form-text">
                  This name will appear in email signatures and replies.
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="replySignature" className="form-label">
                  <strong>Email Signature</strong>
                </label>
                <textarea
                  className="form-control"
                  id="replySignature"
                  rows="4"
                  value={settings.reply_signature || ''}
                  onChange={(e) => handleInputChange('reply_signature', e.target.value)}
                  placeholder="Enter the default signature for email replies"
                />
                <div className="form-text">
                  This signature will be automatically added to email replies.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="fas fa-info-circle me-2"></i>
                How It Works
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <h6><i className="fab fa-google me-2 text-info"></i>Gmail Integration</h6>
                <p className="small text-muted">
                  When you click "Reply via Gmail", it opens Gmail with a pre-filled message using your configured settings.
                </p>
              </div>

              <div className="mb-3">
                <h6><i className="fas fa-envelope me-2 text-primary"></i>Reply Email</h6>
                <p className="small text-muted">
                  Set the email address that will appear as the sender when replying to contact messages.
                </p>
              </div>

              <div className="mb-3">
                <h6><i className="fas fa-signature me-2 text-success"></i>Signature</h6>
                <p className="small text-muted">
                  Customize the signature that appears at the end of your email replies.
                </p>
              </div>

              <div className="alert alert-info">
                <small>
                  <i className="fas fa-lightbulb me-1"></i>
                  <strong>Tip:</strong> Make sure you're logged into the correct Gmail account before using the reply feature.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Saving...
            </>
          ) : (
            <>
              <i className="fas fa-save me-2"></i>
              Save Settings
            </>
          )}
        </button>
        
        <button
          className="btn btn-outline-secondary ms-2"
          onClick={loadSettings}
          disabled={saving}
        >
          <i className="fas fa-undo me-2"></i>
          Reset
        </button>
      </div>
    </div>
  );
}

export default SystemSettings;
