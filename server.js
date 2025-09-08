const express = require('express');
const cors = require('cors');
const multer = require('multer');
const academicQueries = require('./src/queries/academicInstitutionQueries');
const authQueries = require('./src/queries/authQueries');
const pinataService = require('./src/services/pinataService');

const app = express();
const PORT = 3001;

// Configure multer for file uploads (store in memory)
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Test Pinata connection on server start
pinataService.testConnection().catch(console.error);

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  authQueries.getUserByUsername(username, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const user = results[0];
    
    // Check if account is institution type
    if (user.account_type !== 'institution') {
      return res.status(403).json({ error: 'Access denied. Institution account required.' });
    }
    
    // Simple password comparison (no hashing)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Login successful
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

// Upload credential endpoint with file upload to Pinata
app.post('/api/upload-credential', upload.single('credentialFile'), async (req, res) => {
  const { credential_type_id, owner_id, sender_id } = req.body;
  
  if (!credential_type_id || !owner_id || !sender_id) {
    return res.status(400).json({ 
      error: 'Credential type ID, owner ID, and sender ID are required' 
    });
  }

  if (!req.file) {
    return res.status(400).json({ 
      error: 'Credential file is required' 
    });
  }

  try {
    // Upload file to Pinata IPFS
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

    // Prepare credential data with IPFS hash
    const credentialData = {
      credential_type_id,
      owner_id,
      sender_id,
      ipfs_cid: pinataResult.ipfsHash,
      ipfs_cid_hash: pinataResult.ipfsHash, // Using same hash for both fields
      status: 'uploaded'
    };
    
    // Save to database
    academicQueries.createCredential(credentialData, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        message: 'Credential uploaded successfully',
        credential_id: results.insertId,
        ipfs_hash: pinataResult.ipfsHash,
        ipfs_url: `https://amethyst-tropical-jackal-879.mypinata.cloud/ipfs/${pinataResult.ipfsHash}`
      });
    });

  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    res.status(500).json({ 
      error: 'Failed to upload file to IPFS. Please try again.' 
    });
  }
});

// Get credential types
app.get('/api/credential-types', (req, res) => {
  academicQueries.getCredentialTypes((err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Get students
app.get('/api/students', (req, res) => {
  academicQueries.getStudents((err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
