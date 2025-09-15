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
    blockchain_id = null,
    status = 'pending' 
  } = credentialData;
  
  const query = `
    INSERT INTO credential 
    (credential_type_id, owner_id, sender_id, ipfs_cid, ipfs_cid_hash, blockchain_id, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  connection.query(query, [
    credential_type_id, 
    owner_id, 
    sender_id, 
    ipfs_cid, 
    ipfs_cid_hash, 
    blockchain_id,
    status
  ], callback);
};

// Get issued credentials with student details
const getIssuedCredentials = (callback) => {
  const query = `
    SELECT 
      c.id,
      CONCAT(s.first_name, ' ', s.last_name) as student_name,
      ct.type_name as credential_type,
      c.ipfs_cid,
      c.status,
      c.created_at as date_issued,
      c.blockchain_id
    FROM credential c
    JOIN student s ON c.owner_id = s.id
    JOIN credential_types ct ON c.credential_type_id = ct.id
    ORDER BY c.created_at DESC
  `;
  connection.query(query, callback);
};

// Get credential statistics
const getCredentialStats = (callback) => {
  const query = `
    SELECT 
      COUNT(*) as total_credentials,
      COUNT(CASE WHEN c.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_credentials_week
    FROM credential c
  `;
  connection.query(query, callback);
};

module.exports = {
  getCredentialTypes,
  getStudents,
  createCredential,
  getIssuedCredentials,
  getCredentialStats
};