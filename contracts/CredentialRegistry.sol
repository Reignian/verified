// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CredentialRegistry {
    
    struct Credential {
        bytes32 ipfsCidHash;
        address issuer;
        bytes32 studentId;
        uint256 createdAt;
    }
    
    // Mapping from credential ID to credential data
    mapping(uint256 => Credential) public credentials;
    
    // Counter for generating unique credential IDs
    uint256 public credentialCounter;
    
    // Event for credential issuance
    event CredentialIssued(
        uint256 indexed credentialId, 
        bytes32 indexed studentId, 
        address indexed issuer, 
        bytes32 ipfsCidHash
    );
    
    function issueCredential(bytes32 _ipfsCidHash, bytes32 _studentId) 
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
    
    function getCredential(uint256 _credentialId) 
        external 
        view 
        returns (bytes32 ipfsCidHash, address issuer, bytes32 studentId, uint256 createdAt) 
    {
        Credential memory cred = credentials[_credentialId];
        return (cred.ipfsCidHash, cred.issuer, cred.studentId, cred.createdAt);
    }
    
    function verifyCredential(uint256 _credentialId) 
        external 
        view 
        returns (bool exists, address issuer) 
    {
        Credential memory cred = credentials[_credentialId];
        exists = cred.createdAt > 0; // If createdAt is set, credential exists
        issuer = cred.issuer;
    }
}