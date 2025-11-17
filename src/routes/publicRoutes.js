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
const { logMetric } = require('../services/metricsService');

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
  const routeStart = Date.now();
  
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

        const durationMs = Date.now() - routeStart;
        logMetric({
          name: 'Route_Public_CompareCredential',
          durationMs,
          extra: {
            success: true,
            credentialId,
            ipfsCid: credential.ipfs_cid,
            overallStatus: comparisonResult.overallStatus
          }
        });
        
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

        const durationMs = Date.now() - routeStart;
        logMetric({
          name: 'Route_Public_CompareCredential',
          durationMs,
          extra: {
            success: false,
            credentialId,
            error: comparisonError.message,
            stage: 'comparison_error'
          }
        });
        
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

    const durationMs = Date.now() - routeStart;
    logMetric({
      name: 'Route_Public_CompareCredential',
      durationMs,
      extra: {
        success: false,
        error: error.message,
        stage: 'route_error'
      }
    });
    
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
  const routeStart = Date.now();
  
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
      verificationQueries.searchCredentialsByAI(searchParams, (err, results, partialMatches) => {
        if (err) reject(err);
        else resolve({ results, partialMatches });
      });
    });
    
    console.log('Found', matchingCredentials.results?.length || 0, 'potential matches');
    
    // Use the results from the promise
    let finalMatchingCredentials = matchingCredentials.results || [];
    
    // If no exact matches but we have partial matches, use them for visual comparison
    // The visual AI comparison will be the ultimate judge
    if (finalMatchingCredentials.length === 0 && matchingCredentials.partialMatches && matchingCredentials.partialMatches.length > 0) {
      console.log('No exact matches, but found', matchingCredentials.partialMatches.length, 'partial matches. Proceeding to visual comparison...');
      
      // Filter partial matches by credential type if we have one from AI extraction
      let filteredPartialMatches = matchingCredentials.partialMatches;
      if (searchParams.credentialType) {
        const extractedType = searchParams.credentialType.toLowerCase();
        filteredPartialMatches = matchingCredentials.partialMatches.filter(match => {
          const dbType = (match.credential_type || '').toLowerCase();
          // Check if types are similar (diploma, transcript, certificate, etc.)
          return dbType.includes(extractedType) || extractedType.includes(dbType) ||
                 (extractedType.includes('diploma') && dbType.includes('diploma')) ||
                 (extractedType.includes('transcript') && dbType.includes('transcript')) ||
                 (extractedType.includes('certificate') && dbType.includes('certificate'));
        });
        
        if (filteredPartialMatches.length < matchingCredentials.partialMatches.length) {
          console.log(`Filtered to ${filteredPartialMatches.length} matches with matching credential type (${searchParams.credentialType})`);
        }
      }
      
      // Fetch full credential data for filtered partial matches
      const partialMatchIds = filteredPartialMatches.map(m => m.id);
      
      if (partialMatchIds.length === 0) {
        console.log('No partial matches with matching credential type');
      } else {
        // Get full credential details for partial matches using proper query function
        const partialCredentials = await new Promise((resolve, reject) => {
          verificationQueries.getCredentialsByIds(partialMatchIds, (err, results) => {
            if (err) reject(err);
            else resolve(results || []);
          });
        });
        
        finalMatchingCredentials = partialCredentials;
        console.log('Using', finalMatchingCredentials.length, 'partial matches for visual comparison');
      }
    }
    
    if (finalMatchingCredentials.length === 0) {
      // Cleanup uploaded file
      if (uploadedFilePath) {
        try {
          await fs.unlink(uploadedFilePath);
        } catch (cleanupErr) {
          console.error('Failed to cleanup uploaded file:', cleanupErr);
        }
      }
      
      // Check if we have partial matches to provide detailed error
      const partialMatches = matchingCredentials.partialMatches || [];
      
      if (partialMatches.length > 0 && aiExtraction.success) {
        // Compare extracted data with partial matches to find mismatches
        const mismatchDetails = [];
        const bestMatch = partialMatches[0]; // Use the first partial match
        
        // Helper function to normalize and compare strings
        const normalizeString = (str) => (str || '').toLowerCase().trim();
        const stringsMatch = (str1, str2) => {
          const norm1 = normalizeString(str1);
          const norm2 = normalizeString(str2);
          return norm1.includes(norm2) || norm2.includes(norm1);
        };
        
        // Helper function to parse name components
        const parseNameComponents = (fullName) => {
          if (!fullName) return null;
          const name = fullName.trim();
          
          // Check if name contains comma (format: "Last, First Middle")
          if (name.includes(',')) {
            const parts = name.split(',').map(p => p.trim());
            const lastName = parts[0];
            const firstMiddle = parts[1] || '';
            const firstMiddleParts = firstMiddle.split(/\s+/).filter(p => p.length > 0);
            
            return {
              lastName: lastName.toLowerCase(),
              firstName: (firstMiddleParts[0] || '').toLowerCase(),
              middleName: (firstMiddleParts.slice(1).join(' ') || '').toLowerCase()
            };
          } else {
            // Format: "First Middle Last" or "First Last"
            const parts = name.split(/\s+/).filter(p => p.length > 0);
            
            if (parts.length >= 3) {
              return {
                firstName: parts[0].toLowerCase(),
                middleName: parts.slice(1, -1).join(' ').toLowerCase(),
                lastName: parts[parts.length - 1].toLowerCase()
              };
            } else if (parts.length === 2) {
              return {
                firstName: parts[0].toLowerCase(),
                middleName: '',
                lastName: parts[1].toLowerCase()
              };
            }
          }
          return null;
        };
        
        // Check name field with smart parsing
        // Since the partial match was found using the same progressive search logic,
        // if we have a partial match, the name components matched successfully
        // We should NOT flag it as a mismatch just because the format is different
        // The fact that it was found means the name matched!
        
        // Skip name checking - if partial match was found, name matched via progressive search
        // (The partial match query uses OR conditions on name fields, so it already validated the name)
        
        if (searchParams.studentId && searchParams.studentId !== null) {
          // Normalize student IDs by removing special characters for comparison
          // This allows '202201084' to match '2022-01084'
          const normalizedExtracted = searchParams.studentId.replace(/[-\s]/g, '');
          const normalizedDB = (bestMatch.student_id || '').replace(/[-\s]/g, '');
          
          if (normalizedExtracted !== normalizedDB) {
            mismatchDetails.push('Student ID');
          }
        }
        
        if (searchParams.institutionName && searchParams.institutionName !== null && 
            !stringsMatch(searchParams.institutionName, bestMatch.issuer_name)) {
          mismatchDetails.push('Institution Name');
        }
        
        if (searchParams.credentialType && searchParams.credentialType !== null && 
            !stringsMatch(searchParams.credentialType, bestMatch.credential_type)) {
          mismatchDetails.push('Credential Type');
        }
        
        if (searchParams.program && searchParams.program !== null && 
            !stringsMatch(searchParams.program, bestMatch.program_name)) {
          mismatchDetails.push('Program');
        }
        
        // If we have 1-3 mismatches, show detailed error
        if (mismatchDetails.length > 0 && mismatchDetails.length <= 3) {
          return res.status(404).json({
            success: false,
            error: 'No matching credentials found',
            message: 'Found a similar credential, but some fields do not match:',
            mismatchDetails: mismatchDetails,
            hasPartialMatch: true
          });
        }
      }
      
      // Generic error if no partial matches or too many mismatches
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
    
    for (let i = 0; i < finalMatchingCredentials.length; i++) {
      const credential = finalMatchingCredentials[i];
      console.log(`Comparing with credential ${i + 1}/${finalMatchingCredentials.length} (ID: ${credential.id})...`);
      
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
          
          // PRACTICAL MATCHING for real-world use cases (photos of physical credentials)
          // Focus on CONTENT, not visual perfection
          
          const isIdentical = keyFindings.exactSameDocument === true;
          const textSimilarity = comparisonResult.ocrComparison?.similarity || 0;
          const credentialTypeMatches = keyFindings.credentialTypeMatch;
          const tamperingSeverity = keyFindings.tamperingSeverity || 'None';
          const overallStatus = comparisonResult.overallStatus;
          
          // Content-based matching criteria (suitable for photos vs digital copies)
          // PRIORITY: Content similarity over type matching (AI can misidentify types)
          // Accept: authentic, suspicious, and even minor/moderate tampering
          // Reject: only severe tampering or very low similarity
          const contentMatches = (
            // Text similarity >= 60% (allows for OCR errors in photos, poor lighting, etc.)
            textSimilarity >= 60 &&
            // Only reject if SEVERE tampering (Minor/Moderate is acceptable for photos)
            tamperingSeverity !== 'Severe' &&
            // Only reject if clearly fraudulent (not just suspicious)
            overallStatus !== 'fraudulent'
            // NOTE: Credential type matching is NOT required - AI can misidentify types
            // Content similarity is what matters most
          );
          
          console.log(`Credential ${credential.id} matching analysis:`);
          console.log(`  - Text similarity: ${textSimilarity}%`);
          console.log(`  - Type match: ${credentialTypeMatches}`);
          console.log(`  - Tampering severity: ${keyFindings.tamperingSeverity}`);
          console.log(`  - Overall status: ${comparisonResult.overallStatus}`);
          console.log(`  - Content matches: ${contentMatches}`);
          
          if (isIdentical || contentMatches) {
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
            
            // Stop comparing - we found a match!
            console.log('Match found! Skipping remaining comparisons...');
            break;
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
        potentialMatches: finalMatchingCredentials.length,
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
    {
      const durationMs = Date.now() - routeStart;
      logMetric({
        name: 'Route_Public_VerifyByFile',
        durationMs,
        extra: {
          success: true,
          verifiedMatchCount: verifiedMatches.length,
          potentialMatches: finalMatchingCredentials.length,
          aiExtractionSuccess: aiExtraction.success
        }
      });
    }
    res.json(responseData);
    console.log('Response sent successfully');
    
  } catch (error) {
    console.error('Verify-by-file error:', error);

    const durationMs = Date.now() - routeStart;
    logMetric({
      name: 'Route_Public_VerifyByFile',
      durationMs,
      extra: {
        success: false,
        error: error.message
      }
    });
    
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
