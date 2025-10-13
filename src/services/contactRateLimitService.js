// fileName: contactRateLimitService.js
// Service for handling contact form rate limiting and spam protection

const crypto = require('crypto');
const connection = require('../config/database');

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxSubmissionsPerDay: 1,
  blockDurationHours: 24,
  suspiciousThreshold: 3, // Block after 3 attempts in a day
  cleanupIntervalDays: 7  // Clean old records after 7 days
};

class ContactRateLimitService {
  
  // Check if device/IP can submit based on rate limiting rules
  static async checkRateLimit(deviceFingerprint, ipAddress, email) {
    return new Promise((resolve, reject) => {
      const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      
      // Check existing submissions for this device in the last 24 hours
      const checkQuery = `
        SELECT 
          submission_count,
          last_submission,
          blocked_until,
          TIMESTAMPDIFF(HOUR, last_submission, NOW()) as hours_since_last
        FROM contact_submissions 
        WHERE device_fingerprint = ? 
        AND last_submission > ?
      `;
      
      connection.query(checkQuery, [deviceFingerprint, oneDayAgo], (err, results) => {
        if (err) {
          return reject(err);
        }
        
        // If no recent submissions, allow
        if (results.length === 0) {
          return resolve({ allowed: true, reason: 'no_recent_submissions' });
        }
        
        const record = results[0];
        
        // Check if currently blocked
        if (record.blocked_until && new Date(record.blocked_until) > now) {
          const hoursLeft = Math.ceil((new Date(record.blocked_until) - now) / (1000 * 60 * 60));
          return resolve({ 
            allowed: false, 
            reason: 'blocked',
            hoursLeft: hoursLeft,
            message: `Too many submission attempts. Please try again in ${hoursLeft} hours.`
          });
        }
        
        // Check daily limit
        if (record.submission_count >= RATE_LIMIT_CONFIG.maxSubmissionsPerDay) {
          const hoursLeft = Math.max(0, 24 - record.hours_since_last);
          return resolve({ 
            allowed: false, 
            reason: 'daily_limit_exceeded',
            hoursLeft: Math.ceil(hoursLeft),
            message: `You can only send ${RATE_LIMIT_CONFIG.maxSubmissionsPerDay} message per day. Please try again in ${Math.ceil(hoursLeft)} hours.`
          });
        }
        
        // Allow submission
        resolve({ allowed: true, reason: 'within_limits' });
      });
    });
  }
  
  // Record a submission attempt
  static async recordSubmission(deviceFingerprint, ipAddress, email, successful = true) {
    return new Promise((resolve, reject) => {
      const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
      const now = new Date();
      
      // Check if record exists
      const checkQuery = `
        SELECT id, submission_count, last_submission 
        FROM contact_submissions 
        WHERE device_fingerprint = ?
      `;
      
      connection.query(checkQuery, [deviceFingerprint], (err, results) => {
        if (err) {
          return reject(err);
        }
        
        if (results.length === 0) {
          // Create new record
          const insertQuery = `
            INSERT INTO contact_submissions 
            (device_fingerprint, ip_address, email_hash, submission_count, last_submission, created_at)
            VALUES (?, ?, ?, 1, NOW(), NOW())
          `;
          
          connection.query(insertQuery, [deviceFingerprint, ipAddress, emailHash], (insertErr, insertResult) => {
            if (insertErr) {
              return reject(insertErr);
            }
            resolve({ created: true, id: insertResult.insertId });
          });
        } else {
          // Update existing record
          const record = results[0];
          const newCount = record.submission_count + 1;
          
          // Determine if should be blocked
          let blockedUntil = null;
          if (newCount >= RATE_LIMIT_CONFIG.suspiciousThreshold) {
            blockedUntil = new Date(now.getTime() + (RATE_LIMIT_CONFIG.blockDurationHours * 60 * 60 * 1000));
          }
          
          const updateQuery = `
            UPDATE contact_submissions 
            SET submission_count = ?, 
                last_submission = NOW(), 
                ip_address = ?, 
                email_hash = ?,
                blocked_until = ?
            WHERE id = ?
          `;
          
          connection.query(updateQuery, [newCount, ipAddress, emailHash, blockedUntil, record.id], (updateErr) => {
            if (updateErr) {
              return reject(updateErr);
            }
            resolve({ 
              updated: true, 
              id: record.id, 
              newCount: newCount,
              blocked: !!blockedUntil 
            });
          });
        }
      });
    });
  }
  
  // Clean up old records (should be run periodically)
  static async cleanupOldRecords() {
    return new Promise((resolve, reject) => {
      const cleanupDate = new Date();
      cleanupDate.setDate(cleanupDate.getDate() - RATE_LIMIT_CONFIG.cleanupIntervalDays);
      
      const cleanupQuery = `
        DELETE FROM contact_submissions 
        WHERE created_at < ? AND blocked_until IS NULL
      `;
      
      connection.query(cleanupQuery, [cleanupDate], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve({ deletedRecords: result.affectedRows });
      });
    });
  }
  
  // Get submission statistics for monitoring
  static async getSubmissionStats() {
    return new Promise((resolve, reject) => {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_devices,
          COUNT(CASE WHEN blocked_until > NOW() THEN 1 END) as currently_blocked,
          COUNT(CASE WHEN last_submission > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as active_24h,
          AVG(submission_count) as avg_submissions_per_device
        FROM contact_submissions
      `;
      
      connection.query(statsQuery, (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results[0]);
      });
    });
  }
}

module.exports = ContactRateLimitService;
