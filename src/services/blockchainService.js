import { ethers } from 'ethers';

// API base URL - same as apiService.js
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // In production, use relative path (same domain)
  : 'http://localhost:3001/api';  // In development, use localhost

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.contractAddress = null;
    this.contractABI = null;
  }

  async initialize() {
    try {
      // Get contract address and ABI from backend
      const [addressResponse, abiResponse] = await Promise.all([
        fetch(`${API_URL}/contract-address`),
        fetch(`${API_URL}/contract-abi`)
      ]);

      if (!addressResponse.ok || !abiResponse.ok) {
        throw new Error('Failed to fetch contract data');
      }

      const addressData = await addressResponse.json();
      const abiData = await abiResponse.json();

      this.contractAddress = addressData.address;
      this.contractABI = abiData.abi;

      // Create provider: prefer MetaMask, fallback to local JSON-RPC
      if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        this.provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
      }

      console.log('Frontend blockchain service initialized');
      console.log('Contract address:', this.contractAddress);

    } catch (error) {
      console.error('Failed to initialize frontend blockchain service:', error);
      throw error;
    }
  }

  async issueCredential(ipfsHash, studentId) {
    try {
      if (!this.provider || !this.contractAddress || !this.contractABI) {
        await this.initialize();
      }

      // Get signer from MetaMask
      const signer = await this.provider.getSigner();
      
      // Create contract instance
      const contract = new ethers.Contract(
        this.contractAddress,
        this.contractABI,
        signer
      );

      console.log('Issuing credential on blockchain...');
      console.log('IPFS input (CID or sha256 hex):', ipfsHash);
      console.log('Student ID (string input):', studentId);

      // Prepare IPFS hash as raw bytes32 (sha256 of the CID)
      let ipfsHashBytes32;
      if (typeof ipfsHash === 'string') {
        const trimmed = ipfsHash.trim();
        if (trimmed.startsWith('0x') && trimmed.length === 66) {
          // Already a 32-byte hex with 0x prefix
          ipfsHashBytes32 = trimmed.toLowerCase();
        } else if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
          // 64-char hex without 0x
          ipfsHashBytes32 = '0x' + trimmed.toLowerCase();
        } else {
          // Fallback: compute sha256 over the provided CID string
          ipfsHashBytes32 = ethers.sha256(ethers.toUtf8Bytes(trimmed));
        }
      } else {
        throw new Error('Invalid ipfsHash parameter; expected a hex string or CID string');
      }

      // Student identifier: still encoded as bytes32 string (truncated to 31 chars to fit)
      const studentIdBytes32 = ethers.encodeBytes32String(String(studentId).slice(0, 31));
      
      console.log('IPFS SHA-256 (bytes32):', ipfsHashBytes32);
      console.log('Student ID as bytes32:', studentIdBytes32);

      // Send transaction with bytes32 parameters
      const tx = await contract.issueCredential(ipfsHashBytes32, studentIdBytes32);
      console.log('Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.transactionHash);

      // Parse events to get credential ID
      const event = receipt.logs.find(log => {
        try {
          return contract.interface.parseLog(log).name === 'CredentialIssued';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsedEvent = contract.interface.parseLog(event);
        const credentialId = parsedEvent.args[0];
        console.log('Credential issued with ID:', credentialId.toString());
        
        return {
          credentialId: credentialId.toString(),
          transactionHash: receipt.transactionHash
        };
      } else {
        throw new Error('CredentialIssued event not found');
      }

    } catch (error) {
      console.error('Error issuing credential:', error);
      throw error;
    }
  }

  async getContract(useSigner = false) {
    try {
      if (!this.provider || !this.contractAddress || !this.contractABI) {
        await this.initialize();
      }
      if (useSigner) {
        const signer = await this.provider.getSigner();
        return new ethers.Contract(this.contractAddress, this.contractABI, signer);
      }
      // Read-only contract instance using provider
      return new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
    } catch (error) {
      console.error('Failed to get contract instance:', error);
      throw error;
    }
  }

  async fetchOnChainCredential(credentialId) {
    try {
      const contract = await this.getContract(false);
      const result = await contract.getCredential(credentialId);
      // result: [ipfsCidHash, issuer, studentId, createdAt]
      const ipfsCidHashBytes32 = result[0];
      const issuer = result[1];
      const studentIdBytes = result[2];
      const createdAt = result[3];
      
      let studentIdStr = '';
      try {
        studentIdStr = ethers.decodeBytes32String(studentIdBytes);
      } catch {}

      return {
        // bytes32 SHA-256 of original CID as hex string
        ipfsCidHashHex: typeof ipfsCidHashBytes32 === 'string' 
          ? ipfsCidHashBytes32 
          : ethers.hexlify(ipfsCidHashBytes32),
        issuer,
        studentIdBytes,
        studentId: studentIdStr,
        createdAt: Number(createdAt),
        createdAtDate: new Date(Number(createdAt) * 1000)
      };
    } catch (error) {
      console.error('Error fetching on-chain credential:', error);
      throw error;
    }
  }

  async verifyOnChainCredential(credentialId) {
    try {
      const contract = await this.getContract(false);
      const result = await contract.verifyCredential(credentialId);
      // result: [exists, issuer]
      const exists = result[0];
      const issuer = result[1];
      return { exists, issuer };
    } catch (error) {
      console.error('Error verifying on-chain credential:', error);
      throw error;
    }
  }
}

export default new BlockchainService();
