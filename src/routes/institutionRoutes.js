// fileName: institutionRoutes.js (Consolidated by Institution Dashboard Page)
// All routes used by AcademicInstitution dashboard

const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const academicQueries = require('../queries/academicInstitutionQueries');
const myVerifiEDQueries = require('../queries/MyVerifiEDQueries');
const pinataService = require('../services/pinataService');
const XLSX = require('xlsx');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const tesseractService = require('../services/tesseractService');
const geminiService = require('../services/geminiService');
const smtpEmailService = require('../services/smtpEmailService');

const upload = multer({ storage: multer.memoryStorage() });

// Configure multer for temporary file storage (for OCR analysis)
const tempStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(__dirname, '../../uploads/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'credential-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadTemp = multer({ 
  storage: tempStorage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp|tiff|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed'));
    }
  }
});

// Helper function to load contract data
function loadContractData() {
  // For Polygon Amoy, use the static config instead of build files
  try {
    // Import the config file (using require since this is CommonJS)
    const configPath = path.join(__dirname, '../config/CredentialRegistryConfig.js');
    if (fs.existsSync(configPath)) {
      // Read and parse the ES6 module manually
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      // Extract CONTRACT_ABI from the file content
      const abiMatch = configContent.match(/export const CONTRACT_ABI = (\[[\s\S]*?\]);/);
      if (abiMatch) {
        const abiString = abiMatch[1];
        const abi = eval(`(${abiString})`); // Safe since it's our own config file
        return { abi };
      }
    }
    
    // Fallback to build folder for local development
    const contractPath = path.join(__dirname, '../../build/contracts/CredentialRegistry.json');
    if (fs.existsSync(contractPath)) {
      return JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    }
    
    return null;
  } catch (error) {
    console.error('Error loading contract data:', error);
    return null;
  }
}

// ============ INSTITUTION INFO ============

// GET /api/institution/:accountId/name - Get institution name
router.get('/:accountId/name', (req, res) => {
  const { accountId } = req.params;
  
  academicQueries.getInstitutionName(accountId, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    
    res.json(results[0]);
  });
});

// GET /api/institution/:accountId/public-address - Get institution public address
router.get('/:accountId/public-address', (req, res) => {
  const { accountId } = req.params;
  
  academicQueries.getInstitutionPublicAddress(accountId, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    
    res.json(results[0]);
  });
});

// GET /api/institution/:accountId/addresses - Get all institution addresses with history
router.get('/:accountId/addresses', (req, res) => {
  const { accountId } = req.params;
  
  academicQueries.getInstitutionAddresses(accountId, (err, results) => {
    if (err) {
      console.error('Error fetching institution addresses:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({
      addresses: results || [],
      count: results ? results.length : 0
    });
  });
});

// PUT /api/institution/:accountId/public-address - Update institution public address
router.put('/:accountId/public-address', (req, res) => {
  const { accountId } = req.params;
  const { public_address } = req.body;
  
  if (!public_address) {
    return res.status(400).json({ error: 'Public address is required' });
  }
  
  // Basic Ethereum address validation
  if (!/^0x[a-fA-F0-9]{40}$/.test(public_address)) {
    return res.status(400).json({ error: 'Invalid Ethereum address format' });
  }
  
  // Call updated function (no label parameter needed)
  academicQueries.updateInstitutionPublicAddress(accountId, public_address, (err, results) => {
    if (err) {
      console.error('Error updating public address:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Check if institution was found and updated
    if (results.updateResult && results.updateResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    
    res.json({ 
      message: results.message || 'Public address updated successfully',
      public_address: public_address,
      success: true
    });
  });
});

// ============ STUDENT MANAGEMENT ============

// File parsing utilities
async function parseFile(buffer, mimetype, filename) {
  let textContent = '';
  
  try {
    if (mimetype.includes('pdf')) {
      try {
        const pdfData = await pdfParse(buffer);
        textContent = pdfData.text;
        if (!textContent.trim()) {
          throw new Error('PDF file appears to be empty or is an image-only PDF. Please use a text-based PDF.');
        }
      } catch (pdfError) {
        throw new Error(`Failed to parse PDF. Ensure it's a valid, text-based document. Details: ${pdfError.message}`);
      }
    } else if (mimetype.includes('word') || filename.endsWith('.docx')) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        textContent = result.value;
        if (!textContent.trim()) {
          throw new Error('Word document appears to be empty.');
        }
      } catch (wordError) {
        throw new Error(`Failed to parse Word document. The file may be corrupted or in an unsupported format. Details: ${wordError.message}`);
      }
    } else if (mimetype.includes('sheet') || filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      try {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error('Excel file contains no sheets.');
        const worksheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(worksheet);
      } catch (excelError) {
        throw new Error(`Failed to parse the spreadsheet. Ensure it is a valid .xlsx or .xls file and not password-protected. Details: ${excelError.message}`);
      }
    } else if (mimetype.includes('csv') || filename.endsWith('.csv')) {
      try {
        textContent = buffer.toString('utf8');
        if (!textContent.trim()) throw new Error('CSV file is empty.');
        return parseCSV(textContent);
      } catch (csvError) {
        throw new Error(`Failed to parse CSV file. Ensure it is a valid text file. Details: ${csvError.message}`);
      }
    } else if (mimetype.includes('text') || filename.endsWith('.txt')) {
      textContent = buffer.toString('utf8');
      if (!textContent.trim()) throw new Error('Text file is empty.');
    } else {
      throw new Error(`Unsupported file type: ${mimetype}. Please upload a supported document (PDF, Word, Excel, CSV, TXT).`);
    }
    
    return parseTextContent(textContent);
  } catch (error) {
    throw error;
  }
}

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    data.push(row);
  }
  
  return data;
}

