// CredentialRegistryConfig.js
// Polygon Mainnet network configuration for your CredentialRegistry smart contract

export const CONTRACT_ADDRESS = "0xbdd6d750f644915280ef779fe7be6bc570c90fd1";

export const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "credentialId", "type": "uint256" },
      { "indexed": true, "internalType": "bytes32", "name": "studentId", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "issuer", "type": "address" },
      { "indexed": false, "internalType": "bytes32", "name": "ipfsCidHash", "type": "bytes32" }
    ],
    "name": "CredentialIssued",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "credentialCounter",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "credentials",
    "outputs": [
      { "internalType": "bytes32", "name": "ipfsCidHash", "type": "bytes32" },
      { "internalType": "address", "name": "issuer", "type": "address" },
      { "internalType": "bytes32", "name": "studentId", "type": "bytes32" },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "_ipfsCidHash", "type": "bytes32" },
      { "internalType": "bytes32", "name": "_studentId", "type": "bytes32" }
    ],
    "name": "issueCredential",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_credentialId", "type": "uint256" }],
    "name": "getCredential",
    "outputs": [
      { "internalType": "bytes32", "name": "ipfsCidHash", "type": "bytes32" },
      { "internalType": "address", "name": "issuer", "type": "address" },
      { "internalType": "bytes32", "name": "studentId", "type": "bytes32" },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_credentialId", "type": "uint256" }],
    "name": "verifyCredential",
    "outputs": [
      { "internalType": "bool", "name": "exists", "type": "bool" },
      { "internalType": "address", "name": "issuer", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export const NETWORK = {
  chainId: "0x89", // Polygon Mainnet chain ID (hex for 137)
  chainName: "Polygon Mainnet",
  nativeCurrency: {
    name: "POL",
    symbol: "POL",
    decimals: 18
  },
  rpcUrls: ["https://polygon-mainnet.g.alchemy.com/v2/x_-JZb-YD_H8n3_11nOE-"],
  blockExplorerUrls: ["https://polygonscan.com/"]
};
