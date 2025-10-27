// fileName: institutionRoutes.js (Consolidated by Institution Dashboard Page)
// All routes used by AcademicInstitution dashboard

const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const academicQueries = require('../queries/academicInstitutionQueries');
const myVerifiEDQueries = require('../queries/MyVerifiEDQueries');
const pinataService = require('../services/pinataService');
const XLSX = require('xlsx');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

const upload = multer({ storage: multer.memoryStorage() });

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

      academicQueries.addStudent(studentData, institutionId, (err, result) => {
        if (err) {
          console.error('Error adding student:', err);
          return res.status(500).json({ error: 'Failed to create student account' });
        }

        res.json({
          success: true,
          message: 'Student account created successfully',
          student: result
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
        blockchain_id: blockchain_id, // Credential ID
        transaction_hash: transaction_hash, // Transaction hash for reference
        status: 'Blockchain verified and uploaded to IPFS'
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

module.exports = router;
