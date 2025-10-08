const fs = require('fs');
const path = require('path');

// Update the contract configuration for Polygon Amoy
const contractPath = path.join(__dirname, '../build/contracts/CredentialRegistry.json');

if (fs.existsSync(contractPath)) {
  try {
    const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    
    // Add Polygon Amoy network configuration
    if (!contractData.networks) {
      contractData.networks = {};
    }
    
    contractData.networks['80002'] = {
      events: {},
      links: {},
      address: '0xc49f7ab5A9aB01eab6b7581DEdD0261460cbFEC8',
      transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000000'
    };
    
    // Write updated configuration
    fs.writeFileSync(contractPath, JSON.stringify(contractData, null, 2));
    console.log('Updated CredentialRegistry.json with Polygon Amoy configuration');
    console.log('Contract Address:', '0xc49f7ab5A9aB01eab6b7581DEdD0261460cbFEC8');
    console.log('Network ID:', '80002');
    
  } catch (error) {
    console.error('Error updating contract configuration:', error.message);
  }
} else {
  console.error('CredentialRegistry.json not found. Please compile your contracts first.');
}
