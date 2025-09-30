// fileName: server.js (Updated with admin routes)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { ethers } = require('ethers');
const academicQueries = require('./src/queries/academicInstitutionQueries');
const authQueries = require('./src/queries/authQueries');
const myVerifiEDQueries = require('./src/queries/MyVerifiEDQueries');
const verificationQueries = require('./src/queries/verificationQueries');
const adminQueries = require('./src/queries/adminQueries'); // NEW
const pinataService = require('./src/services/pinataService');

const XLSX = require('xlsx');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = process.env.BACKEND_PORT;

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

let blockchainProvider = null;
let contract = null;
let contractAddress = null;
let contractData = null;

function loadContractData() {
  const contractPath = path.join(__dirname, 'build/contracts/CredentialRegistry.json');
  if (!fs.existsSync(contractPath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  } catch (error) {
    return null;
  }
}

async function initBlockchain() {
  try {
    blockchainProvider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
    await blockchainProvider.getNetwork();
    contractData = loadContractData();
    if (contractData && contractData.networks['1337']) {
      contractAddress = contractData.networks['1337'].address;
      const signer = await blockchainProvider.getSigner(0);
      contract = new ethers.Contract(contractAddress, contractData.abi, signer);
      console.log('Blockchain connected');
    }
  } catch (error) {
    console.log('Blockchain connection failed');
  }
}

initBlockchain();

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
      // Add a fallback for unsupported types
      throw new Error(`Unsupported file type: ${mimetype}. Please upload a supported document (PDF, Word, Excel, CSV, TXT).`);
    }
    
    // For text-based formats that are parsed here
    return parseTextContent(textContent);
  } catch (error) {
    // Re-throw the specific error from the blocks above
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

app.post('/api/login', (req, res) => {
  const { username, password, userType } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  // For admin login, userType is not required
  if (!userType && username !== 'admin') {
    return res.status(400).json({ error: 'User type selection required' });
  }
  
  authQueries.getUserByUsername(username, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = results[0];
    
    if (user.password !== password || user.username !== username) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Special handling for admin login
    if (user.account_type === 'admin') {
      return res.json({
        message: 'Admin login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          account_type: user.account_type
        }
      });
    }
    
    // Validate that the selected user type matches the account type in database
    if (user.account_type !== userType) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }
    
    // For institution accounts, fetch public_address from institution table
    if (user.account_type === 'institution') {
      const db = require('./src/config/database');
      db.query('SELECT public_address FROM institution WHERE id = ?', [user.id], (instErr, instResults) => {
        if (instErr) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        const publicAddress = instResults && instResults[0] ? instResults[0].public_address : null;
        
        return res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            account_type: user.account_type,
            public_address: publicAddress
          }
        });
      });
    } else {
      // For student accounts, no public_address needed
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          account_type: user.account_type,
          public_address: null
        }
      });
    }
  });
});

