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
const geminiService = require('../services/geminiService');

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
        // Note: Pass null for access_code since multi-access codes are in different table
        adminQueries.logCredentialVerification({
          credential_id: multiResults[0].id,
          access_code: null, // Multi-access codes don't exist in credential_access table
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

// POST /api/public/verify-by-file - Verify credential by uploading the file directly
router.post('/verify-by-file', upload.single('file'), async (req, res) => {
  let uploadedFilePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }
    
    uploadedFilePath = req.file.path;
    console.log('File uploaded for verification:', uploadedFilePath);
    console.log('File size:', req.file.size, 'bytes');
    
    // Step 1: Extract text from uploaded file using OCR
    console.log('Step 1: Extracting text with OCR...');
    const extractedText = await tesseractService.extractTextFromImage(uploadedFilePath);
    console.log('OCR completed. Text length:', extractedText.length);
    
    if (!extractedText || extractedText.trim().length < 50) {
      // Cleanup uploaded file
      if (uploadedFilePath) {
        try {
          await fs.unlink(uploadedFilePath);
        } catch (cleanupErr) {
          console.error('Failed to cleanup uploaded file:', cleanupErr);
        }
      }
      
      return res.status(400).json({
        success: false,
        error: 'Insufficient text extracted from file',
        message: 'Could not extract meaningful text from the uploaded file. Please ensure the file is clear and readable.'
      });
    }
    
    // Step 2: Use AI to extract structured information from the file
    console.log('Step 2: Using AI to extract credential information...');
    const aiExtraction = await geminiService.extractCredentialInfo(uploadedFilePath);
    
    if (!aiExtraction.success) {
      console.log('AI extraction failed, falling back to basic OCR identification');
      // Fallback to basic credential type identification
      const credentialType = tesseractService.identifyCredentialType(extractedText);
      console.log('Identified credential type (fallback):', credentialType);
    } else {
      console.log('AI extracted information:', aiExtraction.data);
    }
    
    // Step 3: Search database for matching credentials using AI-extracted data
    console.log('Step 3: Searching database for matching credentials...');
    
    // Prepare search parameters from AI extraction or fallback to OCR text
    const searchParams = aiExtraction.success ? {
      recipientName: aiExtraction.data.recipientName,
      institutionName: aiExtraction.data.institutionName,
      credentialType: aiExtraction.data.documentType,
      program: aiExtraction.data.program,
      studentId: aiExtraction.data.studentId,
      issueDate: aiExtraction.data.issueDate
    } : {
      extractedText: extractedText,
      credentialType: tesseractService.identifyCredentialType(extractedText)
    };
    
    const matchingCredentials = await new Promise((resolve, reject) => {
      verificationQueries.searchCredentialsByAI(searchParams, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('Found', matchingCredentials.length, 'potential matches');
    
    if (matchingCredentials.length === 0) {
      // Cleanup uploaded file
      if (uploadedFilePath) {
        try {
          await fs.unlink(uploadedFilePath);
        } catch (cleanupErr) {
          console.error('Failed to cleanup uploaded file:', cleanupErr);
        }
      }
      
      return res.status(404).json({
        success: false,
        error: 'No matching credentials found',
        message: 'Could not find any credentials in the database that match the uploaded file. The credential may not exist in our system.',
        extractedInfo: {
          credentialType: searchParams.credentialType || 'Unknown',
          textLength: extractedText.length
        }
      });
    }
    
    // Step 4: AI Visual Comparison for Security
    // Compare uploaded file with each matching credential's IPFS file
    console.log('Step 4: Performing AI visual comparison for security...');
    
    const tempDir = path.join(__dirname, '../../uploads/temp/');
    const verifiedMatches = [];
    
    for (let i = 0; i < matchingCredentials.length; i++) {
      const credential = matchingCredentials[i];
      console.log(`Comparing with credential ${i + 1}/${matchingCredentials.length} (ID: ${credential.id})...`);
      
      let verifiedFilePath = null;
      
      try {
        // Use FULL AI-Enhanced comparison (same as "Compare with Another File" feature)
        console.log('Performing full AI-enhanced comparison...');
        const comparisonResult = await tesseractService.processAIEnhancedComparison(
          credential.ipfs_cid,
          uploadedFilePath,
          tempDir,
          credential.credential_type
        );
        
        if (comparisonResult.success) {
          // processAIEnhancedComparison returns data in keyFindings
          const keyFindings = comparisonResult.keyFindings;
          
          // Check if files are identical or highly similar
          const isIdentical = keyFindings.exactSameDocument === true;
          const isHighlySimilar = comparisonResult.matchConfidence === 'High' && 
                                 comparisonResult.overallStatus === 'Authentic';
          
          if (isIdentical || isHighlySimilar) {
            console.log(`Match confirmed! Credential ${credential.id} is authentic`);
            console.log(`Credential blockchain_id from DB:`, credential.blockchain_id);
            
            // Add to verified matches with FULL comparison details
            verifiedMatches.push({
              credential: {
                id: credential.id,
                recipientName: credential.recipient_name,
                institutionName: credential.issuer_name,
                credentialType: credential.credential_type,
                programName: credential.program_name,
                dateIssued: credential.date_issued,
                ipfsCid: credential.ipfs_cid,
                blockchainId: credential.blockchain_id,
                issuerPublicAddress: credential.issuer_public_address,
                institutionAddresses: credential.institution_addresses,
                studentId: credential.student_id
              },
              comparisonResult: comparisonResult // Full detailed comparison result
            });
          } else {
            console.log(`Credential ${credential.id} does not match - ${comparisonResult.overallStatus}`);
          }
        } else {
          console.log(`AI comparison failed for credential ${credential.id}:`, comparisonResult.error);
        }
        
        // Cleanup verified file
        if (verifiedFilePath) {
          try {
            await fs.unlink(verifiedFilePath);
          } catch (cleanupErr) {
            console.error('Failed to cleanup verified file:', cleanupErr);
          }
        }
        
      } catch (comparisonError) {
        console.error(`Error comparing with credential ${credential.id}:`, comparisonError);
        
        // Cleanup on error
        if (verifiedFilePath) {
          try {
            await fs.unlink(verifiedFilePath);
          } catch (cleanupErr) {
            console.error('Failed to cleanup verified file:', cleanupErr);
          }
        }
      }
    }
    
    console.log(`Visual comparison complete. Found ${verifiedMatches.length} verified matches.`);
    
    // Cleanup uploaded file
    if (uploadedFilePath) {
      try {
        await fs.unlink(uploadedFilePath);
      } catch (cleanupErr) {
        console.error('Failed to cleanup uploaded file:', cleanupErr);
      }
    }
    
    // Check if we found any verified matches
    if (verifiedMatches.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No verified matches found',
        message: 'Found potential credentials in database, but none matched the uploaded file visually. The uploaded file may be tampered with or does not exist in our system.',
        potentialMatches: matchingCredentials.length,
        stage: 'visual_comparison_failed'
      });
    }
    
    // Step 5: Return results for frontend blockchain verification
    console.log('Step 5: Sending response to frontend...');
    console.log('Verified matches count:', verifiedMatches.length);
    
    // Note: Blockchain verification will be done on the frontend
    // We return the verified matches with all necessary data for blockchain checks
    // The frontend will use the existing runOnChainIntegrityChecks function
    
    // Return verified matches with complete data for frontend blockchain verification
    const responseData = {
      success: true,
      stage: 'ready_for_blockchain_verification',
      verifiedMatchCount: verifiedMatches.length,
      verifiedMatches: verifiedMatches,
      message: 'File verified successfully through AI visual comparison. Ready for blockchain verification.'
    };
    
    console.log('Sending response with', JSON.stringify(responseData).length, 'bytes');
    res.json(responseData);
    console.log('Response sent successfully');
    
  } catch (error) {
    console.error('Verify-by-file error:', error);
    
    // Cleanup uploaded file on error
    if (uploadedFilePath) {
      try {
        await fs.unlink(uploadedFilePath);
      } catch (cleanupErr) {
        console.error('Failed to cleanup uploaded file:', cleanupErr);
      }
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to process file verification',
      message: error.message 
    });
  }
});

module.exports = router;
