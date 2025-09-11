// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CredentialRegistry {
    
    // Simple struct to store only essential credential data
    struct Credential {
        string ipfsCidHash;
        address issuer;
        string studentId;
        uint256 createdAt;
    }
    
    // Mapping from credential ID to credential data
    mapping(uint256 => Credential) public credentials;
    
    // Counter for generating unique credential IDs
    uint256 public credentialCounter;
    
    // Event for credential issuance
    event CredentialIssued(uint256 credentialId, string studentId, address issuer, string ipfsCidHash);
    
    /**
     * @dev Issue a new credential
     * @param _ipfsCidHash IPFS hash of the credential file
     * @param _studentId Student identifier who owns the credential
     * @return credentialId The unique ID of the issued credential
     */
    function issueCredential(string memory _ipfsCidHash, string memory _studentId) 
        external 
        returns (uint256) 
    {
        credentialCounter++;
        
        credentials[credentialCounter] = Credential({
            ipfsCidHash: _ipfsCidHash,
            issuer: msg.sender,
            studentId: _studentId,
            createdAt: block.timestamp
        });
        
        emit CredentialIssued(credentialCounter, _studentId, msg.sender, _ipfsCidHash);
        
        return credentialCounter;
    }
}