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
const pinataService = require('./src/services/pinataService');

const app = express();
const PORT = 3001;

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Blockchain setup
let blockchainProvider = null;
let contract = null;
let contractAddress = null;
let contractData = null;

// Helper function to load contract data
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

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
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

// Upload credential
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

// Get credential types
app.get('/api/credential-types', (req, res) => {
  academicQueries.getCredentialTypes((err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Get students
app.get('/api/students', (req, res) => {
  academicQueries.getStudents((err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Get issued credentials
app.get('/api/issued-credentials', (req, res) => {
  academicQueries.getIssuedCredentials((err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Get credential statistics
app.get('/api/credential-stats', (req, res) => {
  academicQueries.getCredentialStats((err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results[0]);
  });
});

// Get contract address
app.get('/api/contract-address', (req, res) => {
  if (!contractData || !contractData.networks['1337']) {
    return res.status(404).json({ error: 'Contract not deployed' });
  }
  
  res.json({ address: contractData.networks['1337'].address });
});

// Get contract ABI
app.get('/api/contract-abi', (req, res) => {
  if (!contractData) {
    return res.status(404).json({ error: 'Contract not deployed' });
  }
  
  res.json({ abi: contractData.abi });
});

// Update blockchain ID
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});