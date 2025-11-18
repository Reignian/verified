import { ethers } from 'ethers';

// API base URL - points to Railway backend
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://verified-production.up.railway.app/api'  // Production: Railway backend
  : 'http://localhost:3001/api';  // Development: localhost

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
        fetch(`${API_URL}/institution/contract-address`),
        fetch(`${API_URL}/institution/contract-abi`)
      ]);

      if (!addressResponse.ok || !abiResponse.ok) {
        throw new Error('Failed to fetch contract data');
      }

      const addressData = await addressResponse.json();
      const abiData = await abiResponse.json();

      this.contractAddress = addressData.address;
      this.contractABI = abiData.abi;

      // Create provider: prefer MetaMask, fallback to Polygon Mainnet or local JSON-RPC
      if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        // Fallback to Polygon Mainnet for read-only operations
        this.provider = new ethers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/x_-JZb-YD_H8n3_11nOE-');
      }


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

      // Send transaction with bytes32 parameters
      const tx = await contract.issueCredential(ipfsHashBytes32, studentIdBytes32);

      // Capture issuance start time right after MetaMask confirmation / tx submission
      const issuanceStart = Date.now();

      // Wait for confirmation (mining time is included in the overall duration from issuanceStart)
      const receipt = await tx.wait();

      // Parse events to get credential ID
      let credentialId = null;
      let parsedEvent = null;

      // Try to find and parse the CredentialIssued event
      for (const log of receipt.logs) {
        try {
          // Check if this log is from our contract
          if (log.address.toLowerCase() === this.contractAddress.toLowerCase()) {
            const parsed = contract.interface.parseLog(log);
            
            if (parsed.name === 'CredentialIssued') {
              parsedEvent = parsed;
              credentialId = parsed.args[0]; // credentialId is the first argument
              break;
            }
          }
        } catch (error) {
          
          // Try manual parsing for CredentialIssued event
          // Event signature: CredentialIssued(uint256,bytes32,address,bytes32)
          const credentialIssuedTopic = ethers.id('CredentialIssued(uint256,bytes32,address,bytes32)');
          
          if (log.topics && log.topics[0] === credentialIssuedTopic && log.address.toLowerCase() === this.contractAddress.toLowerCase()) {
            try {
              // Manual decode: credentialId is indexed (first topic after event signature)
              const decodedCredentialId = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], log.topics[1])[0];
              credentialId = decodedCredentialId;
              break;
            } catch (manualError) {
              // Silent fallback
            }
          }
        }
      }

      // Use transaction hash from the transaction object (more reliable)
      const transactionHash = tx.hash || receipt.transactionHash || receipt.hash;
      
      if (credentialId) {
        return {
          credentialId: credentialId.toString(),
          transactionHash: transactionHash,
          issuanceStart
        };
      } else {
        // If we can't find the event, still return success with transaction hash
        // The credential was likely issued successfully even if we can't parse the event
        
        // Try to get the credential ID from the contract's credential counter
        try {
          const credentialCounter = await contract.credentialCounter();
          
          return {
            credentialId: credentialCounter.toString(),
            transactionHash: transactionHash,
            issuanceStart
          };
        } catch (counterError) {
          // Return success without credential ID
          return {
            credentialId: 'unknown',
            transactionHash: transactionHash,
            issuanceStart
          };
        }
      }

    } catch (error) {
      // Don't log user cancellation errors - they're expected behavior
      if (error.code === 'ACTION_REJECTED' || 
          error.code === 4001 || 
          error.message?.includes('user rejected') ||
          error.message?.includes('User denied')) {
        // Silently throw the error without logging
        throw error;
      }
      
      // Log other unexpected errors
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
