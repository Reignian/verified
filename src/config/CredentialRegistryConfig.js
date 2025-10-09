// CredentialRegistryConfig.js
// Polygon Amoy network configuration for your CredentialRegistry smart contract

export const CONTRACT_ADDRESS = "0xdb33974fcf60a843cf1dc3003811bb72158974c4";

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
  chainId: "0x13882", // Polygon Amoy chain ID (hex for 80002)
  chainName: "Polygon Amoy Testnet",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18
  },
  rpcUrls: ["https://polygon-amoy.g.alchemy.com/v2/x_-JZb-YD_H8n3_11nOE-"],
  blockExplorerUrls: ["https://amoy.polygonscan.com/"]
};
