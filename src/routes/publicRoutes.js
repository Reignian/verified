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

// POST /api/public/verify-credential - Verify credential by access code (single or multi)
router.post('/verify-credential', (req, res) => {
  const { accessCode } = req.body;
  
  if (!accessCode) {
    return res.status(400).json({ error: 'Access code is required' });
  }
  
  const trimmedCode = accessCode.trim();
  
  // First try single access code
  verificationQueries.getCredentialData(trimmedCode, (err, singleResult) => {
    if (err) {
      console.error('Single verification error:', err);
      return res.status(500).json({ error: 'Database error occurred' });
    }
    
    if (singleResult) {
      // Log successful single verification
      adminQueries.logCredentialVerification({
        credential_id: singleResult.id,
        access_code: trimmedCode,
        verifier_ip: req.ip || req.connection.remoteAddress,
        verifier_user_agent: req.get('User-Agent'),
        status: 'success'
      }, (logErr) => {
        if (logErr) console.error('Failed to log verification attempt:', logErr);
      });
      
      return res.json({
        success: true,
        type: 'single',
        credential: singleResult
      });
    }
    
    // If no single result, try multi-access code
    verificationQueries.getMultiCredentialData(trimmedCode, (multiErr, multiResults) => {
      if (multiErr) {
        console.error('Multi verification error:', multiErr);
        return res.status(500).json({ error: 'Database error occurred' });
      }
      
      if (multiResults && multiResults.length > 0) {
        // Log successful multi verification (log first credential as representative)
        adminQueries.logCredentialVerification({
          credential_id: multiResults[0].id,
          access_code: trimmedCode,
          verifier_ip: req.ip || req.connection.remoteAddress,
          verifier_user_agent: req.get('User-Agent'),
          status: 'success'
        }, (logErr) => {
          if (logErr) console.error('Failed to log verification attempt:', logErr);
        });
        
        return res.json({
          success: true,
          type: 'multi',
          credentials: multiResults,
          count: multiResults.length
        });
      }
      
      // No results found in either single or multi
      adminQueries.logCredentialVerification({
        credential_id: null,
        access_code: trimmedCode,
        verifier_ip: req.ip || req.connection.remoteAddress,
        verifier_user_agent: req.get('User-Agent'),
        status: 'failed'
      }, (logErr) => {
        if (logErr) console.error('Failed to log verification attempt:', logErr);
      });
      
      return res.status(404).json({ error: 'No credential found with this access code' });
    });
  });
});

module.exports = router;
