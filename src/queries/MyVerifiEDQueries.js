const connection = require('../config/database');

// Get student name by student ID
const getStudentName = (studentId, callback) => {
  const query = `
    SELECT 
      s.student_id,
      s.first_name,
      s.middle_name,
      s.last_name
    FROM student s
    WHERE s.id = ?
  `;
  connection.query(query, [studentId], callback);
};

// Get student's credential count
const getStudentCredentialCount = (studentId, callback) => {
  const query = `
    SELECT 
      COUNT(*) as total_credentials
    FROM credential c
    WHERE c.owner_id = ?
  `;
  connection.query(query, [studentId], callback);
};

// Get student credentials with all active access codes aggregated
const getStudentCredentials = (studentId, callback) => {
  const query = `
    SELECT 
      c.id,
      ct.type_name AS type,
      c.custom_type,
      c.created_at AS date,
      c.status,
      c.ipfs_cid AS ipfs_hash,
      c.blockchain_id,
      i.institution_name AS issuer,
      ac.access_codes
    FROM credential c
    LEFT JOIN credential_types ct ON c.credential_type_id = ct.id
    LEFT JOIN account sender_acc ON c.sender_id = sender_acc.id
    LEFT JOIN institution i ON sender_acc.id = i.id
    LEFT JOIN (
      SELECT credential_id, GROUP_CONCAT(access_code SEPARATOR ',') AS access_codes
      FROM credential_access
      WHERE is_active = 1
      GROUP BY credential_id
    ) ac ON ac.credential_id = c.id
    WHERE c.owner_id = ?
    ORDER BY c.created_at DESC
  `;
  connection.query(query, [studentId], callback);
};

// Insert a new credential access code without deactivating older codes
const upsertCredentialAccessCode = (credentialId, accessCode, callback) => {
  const insertSql = 'INSERT INTO credential_access (credential_id, access_code, is_active) VALUES (?, ?, 1)';
  connection.query(insertSql, [credentialId, accessCode], (insertErr, insertResult) => {
    if (insertErr) return callback(insertErr);
    callback(null, insertResult);
  });
};

module.exports = {
  getStudentName,
  getStudentCredentialCount,
  getStudentCredentials,
  upsertCredentialAccessCode
};