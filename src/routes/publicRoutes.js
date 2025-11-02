// fileName: publicRoutes.js
// Routes for public pages (HomePage - Contact & Verification)

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const verificationQueries = require('../queries/verificationQueries');
const adminQueries = require('../queries/adminQueries');
const ContactRateLimitService = require('../services/contactRateLimitService');
const tesseractService = require('../services/tesseractService');

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../../uploads/temp/'),
  limits: {
    fileSize: 30 * 1024 * 1024 // 30MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    const allowedTypes = /jpeg|jpg|png|gif|bmp|tiff|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'application/pdf' || allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed (JPEG, PNG, GIF, BMP, TIFF, PDF)'));
    }
  }
});

// POST /api/public/contact - Contact form submission with spam protection
router.post('/contact', async (req, res) => {
  const { name, email, user_type, message, deviceFingerprint } = req.body;
  
  // Basic validation
  if (!name || !email || !user_type || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  
  // Get client information
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const clientFingerprint = deviceFingerprint || `fallback_${ipAddress}_${Date.now()}`;
  
  try {
    // Check rate limiting
    const rateLimitCheck = await ContactRateLimitService.checkRateLimit(
      clientFingerprint, 
      ipAddress, 
      email
    );
    
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({ 
        error: rateLimitCheck.message,
        rateLimited: true,
        hoursLeft: rateLimitCheck.hoursLeft
      });
    }
    
    // Record the submission attempt
    await ContactRateLimitService.recordSubmission(
      clientFingerprint, 
      ipAddress, 
      email, 
      true
    );
    
    // Create contact message with additional tracking info
    const messageData = {
      name,
      email,
      user_type,
      message,
      deviceFingerprint: clientFingerprint,
      ipAddress,
      userAgent
    };
    
    adminQueries.createContactMessage(messageData, (err, result) => {
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
    
  } catch (error) {
    console.error('Rate limiting error:', error);
    
    // Fallback: still allow submission but log the error
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
  }
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

// POST /api/public/compare-credential - Compare uploaded file with verified credential
router.post('/compare-credential', upload.single('file'), async (req, res) => {
  let uploadedFilePath = null;
  
  try {
    const { credentialId } = req.body;
    
    if (!credentialId) {
      return res.status(400).json({ error: 'Credential ID is required' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    uploadedFilePath = req.file.path;
    console.log('File uploaded for comparison:', uploadedFilePath);
    
    // Get credential data from database
    verificationQueries.getCredentialById(credentialId, async (err, credential) => {
      if (err) {
        console.error('Database error:', err);
        // Cleanup uploaded file
        if (uploadedFilePath) {
          try {
            await fs.unlink(uploadedFilePath);
          } catch (cleanupErr) {
            console.error('Failed to cleanup uploaded file:', cleanupErr);
          }
        }
        return res.status(500).json({ error: 'Database error occurred' });
      }
      
      if (!credential) {
        // Cleanup uploaded file
        if (uploadedFilePath) {
          try {
            await fs.unlink(uploadedFilePath);
          } catch (cleanupErr) {
            console.error('Failed to cleanup uploaded file:', cleanupErr);
          }
        }
        return res.status(404).json({ error: 'Credential not found' });
      }
      
      if (!credential.ipfs_cid) {
        // Cleanup uploaded file
        if (uploadedFilePath) {
          try {
            await fs.unlink(uploadedFilePath);
          } catch (cleanupErr) {
            console.error('Failed to cleanup uploaded file:', cleanupErr);
          }
        }
        return res.status(400).json({ error: 'No IPFS file found for this credential' });
      }
      
      try {
        // Compare files using AI-Enhanced comparison (Gemini + Tesseract OCR)
        const tempDir = path.join(__dirname, '../../uploads/temp/');
        const comparisonResult = await tesseractService.processAIEnhancedComparison(
          credential.ipfs_cid,
          uploadedFilePath,
          tempDir,
          credential.credential_type // Pass credential type from database
        );
        
        // Log comparison attempt
        adminQueries.logCredentialVerification({
          credential_id: credentialId,
          access_code: credential.access_code || 'comparison',
          verifier_ip: req.ip || req.connection.remoteAddress,
          verifier_user_agent: req.get('User-Agent'),
          status: 'file_comparison'
        }, (logErr) => {
          if (logErr) console.error('Failed to log comparison attempt:', logErr);
        });
        
        // Cleanup uploaded file
        if (uploadedFilePath) {
          try {
            await fs.unlink(uploadedFilePath);
          } catch (cleanupErr) {
            console.error('Failed to cleanup uploaded file:', cleanupErr);
          }
        }
        
        res.json({
          success: true,
          credential: {
            id: credential.id,
            recipient_name: credential.recipient_name,
            credential_type: credential.credential_type,
            issuer_name: credential.issuer_name
          },
          ...comparisonResult
        });
        
      } catch (comparisonError) {
        console.error('Comparison error:', comparisonError);
        
        // Cleanup uploaded file
        if (uploadedFilePath) {
          try {
            await fs.unlink(uploadedFilePath);
          } catch (cleanupErr) {
            console.error('Failed to cleanup uploaded file:', cleanupErr);
          }
        }
        
        res.status(500).json({ 
          error: 'Failed to compare files',
          message: comparisonError.message 
        });
      }
    });
    
  } catch (error) {
    console.error('Comparison route error:', error);
    
    // Cleanup uploaded file
    if (uploadedFilePath) {
      try {
        await fs.unlink(uploadedFilePath);
      } catch (cleanupErr) {
        console.error('Failed to cleanup uploaded file:', cleanupErr);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to process comparison request',
      message: error.message 
    });
  }
});

module.exports = router;