function parseTextContent(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const students = [];
  let currentStudent = {};

  for (const line of lines) {
    const nameMatch = line.match(/name[:\s]+([^,\n]+)/i);
    const idMatch = line.match(/student[_\s]*id[:\s]+([^,\s\n]+)/i);
    const emailMatch = line.match(/email[:\s]+([^\s,\n]+)/i);
    const usernameMatch = line.match(/username[:\s]+([^\s,\n]+)/i);

    if (nameMatch) currentStudent.name = nameMatch[1].trim();
    if (idMatch) currentStudent.student_id = idMatch[1].trim();
    if (emailMatch) currentStudent.email = emailMatch[1].trim();
    if (usernameMatch) currentStudent.username = usernameMatch[1].trim();

    if (currentStudent.name && currentStudent.student_id) {
      students.push(currentStudent);
      currentStudent = {};
    }
  }

  return students;
}

function normalizeStudentData(rawData) {
  return rawData.map(item => {
    const normalized = {};
    
    const fieldMappings = {
      student_id: ['student_id', 'id', 'student id', 'studentid', 'registration_number', 'reg_no'],
      first_name: ['first_name', 'firstname', 'first name', 'given_name', 'fname'],
      middle_name: ['middle_name', 'middlename', 'middle name', 'mname'],
      last_name: ['last_name', 'lastname', 'last name', 'surname', 'family_name', 'lname'],
      username: ['username', 'user_name', 'login', 'account'],
      password: ['password', 'pass', 'pwd'],
      email: ['email', 'email_address', 'e_mail', 'mail'],
      full_name: ['name', 'full_name', 'fullname', 'full name']
    };
    
    Object.keys(fieldMappings).forEach(standardField => {
      const variations = fieldMappings[standardField];
      for (const variation of variations) {
        const key = Object.keys(item).find(k => k.toLowerCase() === variation.toLowerCase());
        if (key && item[key]) {
          normalized[standardField] = item[key].toString().trim();
          break;
        }
      }
    });
    
    if (normalized.full_name && !normalized.first_name) {
      const nameParts = normalized.full_name.split(' ');
      normalized.first_name = nameParts[0];
      if (nameParts.length > 2) {
        normalized.middle_name = nameParts.slice(1, -1).join(' ');
        normalized.last_name = nameParts[nameParts.length - 1];
      } else if (nameParts.length === 2) {
        normalized.last_name = nameParts[1];
      }
    }
    
    if (!normalized.username && normalized.first_name) {
      normalized.username = normalized.first_name.toLowerCase() + 
        (normalized.last_name ? normalized.last_name.toLowerCase() : '') +
        Math.floor(Math.random() * 1000);
    }
    
    if (!normalized.password) {
      normalized.password = 'student' + Math.floor(Math.random() * 10000);
    }
    
    if (!normalized.email && normalized.username) {
      normalized.email = normalized.username + '@student.edu';
    }
    
    return normalized;
  }).filter(student => student.first_name && student.student_id);
}

// POST /api/institution/students/add/:institutionId - Add single student
router.post('/students/add/:institutionId', (req, res) => {
  const { institutionId } = req.params;
  let { student_id, first_name, middle_name, last_name, username, email, password, program_id } = req.body;

  if (!institutionId) {
    return res.status(400).json({ error: 'Institution ID is required' });
  }

  if (!student_id || !first_name || !last_name || !email) {
    return res.status(400).json({ error: 'Student ID, First Name, Last Name, and Email are required' });
  }

  // Auto-generate username if not provided
  if (!username) {
    username = `${first_name.toLowerCase()}${student_id}`;
  }

  // Auto-generate password if not provided
  if (!password) {
    password = 'student123'; // Default password, will be hashed
  }

  academicQueries.checkStudentIdExists(student_id, (err, exists) => {
    if (err) {
      return res.status(500).json({ error: 'Database error checking student ID' });
    }
    if (exists) {
      return res.status(400).json({ error: 'Student ID already exists' });
    }

    academicQueries.checkUsernameExists(username, (err, exists) => {
      if (err) {
        return res.status(500).json({ error: 'Database error checking username' });
      }
      if (exists) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const studentData = { student_id, first_name, middle_name, last_name, username, email, password, program_id };
      const plainPassword = password; // Store plain password for email

      academicQueries.addStudent(studentData, institutionId, async (err, result) => {
        if (err) {
          console.error('Error adding student:', err);
          return res.status(500).json({ error: 'Failed to create student account' });
        }

        // Send automated welcome email with credentials
        const studentFullName = `${first_name} ${middle_name ? middle_name + ' ' : ''}${last_name}`.trim();
        const emailResult = await smtpEmailService.sendWelcomeEmail(
          email,
          studentFullName,
          username,
          plainPassword
        );

        res.json({
          success: true,
          message: 'Student account created successfully',
          student: result,
          email_sent: emailResult.success,
          email_message_id: emailResult.messageId || null
        });
      });
    });
  });
});

// POST /api/institution/students/bulk-import/:institutionId - Bulk import students
router.post('/students/bulk-import/:institutionId', upload.single('studentFile'), async (req, res) => {
  const { institutionId } = req.params;
  const { program_id } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!institutionId) {
    return res.status(400).json({ error: 'Institution ID is required' });
  }

  try {
    const rawData = await parseFile(req.file.buffer, req.file.mimetype, req.file.originalname);
    
    if (!rawData || rawData.length === 0) {
      return res.status(400).json({ error: 'No student data found in the file' });
    }

    const normalizedData = normalizeStudentData(rawData);
    
    if (normalizedData.length === 0) {
      return res.status(400).json({ error: 'No valid student records found after normalization' });
    }

    // Add program_id to each student if provided
    if (program_id) {
      normalizedData.forEach(student => {
        student.program_id = program_id;
      });
    }

    const results = await academicQueries.bulkCreateStudents(normalizedData, institutionId);
    
    res.json({
      message: 'Students imported successfully',
      imported_count: results.successful,
      failed_count: results.failed,
      total_processed: normalizedData.length,
      failed_records: results.failures
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: `Import failed: ${error.message}` });
  }
});

