require('dotenv').config();
const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.contractAddress = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Connect onchain
      const blockchainUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:7545';
      console.log('Connecting to blockchain:', blockchainUrl);
      
      // Create provider with staticNetwork to prevent spam retries
      this.provider = new ethers.JsonRpcProvider(blockchainUrl, undefined, {
        staticNetwork: true
      });
      
      // Test connection first
      await this.provider.getNetwork();
      console.log('Blockchain connection successful');
      
      // Load contract ABI and address
      const contractPath = path.join(__dirname, '../../build/contracts/CredentialRegistry.json');
      
      if (!fs.existsSync(contractPath)) {
        throw new Error('Contract not deployed. Run "truffle migrate" first.');
      }
      
      const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      const networkId = await this.provider.getNetwork().then(network => network.chainId.toString());
      
      if (!contractData.networks[networkId]) {
        throw new Error(`Contract not deployed on network ${networkId}`);
      }
      
      this.contractAddress = contractData.networks[networkId].address;
      this.contractABI = contractData.abi;
      
      console.log('Blockchain service initialized successfully');
      console.log('Contract address:', this.contractAddress);
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error.message);
      throw error;
    }
  }

  async issueCredential(ipfsCidHash, studentId, userWalletAddress) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service not initialized');
      }

      console.log('Issuing credential on blockchain...');
      console.log('IPFS Hash:', ipfsCidHash);
      console.log('Student ID:', studentId);
      console.log('Using wallet address:', userWalletAddress);

      // Create signer from user's wallet address (using Ganache accounts)
      const signer = await this.provider.getSigner(userWalletAddress);
      
      // Create contract instance with user's signer
      const contract = new ethers.Contract(
        this.contractAddress,
        this.contractABI,
        signer
      );

      // Call the smart contract
      const tx = await contract.issueCredential(ipfsCidHash, studentId);
      console.log('Transaction sent:', tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction mined:', receipt.transactionHash);
      
      // Get the credential ID from the transaction receipt
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
        return credentialId.toString();
      } else {
        throw new Error('CredentialIssued event not found in transaction receipt');
      }
      
    } catch (error) {
      console.error('Error issuing credential on blockchain:', error);
      throw error;
    }
  }

  async getCredential(credentialId, userWalletAddress) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service not initialized');
      }

      console.log('Getting credential from blockchain...');
      console.log('Credential ID:', credentialId);
      console.log('Using wallet address:', userWalletAddress);

      // Create signer from user's wallet address (using Ganache accounts)
      const signer = await this.provider.getSigner(userWalletAddress);
      
      // Create contract instance with user's signer
      const contract = new ethers.Contract(
        this.contractAddress,
        this.contractABI,
        signer
      );

      const credential = await contract.credentials(credentialId);
      return {
        ipfsCidHash: credential.ipfsCidHash,
        issuer: credential.issuer,
        studentId: credential.studentId,
        createdAt: credential.createdAt.toString()
      };
    } catch (error) {
      console.error('Error getting credential from blockchain:', error);
      throw error;
    }
  }
}

module.exports = new BlockchainService();
