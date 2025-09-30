// fileName: publicRoutes.js
// Routes for public pages (HomePage - Contact & Verification)

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const verificationQueries = require('../queries/verificationQueries');
const adminQueries = require('../queries/adminQueries');

// POST /api/public/contact - Contact form submission
router.post('/contact', (req, res) => {
  const { name, email, user_type, message } = req.body;
  
  if (!name || !email || !user_type || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  adminQueries.createContactMessage({ name, email, user_type, message }, (err, result) => {
    if (err) {
      console.error('Error creating contact message:', err);
      return res.status(500).json({ error: 'Failed to submit message' });
    }
    
    res.json({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.',
      id: result.insertId
    });
  });
});

// POST /api/public/verify-credential - Verify credential by access code
router.post('/verify-credential', (req, res) => {
  const { accessCode } = req.body;
  
  if (!accessCode) {
    return res.status(400).json({ error: 'Access code is required' });
  }
  
  verificationQueries.getCredentialData(accessCode.trim(), (err, result) => {
    if (err) {
      console.error('Verification error:', err);
      return res.status(500).json({ error: 'Database error occurred' });
    }
    
    if (!result) {
      // Log failed verification attempt
      adminQueries.logCredentialVerification({
        credential_id: null,
        access_code: accessCode.trim(),
        verifier_ip: req.ip || req.connection.remoteAddress,
        verifier_user_agent: req.get('User-Agent'),
        status: 'failed'
      }, (logErr) => {
        if (logErr) console.error('Failed to log verification attempt:', logErr);
      });
      
      return res.status(404).json({ error: 'No credential found with this access code' });
    }
    
    // Log successful verification
    adminQueries.logCredentialVerification({
      credential_id: result.id,
      access_code: accessCode.trim(),
      verifier_ip: req.ip || req.connection.remoteAddress,
      verifier_user_agent: req.get('User-Agent'),
      status: 'success'
    }, (logErr) => {
      if (logErr) console.error('Failed to log verification attempt:', logErr);
    });
    
    res.json({
      success: true,
      credential: result
    });
  });
});

module.exports = router;
