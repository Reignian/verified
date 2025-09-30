// fileName: server.js (Refactored - Thin Orchestrator)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { ethers } = require('ethers');

// Import route modules (organized by page/dashboard)
const publicRoutes = require('./src/routes/publicRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const institutionRoutes = require('./src/routes/institutionRoutes');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();
const PORT = process.env.BACKEND_PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Blockchain initialization (kept in main server for shared state)
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

// Mount route modules (organized by page/dashboard)
app.use('/api/public', publicRoutes);           // HomePage - Contact & Verification
app.use('/api/student', studentRoutes);         // Student Dashboard (MyVerifiED)
app.use('/api/institution', institutionRoutes); // Institution Dashboard
app.use('/api/auth', authRoutes);               // Login (shared)
app.use('/api/admin', adminRoutes);             // Admin Dashboard

// Deprecated endpoints (for backward compatibility warnings)
app.get('/api/students', (req, res) => {
  res.status(400).json({ 
    error: 'Institution ID required. Use /api/students/:institutionId instead.',
    deprecated: true 
  });
});

app.get('/api/issued-credentials', (req, res) => {
  res.status(400).json({ 
    error: 'Institution ID required. Use /api/institutions/:institutionId/issued-credentials instead.',
    deprecated: true 
  });
});

app.get('/api/credential-stats', (req, res) => {
  res.status(400).json({ 
    error: 'Institution ID required. Use /api/institutions/:institutionId/credential-stats instead.',
    deprecated: true 
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
  console.log('📁 Routes organized by page:');
  console.log('  - /api/public      → HomePage (Contact & Verification)');
  console.log('  - /api/student     → Student Dashboard (MyVerifiED)');
  console.log('  - /api/institution → Institution Dashboard');
  console.log('  - /api/auth        → Login (shared)');
  console.log('  - /api/admin       → Admin Dashboard');
});
