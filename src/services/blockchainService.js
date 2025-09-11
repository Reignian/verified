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
      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }

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

      // Create provider using MetaMask
      this.provider = new ethers.BrowserProvider(window.ethereum);

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
      console.log('IPFS Hash:', ipfsHash);
      console.log('Student ID:', studentId);

      // Convert IPFS hash and student ID to bytes32 for gas optimization
      const ipfsHashBytes32 = ethers.encodeBytes32String(ipfsHash.slice(0, 31)); // Take first 31 chars to fit in bytes32
      const studentIdBytes32 = ethers.encodeBytes32String(String(studentId).slice(0, 31));
      
      console.log('IPFS Hash as bytes32:', ipfsHashBytes32);
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
}

export default new BlockchainService();