// NEW: Contact form submission
app.post('/api/contact', (req, res) => {
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

// ================= ADMIN ROUTES =================

// Get system statistics for admin dashboard
app.get('/api/admin/stats', (req, res) => {
  adminQueries.getSystemStats((err, stats) => {
    if (err) {
      console.error('Error fetching system stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(stats);
  });
});

// Get all institutions for admin management
app.get('/api/admin/institutions', (req, res) => {
  adminQueries.getAllInstitutions((err, results) => {
    if (err) {
      console.error('Error fetching institutions:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Create new institution
app.post('/api/admin/institutions', (req, res) => {
  const { username, password, email, institution_name } = req.body;
  
  if (!username || !password || !email || !institution_name) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  adminQueries.createInstitution({ username, password, email, institution_name }, (err, result) => {
    if (err) {
      console.error('Error creating institution:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      return res.status(500).json({ error: 'Failed to create institution' });
    }
    
    res.json({
      success: true,
      message: 'Institution created successfully',
      id: result.insertId
    });
  });
});

// Update institution
app.put('/api/admin/institutions/:id', (req, res) => {
  const { id } = req.params;
  const { username, email, institution_name } = req.body;
  
  if (!username || !email || !institution_name) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  adminQueries.updateInstitution(id, { username, email, institution_name }, (err, result) => {
    if (err) {
      console.error('Error updating institution:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      return res.status(500).json({ error: 'Failed to update institution' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    
    res.json({
      success: true,
      message: 'Institution updated successfully'
    });
  });
});

// Delete institution (soft delete)
app.delete('/api/admin/institutions/:id', (req, res) => {
  const { id } = req.params;
  
  adminQueries.deleteInstitution(id, (err, result) => {
    if (err) {
      console.error('Error deleting institution:', err);
      return res.status(500).json({ error: 'Failed to delete institution' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    
    res.json({
      success: true,
      message: 'Institution deleted successfully'
    });
  });
});

// Get all credentials for admin monitoring
app.get('/api/admin/credentials', (req, res) => {
  adminQueries.getAllCredentials((err, results) => {
    if (err) {
      console.error('Error fetching all credentials:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Get credential verification statistics
app.get('/api/admin/verification-stats', (req, res) => {
  adminQueries.getCredentialVerificationStats((err, results) => {
    if (err) {
      console.error('Error fetching verification stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Get all contact messages
app.get('/api/admin/contact-messages', (req, res) => {
  adminQueries.getAllContactMessages((err, results) => {
    if (err) {
      console.error('Error fetching contact messages:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Update contact message status
app.put('/api/admin/contact-messages/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['unread', 'read', 'replied'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  adminQueries.updateContactMessageStatus(id, status, (err, result) => {
    if (err) {
      console.error('Error updating contact message status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({
      success: true,
      message: 'Message status updated'
    });
  });
});

// Delete contact message
app.delete('/api/admin/contact-messages/:id', (req, res) => {
  const { id } = req.params;
  
  adminQueries.deleteContactMessage(id, (err, result) => {
    if (err) {
      console.error('Error deleting contact message:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  });
});

// ================= END ADMIN ROUTES =================

// Add single student account
app.post('/api/add-student/:institutionId', (req, res) => {
  const { institutionId } = req.params;
  const { student_id, first_name, middle_name, last_name, username, email, password } = req.body;

  if (!institutionId) {
    return res.status(400).json({ error: 'Institution ID is required' });
  }

  if (!student_id || !first_name || !last_name || !username || !email || !password) {
    return res.status(400).json({ error: 'All required fields must be provided' });
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

      const studentData = { student_id, first_name, middle_name, last_name, username, email, password };

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

app.post('/api/bulk-import-students/:institutionId', upload.single('studentFile'), async (req, res) => {
  const { institutionId } = req.params;
  
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

app.get('/api/students', (req, res) => {
  // This could return all students or redirect to require institution ID
  res.status(400).json({ 
    error: 'Institution ID required. Use /api/students/:institutionId instead.',
    deprecated: true 
  });
});

app.get('/api/issued-credentials', (req, res) => {
  res.status(400).json({ 
    error: 'Institution ID required. Use /api/issued-credentials/:institutionId instead.',
    deprecated: true 
  });
});

app.get('/api/credential-stats', (req, res) => {
  res.status(400).json({ 
    error: 'Institution ID required. Use /api/credential-stats/:institutionId instead.',
    deprecated: true 
  });
});

app.post('/api/bulk-import-students', upload.single('studentFile'), async (req, res) => {
  res.status(400).json({ 
    error: 'Institution ID required. Use /api/bulk-import-students/:institutionId instead.',
    deprecated: true 
  });
});

app.post('/api/upload-credential', upload.single('credentialFile'), async (req, res) => {
  const { credential_type_id, owner_id, sender_id, custom_type } = req.body;
  
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
      credential_type_id: custom_type ? null : credential_type_id,
      custom_type: custom_type || null,
      owner_id,
      sender_id,
      ipfs_cid: pinataResult.ipfsHash,
      ipfs_cid_hash: crypto.createHash('sha256').update(pinataResult.ipfsHash).digest('hex'),
      status: 'uploaded'
    };
    
    academicQueries.createCredential(credentialData, (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        message: 'Credential uploaded successfully',
        credential_id: results.insertId,
        ipfs_hash: pinataResult.ipfsHash,
        ipfs_cid_hash: credentialData.ipfs_cid_hash,
        ipfs_url: `https://amethyst-tropical-jackal-879.mypinata.cloud/ipfs/${pinataResult.ipfsHash}`,
        status: 'Uploaded to IPFS only'
      });
    });

  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Link student accounts into a single group
app.post('/api/link-account', (req, res) => {
  const { current_account_id, target_email, target_password, target_student_id } = req.body;

  if (!current_account_id || !target_email || !target_password || !target_student_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  myVerifiEDQueries.linkAccounts(
    Number(current_account_id),
    String(target_email).trim(),
    String(target_password),
    String(target_student_id).trim(),
    (err, result) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'Linking failed' });
      }
      res.json({
        success: true,
        message: 'Accounts linked successfully',
        group_id: result.group_id,
        target_account_id: result.target_account_id
      });
    }
  );
});

// NEW: Get recent custom credential type
app.get('/api/recent-custom-type', (req, res) => {
  academicQueries.getRecentCustomType((err, customType) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ custom_type: customType });
  });
});


app.get('/api/credential-types', (req, res) => {
  academicQueries.getCredentialTypes((err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

app.get('/api/institution/:accountId/name', (req, res) => {
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

app.get('/api/students/:institutionId', (req, res) => {
  const { institutionId } = req.params;
  
  academicQueries.getStudents(institutionId, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

app.get('/api/issued-credentials/:institutionId', (req, res) => {
  const { institutionId } = req.params;
  
  academicQueries.getIssuedCredentials(institutionId, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

app.get('/api/credential-stats/:institutionId', (req, res) => {
  const { institutionId } = req.params;
  
  academicQueries.getCredentialStats(institutionId, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results[0]);
  });
});

app.get('/api/contract-address', (req, res) => {
  if (!contractData || !contractData.networks['1337']) {
    return res.status(404).json({ error: 'Contract not deployed' });
  }
  res.json({ address: contractData.networks['1337'].address });
});

app.get('/api/contract-abi', (req, res) => {
  if (!contractData) {
    return res.status(404).json({ error: 'Contract not deployed' });
  }
  res.json({ abi: contractData.abi });
});

// Get student name
app.get('/api/student/:studentId/name', (req, res) => {
  const { studentId } = req.params;
  
  myVerifiEDQueries.getStudentName(studentId, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(results[0]);
  });
});

// Get student credential count
app.get('/api/student/:studentId/credential-count', (req, res) => {
  const { studentId } = req.params;
  
  myVerifiEDQueries.getStudentCredentialCount(studentId, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results[0] || { total_credentials: 0 });
  });
});

// Get student credentials
app.get('/api/student/:studentId/credentials', (req, res) => {
  const { studentId } = req.params;
  
  myVerifiEDQueries.getStudentCredentials(studentId, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results || []);
  });
});

// Get student's access codes with active status
app.get('/api/student/:studentId/access-codes', (req, res) => {
  const { studentId } = req.params;
  
  myVerifiEDQueries.getStudentAccessCodes(studentId, (err, results) => {
    if (err) {
      console.error('Error fetching student access codes:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results || []);
  });
});

// Get linked accounts for a given account ID
app.get('/api/linked-accounts', (req, res) => {
  const { accountId } = req.query;

  if (!accountId) {
    return res.status(400).json({ error: 'accountId is required' });
  }

  myVerifiEDQueries.getLinkedAccounts(Number(accountId), (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    return res.json(results || []);
  });
});

// Unlink a target account from the current user's link group
app.delete('/api/unlink-account', (req, res) => {
  const { current_account_id, target_account_id, current_password } = req.body;

  if (!current_account_id || !target_account_id || !current_password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const db = require('./src/config/database');
    const pwSql = 'SELECT 1 FROM account WHERE id = ? AND password = ? LIMIT 1';
    db.query(pwSql, [Number(current_account_id), String(current_password)], (pwErr, pwRows) => {
      if (pwErr) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!pwRows || pwRows.length === 0) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      myVerifiEDQueries.unlinkAccount(
        Number(current_account_id),
        Number(target_account_id),
        (err, result) => {
          if (err) {
            return res.status(400).json({ error: err.message || 'Unlink failed' });
          }
          res.json({ success: true, ...result });
        }
      );
    });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/update-blockchain-id', (req, res) => {
  const { credential_id, blockchain_id } = req.body;
  
  if (!credential_id || !blockchain_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const db = require('./src/config/database');
    const query = 'UPDATE credential SET blockchain_id = ?, status = ? WHERE id = ?';
    
    db.query(query, [blockchain_id, 'blockchain_verified', credential_id], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Credential not found' });
      }
      
      res.json({ 
        message: 'Blockchain ID updated',
        credential_id,
        blockchain_id 
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// UPDATED: Verify credential by access code with tracking
app.post('/api/verify-credential', (req, res) => {
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

// Delete access code (mark as deleted)
app.delete('/api/delete-access-code', (req, res) => {
  const { access_code } = req.body;
  
  if (!access_code) {
    return res.status(400).json({ error: 'Access code is required' });
  }
  
  myVerifiEDQueries.deleteAccessCode(access_code, (err, result) => {
    if (err) {
      console.error('Error deleting access code:', err);
      return res.status(500).json({ error: 'Database error occurred' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Access code not found' });
    }
    
    res.json({
      success: true,
      message: 'Access code deleted successfully'
    });
  });
});

// Update access code status
app.put('/api/update-access-code-status', (req, res) => {
  const { access_code, is_active } = req.body;
  
  if (!access_code || is_active === undefined) {
    return res.status(400).json({ error: 'Access code and status are required' });
  }
  
  myVerifiEDQueries.updateAccessCodeStatus(access_code, is_active, (err, result) => {
    if (err) {
      console.error('Error updating access code status:', err);
      return res.status(500).json({ error: 'Database error occurred' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Access code not found' });
    }
    
    res.json({
      success: true,
      message: 'Access code status updated successfully'
    });
  });
});

// Generate a new access code for a credential
app.post('/api/generate-access-code', (req, res) => {
  const { credential_id } = req.body;

  if (!credential_id) {
    return res.status(400).json({ error: 'credential_id is required' });
  }

  try {
    const db = require('./src/config/database');

    // Generate a 6-character alphanumeric code (A-Z, 0-9)
    const generateRandomCode = (len = 6) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let out = '';
      for (let i = 0; i < len; i++) {
        const idx = crypto.randomInt(0, chars.length);
        out += chars[idx];
      }
      return out;
    };

    // Ensure uniqueness with a few attempts
    const ensureUniqueCode = (attempt = 0, maxAttempts = 10) => {
      const candidate = generateRandomCode(6);
      db.query('SELECT 1 FROM credential_access WHERE access_code = ? LIMIT 1', [candidate], (chkErr, rows) => {
        if (chkErr) {
          console.error('Error checking access code uniqueness:', chkErr);
          return res.status(500).json({ error: 'Database error occurred' });
        }
        if (rows && rows.length > 0) {
          if (attempt + 1 >= maxAttempts) {
            return res.status(500).json({ error: 'Failed to generate unique access code' });
          }
          return ensureUniqueCode(attempt + 1, maxAttempts);
        }
        // Insert when unique
        myVerifiEDQueries.upsertCredentialAccessCode(Number(credential_id), candidate, (insErr) => {
          if (insErr) {
            console.error('Error generating access code:', insErr);
            return res.status(500).json({ error: 'Database error occurred' });
          }
          return res.json({ success: true, access_code: candidate });
        });
      });
    };

    ensureUniqueCode();
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/student/:studentId/credentials-management', (req, res) => {
  const { studentId } = req.params;
  
  myVerifiEDQueries.getStudentCredentialsForManagement(studentId, (err, results) => {
    if (err) {
      console.error('Error fetching student credentials for management:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results || []);
  });
});

// Serve React build (same-origin deployment) only in production when build output exists
const clientBuildPath = path.join(__dirname, 'build');
const clientIndexPath = path.join(clientBuildPath, 'index.html');
if (process.env.NODE_ENV === 'production' && fs.existsSync(clientIndexPath)) {
  app.use(express.static(clientBuildPath));
  // SPA Fallback: send index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(clientIndexPath);
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});