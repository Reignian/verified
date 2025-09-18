// fileName: server.js

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
const pinataService = require('./src/services/pinataService');

const XLSX = require('xlsx');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = 3001;

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
  
  if (!userType) {
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
    
    // Validate that the selected user type matches the account type in database
    if (user.account_type !== userType) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        account_type: user.account_type,
        public_address: user.public_address
      }
    });
  });
});

app.post('/api/bulk-import-students', upload.single('studentFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
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

    const results = await academicQueries.bulkCreateStudents(normalizedData);
    
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

app.post('/api/upload-credential', upload.single('credentialFile'), async (req, res) => {
  const { credential_type_id, owner_id, sender_id } = req.body;
  
  if (!credential_type_id || !owner_id || !sender_id || !req.file) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const metadata = {
      name: `Credential_${credential_type_id}_${Date.now()}`,
      uploadedBy: `User_${sender_id}`,
      credentialType: credential_type_id
    };

    const pinataResult = await pinataService.uploadBufferToPinata(
      req.file.buffer, 
      req.file.originalname, 
      metadata
    );

    const credentialData = {
      credential_type_id,
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
        ipfs_url: `https://amethyst-tropical-jackal-879.mypinata.cloud/ipfs/${pinataResult.ipfsHash}`,
        status: 'Uploaded to IPFS only'
      });
    });

  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// NEW ENDPOINT: Add a new credential type
app.post('/api/credential-types', (req, res) => {
  const { type_name } = req.body;

  if (!type_name || type_name.trim() === '') {
    return res.status(400).json({ error: 'Credential type name is required' });
  }
  
  const trimmedTypeName = type_name.trim();

  academicQueries.findCredentialTypeByName(trimmedTypeName, (err, existingType) => {
    if (err) {
      console.error('Error finding credential type:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // If type already exists, just return it without creating a new one
    if (existingType) {
      return res.status(200).json(existingType);
    }

    // Otherwise, create the new type
    academicQueries.createCredentialType(trimmedTypeName, (err, result) => {
      if (err) {
        console.error('Error creating credential type:', err);
        return res.status(500).json({ error: 'Database error while creating type' });
      }
      res.status(201).json({ id: result.insertId, type_name: trimmedTypeName });
    });
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

app.get('/api/students', (req, res) => {
  academicQueries.getStudents((err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

app.get('/api/issued-credentials', (req, res) => {
  academicQueries.getIssuedCredentials((err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

app.get('/api/credential-stats', (req, res) => {
  academicQueries.getCredentialStats((err, results) => {
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

// Verify credential by access code
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
      return res.status(404).json({ error: 'No credential found with this access code' });
    }
    
    res.json({
      success: true,
      credential: result
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});