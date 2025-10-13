// fileName: systemSettingsService.js
// Service for managing system settings

const connection = require('../config/database');

class SystemSettingsService {
  
  // Get a specific setting by key
  static async getSetting(key) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT setting_value FROM system_settings WHERE setting_key = ?';
      connection.query(query, [key], (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results.length > 0 ? results[0].setting_value : null);
      });
    });
  }
  
  // Get all settings
  static async getAllSettings() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT setting_key, setting_value, setting_description FROM system_settings ORDER BY setting_key';
      connection.query(query, (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results);
      });
    });
  }
  
  // Update a setting
  static async updateSetting(key, value) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO system_settings (setting_key, setting_value) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE 
        setting_value = VALUES(setting_value), 
        updated_at = NOW()
      `;
      connection.query(query, [key, value], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
  }
  
  // Update multiple settings at once
  static async updateMultipleSettings(settings) {
    return new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);
        
        const promises = Object.entries(settings).map(([key, value]) => {
          return new Promise((resolveUpdate, rejectUpdate) => {
            const query = `
              INSERT INTO system_settings (setting_key, setting_value) 
              VALUES (?, ?) 
              ON DUPLICATE KEY UPDATE 
              setting_value = VALUES(setting_value), 
              updated_at = NOW()
            `;
            connection.query(query, [key, value], (updateErr, result) => {
              if (updateErr) {
                return rejectUpdate(updateErr);
              }
              resolveUpdate(result);
            });
          });
        });
        
        Promise.all(promises)
          .then((results) => {
            connection.commit((commitErr) => {
              if (commitErr) {
                return connection.rollback(() => reject(commitErr));
              }
              resolve(results);
            });
          })
          .catch((updateErr) => {
            connection.rollback(() => reject(updateErr));
          });
      });
    });
  }
  
  // Generate Gmail compose URL for replying to a contact message
  static async generateGmailReplyUrl(contactMessage) {
    try {
      const replyEmail = await this.getSetting('reply_email') || 'gerby.hallasgo@gmail.com';
      const systemName = await this.getSetting('system_name') || 'VerifiED Support Team';
      const signature = await this.getSetting('reply_signature') || 'Best regards,\nVerifiED Support Team';
      
      const subject = `Re: Your message to VerifiED`;
      const body = `Dear ${contactMessage.name},

Thank you for contacting VerifiED.

Regarding your message:
"${contactMessage.message}"

[Please write your response here]

${signature}`;
      
      // Encode for URL
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);
      const encodedTo = encodeURIComponent(contactMessage.email);
      const encodedFrom = encodeURIComponent(replyEmail);
      
      // Gmail compose URL
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}&from=${encodedFrom}`;
      
      return gmailUrl;
    } catch (error) {
      console.error('Error generating Gmail URL:', error);
      // Fallback URL
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactMessage.email)}&su=${encodeURIComponent('Re: Your message to VerifiED')}`;
    }
  }
}

module.exports = SystemSettingsService;