// GET /api/institution/students/:institutionId - Get all students for an institution
router.get('/students/:institutionId', (req, res) => {
  const { institutionId } = req.params;
  
  academicQueries.getStudents(institutionId, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// GET /api/institution/students/by-id/:studentId/credentials-management - Get student credentials for management
router.get('/students/by-id/:studentId/credentials-management', (req, res) => {
  const { studentId } = req.params;
  
  myVerifiEDQueries.getStudentCredentialsForManagement(studentId, (err, results) => {
    if (err) {
      console.error('Error fetching student credentials for management:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results || []);
  });
});

// DELETE /api/institution/students/:studentId - Delete student account (only if no credentials)
router.delete('/students/:studentId', (req, res) => {
  const { studentId } = req.params;
  
  academicQueries.deleteStudent(studentId, (err, result) => {
    if (err) {
      console.error('Error deleting student:', err);
      if (err.message === 'Cannot delete student with blockchain-verified credentials') {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to delete student account' });
    }
    
    res.json({
      success: true,
      message: result.message || 'Student deleted successfully'
    });
  });
});

// ============ CREDENTIAL ISSUANCE ============

// GET /api/institution/credential-types - Get all credential types
router.get('/credential-types', (req, res) => {
  academicQueries.getCredentialTypes((err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// GET /api/institution/recent-custom-type - Get recent custom credential type
router.get('/recent-custom-type', (req, res) => {
  academicQueries.getRecentCustomType((err, customType) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ custom_type: customType });
  });
});

// POST /api/institution/upload-credential - Upload credential to IPFS and database
router.post('/upload-credential', upload.single('credentialFile'), async (req, res) => {
  const { credential_type_id, owner_id, sender_id, custom_type, program_id } = req.body;
  
  // Either credential_type_id OR custom_type must be provided
  if ((!credential_type_id && !custom_type) || !owner_id || !sender_id || !req.file) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const metadata = {
      name: `Credential_${custom_type || credential_type_id}_${Date.now()}`,
      uploadedBy: `User_${sender_id}`,
      credentialType: custom_type || credential_type_id
    };

    const pinataResult = await pinataService.uploadBufferToPinata(
      req.file.buffer, 
      req.file.originalname, 
      metadata
    );

    const credentialData = {
      credential_type_id: credential_type_id ? parseInt(credential_type_id) : null,
      custom_type: custom_type || null,
      owner_id: parseInt(owner_id),
      sender_id: parseInt(sender_id),
      ipfs_cid: pinataResult.ipfsHash,
      status: 'uploaded',
      program_id: program_id ? parseInt(program_id) : null
    };
    
    academicQueries.createCredential(credentialData, (err, results) => {
      if (err) {
        console.error('Error creating credential:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        message: 'Credential uploaded successfully',
        credential_id: results.insertId,
        ipfs_hash: pinataResult.ipfsHash,
        ipfs_url: `https://amethyst-tropical-jackal-879.mypinata.cloud/ipfs/${pinataResult.ipfsHash}`,
        status: 'Uploaded to IPFS only'
      });
    });

  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/institution/upload-credential-after-blockchain - Upload credential ONLY after blockchain confirmation
router.post('/upload-credential-after-blockchain', upload.single('credentialFile'), async (req, res) => {
  const { credential_type_id, owner_id, sender_id, custom_type, blockchain_id, transaction_hash, program_id } = req.body;
  
  // Either credential_type_id OR custom_type must be provided, plus blockchain_id (credential ID) is required
  if ((!credential_type_id && !custom_type) || !owner_id || !sender_id || !blockchain_id || !req.file) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const metadata = {
      name: `Credential_${custom_type || credential_type_id}_${Date.now()}`,
      uploadedBy: `User_${sender_id}`,
      credentialType: custom_type || credential_type_id,
      credentialId: blockchain_id,
      transactionHash: transaction_hash
    };

    // Upload to IPFS
    const pinataResult = await pinataService.uploadBufferToPinata(
      req.file.buffer, 
      req.file.originalname, 
      metadata
    );

    // Check credential count BEFORE inserting the new credential
    academicQueries.getStudentAccountDetails(owner_id, async (err, studentResults) => {
      if (err) {
        console.error('Error fetching student details before credential insert:', err);
      }
      
      const isFirstCredential = studentResults && studentResults.length > 0 
        ? studentResults[0].credential_count === 0 
        : false;
      
      console.log(`Credential count check for student ${owner_id}: ${studentResults?.[0]?.credential_count || 0} credentials`);
      console.log(`Is first credential: ${isFirstCredential ? 'Yes' : 'No'}`);
      
      // Save to database with credential ID as blockchain_id
      const credentialData = {
        credential_type_id: credential_type_id ? parseInt(credential_type_id) : null,
        custom_type: custom_type || null,
        owner_id: parseInt(owner_id),
        sender_id: parseInt(sender_id),
        ipfs_cid: pinataResult.ipfsHash,
        blockchain_id: blockchain_id, // This is now the credential ID from smart contract
        transaction_id: transaction_hash || null, // Store transaction hash
        status: 'blockchain_verified',
        program_id: program_id ? parseInt(program_id) : null
      };
      
      academicQueries.createCredential(credentialData, async (err, results) => {
        if (err) {
          console.error('Error creating credential:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        const credentialId = results.insertId;
        
        // Fetch and save transaction costs from blockchain
        if (transaction_hash) {
          try {
            const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'https://polygon-mainnet.g.alchemy.com/v2/x_-JZb-YD_H8n3_11nOE-';
            
            // Fetch current POL price
            let polPriceUSD = 0.16;
            let polPricePHP = 9.0;
            
            try {
              const priceResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
                params: { ids: 'polygon-ecosystem-token', vs_currencies: 'usd,php' },
                timeout: 5000
              });
              const priceData = priceResponse.data['polygon-ecosystem-token'];
              if (priceData) {
                polPriceUSD = priceData.usd;
                polPricePHP = priceData.php;
              }
            } catch (priceErr) {
              console.error('Failed to fetch POL price for cost calculation:', priceErr.message);
            }
            
            // Fetch transaction receipt
            const receiptResponse = await axios.post(RPC_URL, {
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_getTransactionReceipt',
              params: [transaction_hash]
            }, { timeout: 10000 });
            
            const receipt = receiptResponse.data?.result;
            
            if (receipt) {
              // Fetch transaction details for gas price
              const txResponse = await axios.post(RPC_URL, {
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_getTransactionByHash',
                params: [transaction_hash]
              }, { timeout: 10000 });
              
              const txDetails = txResponse.data?.result;
              
              if (txDetails) {
                // Calculate costs
                const gasUsed = parseInt(receipt.gasUsed, 16);
                const gasPriceWei = parseInt(txDetails.gasPrice, 16);
                const gasPriceGwei = gasPriceWei / 1e9;
                const gasCostPOL = (gasUsed * gasPriceWei) / 1e18;
                const gasCostUSD = gasCostPOL * polPriceUSD;
                const gasCostPHP = gasCostPOL * polPricePHP;
                const txTimestamp = parseInt(txDetails.blockNumber, 16); // Use block number as timestamp
                
                // Get institution_id from sender (check staff first, then institution)
                const db = require('../config/database');
                
                // First, try to get institution_id from institution_staff table
                db.query('SELECT institution_id FROM institution_staff WHERE id = ?', [sender_id], (err, staffResults) => {
                  if (!err && staffResults && staffResults.length > 0) {
                    // Sender is staff, use their institution_id
                    const institutionId = staffResults[0].institution_id;
                    saveTransactionCost(institutionId);
                  } else {
                    // Sender might be institution directly, check institution table
                    db.query('SELECT id FROM institution WHERE id = ?', [sender_id], (err, instResults) => {
                      if (!err && instResults && instResults.length > 0) {
                        // Sender is institution
                        const institutionId = instResults[0].id;
                        saveTransactionCost(institutionId);
                      } else {
                        console.error('Could not determine institution_id for sender:', sender_id);
                      }
                    });
                  }
                });
                
                // Helper function to save transaction costs
                function saveTransactionCost(institutionId) {
                  const costData = {
                    credential_id: credentialId,
                    transaction_hash: transaction_hash,
                    institution_id: institutionId,
                    gas_used: gasUsed,
                    gas_price_gwei: gasPriceGwei,
                    gas_cost_pol: gasCostPOL,
                    pol_price_usd: polPriceUSD,
                    pol_price_php: polPricePHP,
                    gas_cost_usd: gasCostUSD,
                    gas_cost_php: gasCostPHP,
                    tx_timestamp: txTimestamp
                  };
                  
                  console.log('Attempting to save transaction costs:', {
                    credential_id: credentialId,
                    transaction_hash: transaction_hash,
                    institution_id: institutionId,
                    gas_cost_pol: gasCostPOL,
                    gas_cost_usd: gasCostUSD
                  });
                  
                  academicQueries.insertTransactionCost(costData, (err) => {
                    if (err) {
                      console.error('Error saving transaction costs:', err);
                    } else {
                      console.log(`Transaction costs saved successfully for credential ${credentialId}`);
                    }
                  });
                }
              }
            }
          } catch (blockchainErr) {
            console.error('Error fetching blockchain data for cost calculation:', blockchainErr.message);
          }
        }
        
        // Get student account details again for email notification (with updated info)
        academicQueries.getStudentAccountDetails(owner_id, async (err, studentResults) => {
        let emailSent = false;
        let emailMessageId = null;
        
        if (!err && studentResults && studentResults.length > 0) {
          const student = studentResults[0];
          
          // Determine credential type name
          let credentialTypeName = custom_type || 'Credential';
          if (credential_type_id && !custom_type) {
            // Fetch credential type name from database
            academicQueries.getCredentialTypes(async (err, types) => {
              if (!err && types) {
                const type = types.find(t => t.id === parseInt(credential_type_id));
                if (type) credentialTypeName = type.type_name;
              }
              
              // Send email after determining credential type
              await sendCredentialEmail(student, credentialTypeName);
            });
          } else {
            // Send email immediately if using custom type
            await sendCredentialEmail(student, credentialTypeName);
          }
          
          async function sendCredentialEmail(student, typeName) {
            // Use the isFirstCredential flag captured BEFORE insertion
            const studentFullName = `${student.first_name} ${student.middle_name ? student.middle_name + ' ' : ''}${student.last_name}`.trim();
            
            let passwordToSend = null;
            
            // If this is the first credential, generate a temporary password
            if (isFirstCredential) {
              const bcrypt = require('bcrypt');
              const SALT_ROUNDS = 10;
              
              // Generate temporary password (you can customize this)
              const tempPassword = 'student123'; // Or generate random: Math.random().toString(36).slice(-8)
              
              // Hash the temporary password
              const hashedPassword = await bcrypt.hash(tempPassword, SALT_ROUNDS);
              
              // Update the account password
              const db = require('../config/database');
              await new Promise((resolve, reject) => {
                db.query(
                  'UPDATE account SET password = ? WHERE id = ?',
                  [hashedPassword, student.id],
                  (err) => {
                    if (err) {
                      console.error('Error updating temporary password:', err);
                      reject(err);
                    } else {
                      console.log(`Temporary password generated for student ID: ${student.id}`);
                      resolve();
                    }
                  }
                );
              });
              
              passwordToSend = tempPassword;
            }
            
            // Send automated credential notification email
            const emailResult = await smtpEmailService.sendCredentialIssuanceEmail(
              student.email,
              studentFullName,
              student.username,
              typeName,
              isFirstCredential,
              passwordToSend
            );
            
            emailSent = emailResult.success;
            emailMessageId = emailResult.messageId || null;
          }
        } else {
          console.error('Error fetching student details for email:', err);
        }
        
        res.json({
          message: 'Credential uploaded successfully',
          credential_id: results.insertId,
          ipfs_hash: pinataResult.ipfsHash,
          ipfs_url: `https://amethyst-tropical-jackal-879.mypinata.cloud/ipfs/${pinataResult.ipfsHash}`,
          blockchain_id: blockchain_id, // Credential ID
          transaction_hash: transaction_hash, // Transaction hash for reference
          status: 'Blockchain verified and uploaded to IPFS',
          email_sent: emailSent,
          email_message_id: emailMessageId
        });
        });
      });
    });

  } catch (error) {
    console.error('Upload after blockchain failed:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/institution/update-blockchain-id - Update credential's blockchain transaction hash after on-chain issuance
router.post('/update-blockchain-id', (req, res) => {
  const { credential_id, blockchain_id } = req.body;
  
  if (!credential_id || !blockchain_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const db = require('../config/database');
    const query = 'UPDATE credential SET blockchain_id = ?, status = ? WHERE id = ?';
    
    db.query(query, [blockchain_id, 'blockchain_verified', credential_id], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Credential not found' });
      }
      
      res.json({ 
        message: 'Blockchain transaction hash updated',
        credential_id,
        blockchain_id // This is now the transaction hash
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// ============ DASHBOARD STATS ============

// GET /api/institution/issued-credentials/:institutionId - Get issued credentials
router.get('/issued-credentials/:institutionId', (req, res) => {
  const { institutionId } = req.params;
  
  academicQueries.getIssuedCredentials(institutionId, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// GET /api/institution/credential-stats/:institutionId - Get credential statistics
router.get('/credential-stats/:institutionId', (req, res) => {
  const { institutionId } = req.params;
  
  academicQueries.getCredentialStats(institutionId, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results[0]);
  });
});

// GET /api/institution/dashboard-stats/:institutionId - Get dashboard statistics
router.get('/dashboard-stats/:institutionId', (req, res) => {
  const { institutionId } = req.params;
  
  academicQueries.getDashboardStats(institutionId, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results[0]);
  });
});

// ============ ANALYTICS ENDPOINTS ============

// GET /api/institution/analytics/credential-distribution/:institutionId
router.get('/analytics/credential-distribution/:institutionId', (req, res) => {
  const { institutionId } = req.params;
  const { startDate, endDate, programId } = req.query;
  
  academicQueries.getCredentialTypeDistribution(institutionId, startDate, endDate, programId, (err, results) => {
    if (err) {
      console.error('Error fetching credential distribution:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// GET /api/institution/analytics/students-by-program/:institutionId
router.get('/analytics/students-by-program/:institutionId', (req, res) => {
  const { institutionId } = req.params;
  
  academicQueries.getStudentsByProgram(institutionId, (err, results) => {
    if (err) {
      console.error('Error fetching students by program:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// GET /api/institution/analytics/recent-activity/:institutionId
router.get('/analytics/recent-activity/:institutionId', (req, res) => {
  const { institutionId } = req.params;
  
  academicQueries.getRecentActivity(institutionId, (err, results) => {
    if (err) {
      console.error('Error fetching recent activity:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// GET /api/institution/analytics/daily-trends/:institutionId
router.get('/analytics/daily-trends/:institutionId', (req, res) => {
  const { institutionId } = req.params;
  const { startDate, endDate, programId } = req.query;
  
  academicQueries.getDailyCredentialTrends(institutionId, startDate, endDate, programId, (err, results) => {
    if (err) {
      console.error('Error fetching daily trends:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// GET /api/institution/analytics/verification-stats/:institutionId
router.get('/analytics/verification-stats/:institutionId', (req, res) => {
  const { institutionId } = req.params;
  
  academicQueries.getVerificationStats(institutionId, (err, results) => {
    if (err) {
      console.error('Error fetching verification stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results[0] || {});
  });
});

// ============ INSTITUTION PROFILE ============

// GET /api/institution/:institutionId/profile - Get institution profile
router.get('/:institutionId/profile', (req, res) => {
  const { institutionId } = req.params;
  
  academicQueries.getInstitutionProfile(institutionId, (err, results) => {
    if (err) {
      console.error('Error fetching institution profile:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    
    res.json(results[0]);
  });
});

// PUT /api/institution/:institutionId/profile - Update institution profile
router.put('/:institutionId/profile', (req, res) => {
  const { institutionId } = req.params;
  const { institution_name, username, email, password, currentPassword } = req.body;
  
  if (!institution_name || !username || !email) {
    return res.status(400).json({ error: 'Institution name, username, and email are required' });
  }
  
  // If password change is requested, validate current password first
  if (password && password.trim() !== '') {
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required to change password' });
    }
    
    // Verify current password
    academicQueries.verifyInstitutionPassword(institutionId, currentPassword, (err, isValid) => {
      if (err) {
        console.error('Error verifying password:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      
      // Password verified, proceed with update
      const profileData = { institution_name, username, email, password };
      academicQueries.updateInstitutionProfile(institutionId, profileData, (err, results) => {
        if (err) {
          console.error('Error updating institution profile:', err);
          return res.status(500).json({ error: 'Database error', details: err.message });
        }
        
        res.json({ 
          message: 'Institution profile updated successfully',
          institution_name,
          username,
          email
        });
      });
    });
  } else {
    // No password change, update without password
    const profileData = { institution_name, username, email };
    academicQueries.updateInstitutionProfile(institutionId, profileData, (err, results) => {
      if (err) {
        console.error('Error updating institution profile:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      res.json({ 
        message: 'Institution profile updated successfully',
        institution_name,
        username,
        email
      });
    });
  }
});

// ============ STAFF MANAGEMENT ============

// GET /api/institution/:institutionId/staff - Get all staff members for an institution
router.get('/:institutionId/staff', (req, res) => {
  const { institutionId } = req.params;
  
  academicQueries.getInstitutionStaff(institutionId, (err, results) => {
    if (err) {
      console.error('Error fetching institution staff:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    res.json(results);
  });
});

// POST /api/institution/:institutionId/staff - Add a new staff member
router.post('/:institutionId/staff', (req, res) => {
  const { institutionId } = req.params;
  const { first_name, middle_name, last_name, username, email, password, user_id } = req.body;
  
  if (!first_name || !last_name || !username || !email || !password) {
    return res.status(400).json({ error: 'First name, last name, username, email, and password are required' });
  }
  
  const staffData = {
    first_name,
    middle_name: middle_name || '',
    last_name,
    username,
    email,
    password,
    institution_id: institutionId
  };
  
  academicQueries.addInstitutionStaff(staffData, (err, result) => {
    if (err) {
      console.error('Error adding institution staff:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    // Log activity if user_id is provided
    if (user_id) {
      const staffName = `${first_name} ${middle_name ? middle_name + ' ' : ''}${last_name}`.trim();
      const activityLog = {
        user_id: parseInt(user_id),
        institution_id: parseInt(institutionId),
        action: 'staff_added',
        action_type: 'create',
        description: `Added staff member: ${staffName}`
      };
      
      const db = require('../config/database');
      db.query(
        'INSERT INTO activity_log (user_id, institution_id, action, action_type, description) VALUES (?, ?, ?, ?, ?)',
        [activityLog.user_id, activityLog.institution_id, activityLog.action, activityLog.action_type, activityLog.description],
        (logErr) => {
          if (logErr) console.error('Error logging activity:', logErr);
        }
      );
    }
    
    res.json({
      success: true,
      message: 'Staff member added successfully',
      staff_id: result.staffId
    });
  });
});

// DELETE /api/institution/staff/:staffId - Delete a staff member
router.delete('/staff/:staffId', (req, res) => {
  const { staffId } = req.params;
  const { user_id, institution_id, staff_name } = req.query;
  
  academicQueries.deleteInstitutionStaff(staffId, (err, results) => {
    if (err) {
      console.error('Error deleting institution staff:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    
    // Log activity if user_id and institution_id are provided
    if (user_id && institution_id) {
      const activityLog = {
        user_id: parseInt(user_id),
        institution_id: parseInt(institution_id),
        action: 'staff_deleted',
        action_type: 'delete',
        description: `Deleted staff member: ${staff_name || 'Unknown'}`
      };
      
      const db = require('../config/database');
      db.query(
        'INSERT INTO activity_log (user_id, institution_id, action, action_type, description) VALUES (?, ?, ?, ?, ?)',
        [activityLog.user_id, activityLog.institution_id, activityLog.action, activityLog.action_type, activityLog.description],
        (logErr) => {
          if (logErr) console.error('Error logging activity:', logErr);
        }
      );
    }
    
    res.json({ 
      success: true,
      message: 'Staff member deleted successfully'
    });
  });
});

// ============ PROGRAM MANAGEMENT ============

// GET /api/institution/:institutionId/programs - Get all programs for an institution
router.get('/:institutionId/programs', (req, res) => {
  const { institutionId } = req.params;
  
  academicQueries.getInstitutionPrograms(institutionId, (err, results) => {
    if (err) {
      console.error('Error fetching institution programs:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    res.json(results);
  });
});

// POST /api/institution/:institutionId/programs - Add a new program
router.post('/:institutionId/programs', (req, res) => {
  const { institutionId } = req.params;
  const { program_name, program_code, user_id } = req.body;
  
  if (!program_name) {
    return res.status(400).json({ error: 'Program name is required' });
  }
  
  const programData = {
    program_name,
    program_code: program_code || '',
    institution_id: institutionId
  };
  
  academicQueries.addInstitutionProgram(programData, (err, result) => {
    if (err) {
      console.error('Error adding institution program:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Program already exists' });
      }
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    // Log activity if user_id is provided
    if (user_id) {
      const activityLog = {
        user_id: parseInt(user_id),
        institution_id: parseInt(institutionId),
        action: 'program_added',
        action_type: 'create',
        description: `Added program: ${program_name}`
      };
      
      const db = require('../config/database');
      db.query(
        'INSERT INTO activity_log (user_id, institution_id, action, action_type, description) VALUES (?, ?, ?, ?, ?)',
        [activityLog.user_id, activityLog.institution_id, activityLog.action, activityLog.action_type, activityLog.description],
        (logErr) => {
          if (logErr) console.error('Error logging activity:', logErr);
        }
      );
    }
    
    res.json({
      success: true,
      message: 'Program added successfully',
      program_id: result.programId
    });
  });
});

// DELETE /api/institution/programs/:programId - Delete a program
router.delete('/programs/:programId', (req, res) => {
  const { programId } = req.params;
  const { user_id, institution_id, program_name } = req.query;
  
  academicQueries.deleteInstitutionProgram(programId, (err, results) => {
    if (err) {
      console.error('Error deleting institution program:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    // Log activity if user_id and institution_id are provided
    if (user_id && institution_id) {
      const activityLog = {
        user_id: parseInt(user_id),
        institution_id: parseInt(institution_id),
        action: 'program_deleted',
        action_type: 'delete',
        description: `Deleted program: ${program_name || 'Unknown'}`
      };
      
      const db = require('../config/database');
      db.query(
        'INSERT INTO activity_log (user_id, institution_id, action, action_type, description) VALUES (?, ?, ?, ?, ?)',
        [activityLog.user_id, activityLog.institution_id, activityLog.action, activityLog.action_type, activityLog.description],
        (logErr) => {
          if (logErr) console.error('Error logging activity:', logErr);
        }
      );
    }
    
    res.json({ 
      success: true,
      message: 'Program deleted successfully'
    });
  });
});

// ============ CREDENTIAL MANAGEMENT ============

// DELETE /api/institution/credential/:credentialId - Delete a credential (set status to 'deleted')
router.delete('/credential/:credentialId', (req, res) => {
  const { credentialId } = req.params;
  
  academicQueries.deleteCredential(credentialId, (err, results) => {
    if (err) {
      console.error('Error deleting credential:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }
    
    res.json({ 
      success: true,
      message: 'Credential deleted successfully'
    });
  });
});

// ============ ACTIVITY LOG ============

// GET /api/institution/:institutionId/activity-logs - Get activity logs for an institution
router.get('/:institutionId/activity-logs', (req, res) => {
  const { institutionId } = req.params;
  const { action } = req.query;
  
  academicQueries.getActivityLogs(institutionId, action, (err, results) => {
    if (err) {
      console.error('Error fetching activity logs:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    res.json(results);
  });
});

// POST /api/institution/activity-logs - Create a new activity log entry
router.post('/activity-logs', (req, res) => {
  const { user_id, institution_id, action, action_type, description } = req.body;
  
  if (!user_id || !institution_id || !action || !action_type) {
    return res.status(400).json({ error: 'User ID, institution ID, action, and action_type are required' });
  }
  
  const logData = {
    user_id,
    institution_id,
    action,
    action_type,
    description: description || null
  };
  
  academicQueries.createActivityLog(logData, (err, result) => {
    if (err) {
      console.error('Error creating activity log:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    res.json({
      success: true,
      message: 'Activity logged successfully',
      log_id: result.insertId
    });
  });
});

// ============ BLOCKCHAIN CONTRACT INFO ============

// GET /api/institution/contract-address - Get deployed contract address
router.get('/contract-address', (req, res) => {
  // Use environment variable for Polygon Amoy deployment
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    return res.status(404).json({ error: 'Contract address not configured' });
  }
  
  res.json({ address: contractAddress });
});

// GET /api/institution/contract-abi - Get contract ABI
router.get('/contract-abi', (req, res) => {
  const contractData = loadContractData();
  if (!contractData) {
    return res.status(404).json({ error: 'Contract ABI not found' });
  }
  res.json({ abi: contractData.abi });
});

// GET /api/institution/contract-info - Debug endpoint to check contract configuration
router.get('/contract-info', (req, res) => {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const networkId = process.env.NETWORK_ID;
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
  const contractData = loadContractData();
  
  res.json({
    contractAddress,
    networkId,
    rpcUrl,
    hasABI: !!contractData?.abi,
    abiLength: contractData?.abi?.length || 0,
    polygonAmoyExplorer: contractAddress ? `https://amoy.polygonscan.com/address/${contractAddress}` : null
  });
});

// POST /api/institution/analyze-credential - Analyze credential file with OCR + AI
router.post('/analyze-credential', uploadTemp.single('credentialFile'), async (req, res) => {
  const uploadedFilePath = req.file ? req.file.path : null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }
    
    console.log('Analyzing credential file:', req.file.originalname);
    console.log('File path:', uploadedFilePath);
    console.log('File size:', req.file.size, 'bytes');
    
    // Step 1: Extract text with OCR (Tesseract)
    console.log('Step 1: Extracting text with OCR...');
    const extractedText = await tesseractService.extractTextFromImage(uploadedFilePath);
    console.log('OCR completed. Text length:', extractedText.length);
    
    // Step 2: Identify credential type from OCR text
    console.log('Step 2: Identifying credential type from OCR...');
    const ocrCredentialType = tesseractService.identifyCredentialType(extractedText);
    console.log('OCR identified type:', ocrCredentialType);
    
    // Step 3: Use Gemini AI for intelligent extraction
    console.log('Step 3: Analyzing with Gemini AI...');
    const aiResult = await geminiService.extractCredentialInfo(uploadedFilePath);
    
    let result;
    
    if (aiResult.success) {
      console.log('AI analysis successful');
      result = {
        success: true,
        data: {
          documentType: aiResult.data.documentType,
          recipientName: aiResult.data.recipientName,
          program: aiResult.data.program,
          institutionName: aiResult.data.institutionName,
          issueDate: aiResult.data.issueDate,
          studentId: aiResult.data.studentId,
          confidence: aiResult.data.confidence,
          notes: aiResult.data.notes,
          extractedText: extractedText.substring(0, 500), // First 500 chars for reference
          ocrCredentialType: ocrCredentialType
        },
        mode: 'ai'
      };
    } else {
      // Fallback to OCR-only mode
      console.log('AI analysis failed, using OCR-only mode');
      console.log('AI Error:', aiResult.error);
      
      result = {
        success: true,
        data: {
          documentType: ocrCredentialType,
          recipientName: null,
          program: null,
          institutionName: null,
          issueDate: null,
          studentId: null,
          confidence: 'Low',
          notes: 'AI analysis unavailable. Only credential type detected via OCR.',
          extractedText: extractedText.substring(0, 500),
          ocrCredentialType: ocrCredentialType
        },
        mode: 'ocr-only',
        aiError: aiResult.error,
        quotaExhausted: aiResult.quotaExhausted
      };
    }
    
    // Cleanup temporary file
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
      console.log('Temporary file cleaned up');
    }
    
    console.log('Analysis complete');
    res.json(result);
    
  } catch (error) {
    console.error('❌ Credential analysis error:', error);
    
    // Cleanup temporary file on error
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (cleanupErr) {
        console.error('Failed to cleanup temp file:', cleanupErr);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze credential: ' + error.message 
    });
  }
});

// GET /api/institution/transaction-history/:institutionId - Fetch transaction history with gas costs
router.get('/transaction-history/:institutionId', async (req, res) => {
  const { institutionId } = req.params;
  
  try {
    // Fetch transaction history from database
    academicQueries.getTransactionHistory(institutionId, async (err, transactions) => {
      if (err) {
        console.error('Error fetching transaction history:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch transaction history' });
      }
      
      // Fetch current POL price for cost calculations
      let polPriceUSD = 0.16; // Fallback price
      let polPricePHP = 9.0; // Fallback price
      
      try {
        const priceResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
          params: {
            ids: 'polygon-ecosystem-token',
            vs_currencies: 'usd,php'
          },
          timeout: 5000
        });
        
        const priceData = priceResponse.data['polygon-ecosystem-token'];
        if (priceData) {
          polPriceUSD = priceData.usd;
          polPricePHP = priceData.php;
        }
      } catch (priceErr) {
        console.error('Failed to fetch POL price, using fallback:', priceErr.message);
      }
      
      // Fetch gas details for each transaction from Polygon blockchain
      const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'https://polygon-mainnet.g.alchemy.com/v2/x_-JZb-YD_H8n3_11nOE-';
      
      const transactionsWithCosts = await Promise.all(
        transactions.map(async (tx) => {
          if (!tx.transaction_hash) {
            return {
              ...tx,
              gas_used: null,
              gas_price_gwei: null,
              gas_cost_pol: null,
              gas_cost_usd: null,
              gas_cost_php: null,
              error: 'No transaction hash'
            };
          }
          
          // If transaction costs are already stored in database, use them
          if (tx.gas_used && tx.gas_cost_pol) {
            return {
              ...tx,
              gas_used: tx.gas_used,
              gas_price_gwei: parseFloat(tx.gas_price_gwei),
              gas_cost_pol: parseFloat(tx.gas_cost_pol),
              gas_cost_usd: parseFloat(tx.gas_cost_usd),
              gas_cost_php: parseFloat(tx.gas_cost_php),
              pol_price_usd: parseFloat(tx.pol_price_usd),
              pol_price_php: parseFloat(tx.pol_price_php)
            };
          }
          
          // Otherwise, fetch from blockchain (for old transactions without stored costs)
          try {
            // Fetch transaction receipt from blockchain
            const receiptResponse = await axios.post(RPC_URL, {
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_getTransactionReceipt',
              params: [tx.transaction_hash]
            }, { timeout: 10000 });
            
            const receipt = receiptResponse.data?.result;
            
            if (!receipt) {
              return {
                ...tx,
                gas_used: null,
                gas_price_gwei: null,
                gas_cost_pol: null,
                gas_cost_usd: null,
                gas_cost_php: null,
                error: 'Transaction not found'
              };
            }
            
            // Fetch transaction details for gas price
            const txResponse = await axios.post(RPC_URL, {
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_getTransactionByHash',
              params: [tx.transaction_hash]
            }, { timeout: 10000 });
            
            const txDetails = txResponse.data?.result;
            
            if (!txDetails) {
              return {
                ...tx,
                gas_used: parseInt(receipt.gasUsed, 16),
                gas_price_gwei: null,
                gas_cost_pol: null,
                gas_cost_usd: null,
                gas_cost_php: null,
                error: 'Transaction details not found'
              };
            }
            
            // Calculate gas costs
            const gasUsed = parseInt(receipt.gasUsed, 16);
            const gasPriceWei = parseInt(txDetails.gasPrice, 16);
            const gasPriceGwei = gasPriceWei / 1e9;
            const gasCostPOL = (gasUsed * gasPriceWei) / 1e18; // Convert Wei to POL
            const gasCostUSD = gasCostPOL * polPriceUSD;
            const gasCostPHP = gasCostPOL * polPricePHP;
            
            return {
              ...tx,
              gas_used: gasUsed,
              gas_price_gwei: gasPriceGwei,
              gas_cost_pol: gasCostPOL,
              gas_cost_usd: gasCostUSD,
              gas_cost_php: gasCostPHP,
              pol_price_usd: polPriceUSD,
              pol_price_php: polPricePHP
            };
          } catch (blockchainErr) {
            console.error(`Error fetching blockchain data for tx ${tx.transaction_hash}:`, blockchainErr.message);
            return {
              ...tx,
              gas_used: null,
              gas_price_gwei: null,
              gas_cost_pol: null,
              gas_cost_usd: null,
              gas_cost_php: null,
              error: 'Blockchain fetch failed'
            };
          }
        })
      );
      
      res.json({
        success: true,
        transactions: transactionsWithCosts,
        pol_price_usd: polPriceUSD,
        pol_price_php: polPricePHP
      });
    });
  } catch (error) {
    console.error('Error in transaction history endpoint:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Cache for POL price to avoid hitting CoinGecko rate limits
let polPriceCache = {
  data: null,
  timestamp: 0,
  CACHE_DURATION: 60000 // 1 minute cache
};

// GET /api/institution/matic-price - Fetch current POL (Polygon) price with 24h change and PHP conversion
router.get('/matic-price', async (req, res) => {
  try {
    // Check if we have cached data that's still valid
    const now = Date.now();
    if (polPriceCache.data && (now - polPriceCache.timestamp) < polPriceCache.CACHE_DURATION) {
      console.log('Returning cached POL price data');
      return res.json(polPriceCache.data);
    }
    
    // Try CoinGecko simple price API first (more reliable, less rate limiting)
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'polygon-ecosystem-token',
        vs_currencies: 'usd,php',
        include_24hr_change: true,
        include_24hr_vol: true
      },
      timeout: 10000,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('CoinGecko Simple API Response:', JSON.stringify(response.data, null, 2));
    
    const data = response.data['polygon-ecosystem-token'];
    
    if (data && data.usd && data.php) {
      const responseData = { 
        success: true, 
        priceUSD: data.usd,
        pricePHP: data.php,
        change24h: data.usd_24h_change || 0,
        volume24h: data.usd_24h_vol || 0,
        lastUpdated: Math.floor(Date.now() / 1000)
      };
      
      // Update cache
      polPriceCache.data = responseData;
      polPriceCache.timestamp = now;
      
      res.json(responseData);
    } else {
      console.error('Invalid data structure from CoinGecko:', response.data);
      
      // If we have old cached data, return it instead of failing
      if (polPriceCache.data) {
        console.log('Returning stale cached data due to API error');
        return res.json(polPriceCache.data);
      }
      
      res.status(404).json({ 
        success: false, 
        error: 'Price data not available',
        debug: response.data
      });
    }
  } catch (error) {
    console.error('Failed to fetch POL price:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // If we have cached data (even if stale), return it instead of failing
    if (polPriceCache.data) {
      console.log('Returning cached data due to API error');
      return res.json(polPriceCache.data);
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch POL price from CoinGecko',
      details: error.message
    });
  }
});

module.exports = router;
