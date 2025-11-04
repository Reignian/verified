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
const testRoutes = require('./src/routes/testRoutes');

const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 3001;

// CORS Configuration - Allow Netlify frontend and local development
const allowedOrigins = [
  'https://verifi-ed.netlify.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

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
    // Use environment variables for blockchain configuration
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:7545';
    const networkId = process.env.NETWORK_ID || '1337';
    
    blockchainProvider = new ethers.JsonRpcProvider(rpcUrl);
    await blockchainProvider.getNetwork();
    
    // For Polygon Mainnet or Amoy, use the contract address from environment
    if (networkId === '137' || networkId === '80002') {
      // Polygon Mainnet (137) or Amoy (80002) - use deployed contract address
      contractAddress = process.env.CONTRACT_ADDRESS;
      contractData = loadContractData();
      
      if (contractAddress && contractData) {
        // For server-side operations, we'll use read-only provider
        // Transactions will be handled by frontend MetaMask
        contract = new ethers.Contract(contractAddress, contractData.abi, blockchainProvider);
        console.log(`Blockchain connected to Polygon ${networkId === '137' ? 'Mainnet' : 'Amoy'}`);
        console.log('Contract address:', contractAddress);
      }
    } else {
      // Local Ganache setup
      contractData = loadContractData();
      if (contractData && contractData.networks[networkId]) {
        contractAddress = contractData.networks[networkId].address;
        const signer = await blockchainProvider.getSigner(0);
        contract = new ethers.Contract(contractAddress, contractData.abi, signer);
        console.log('Blockchain connected to local Ganache');
      }
    }
  } catch (error) {
    console.log('Blockchain connection failed:', error.message);
  }
}

initBlockchain();

// Mount route modules (organized by page/dashboard)
app.use('/api/public', publicRoutes);           // HomePage - Contact & Verification
app.use('/api/student', studentRoutes);         // Student Dashboard (MyVerifiED)
app.use('/api/institution', institutionRoutes); // Institution Dashboard
app.use('/api/auth', authRoutes);               // Login (shared)
app.use('/api/admin', adminRoutes);             // Admin Dashboard
app.use('/api/test', testRoutes);               // Test endpoints (Gemini API, etc.)

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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
