const connection = require('../config/database');

// Get credential types from database
const getCredentialTypes = (callback) => {
  connection.query('SELECT id, type_name FROM credential_types', callback);
};

// Get students from database
const getStudents = (callback) => {
  const query = `
    SELECT s.id, s.student_id, s.first_name, s.last_name, a.public_address 
    FROM student s 
    JOIN account a ON s.id = a.id 
    WHERE a.account_type = 'student'
  `;
  connection.query(query, callback);
};

// Create new credential
const createCredential = (credentialData, callback) => {
  const { 
    credential_type_id, 
    owner_id, 
    sender_id, 
    ipfs_cid = 'default_cid', 
    ipfs_cid_hash = 'default_hash', 
    status = 'pending' 
  } = credentialData;
  
  const query = `
    INSERT INTO credential 
    (credential_type_id, owner_id, sender_id, ipfs_cid, ipfs_cid_hash, status) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  connection.query(query, [
    credential_type_id, 
    owner_id, 
    sender_id, 
    ipfs_cid, 
    ipfs_cid_hash, 
    status
  ], callback);
};

module.exports = {
  getCredentialTypes,
  getStudents,
  createCredential
};
