// fileName: verificationQueries.js

const connection = require('../config/database');

/**
 * Fetch credential data for verification
 * @param {string} verificationInput - The input to verify (IPFS CID, blockchain ID, or credential ID)
 * @param {function} callback - Callback function
 */
const getCredentialData = (verificationInput, callback) => {
  const query = `
    SELECT 
      c.id,
      c.ipfs_cid,
      c.blockchain_id,
      c.status,
      c.created_at AS date_issued,
      ct.type_name AS credential_type,
      CONCAT(s.first_name, ' ', s.last_name) AS recipient_name,
      s.student_id,
      inst.institution_name AS issuer_name,
      inst.public_address AS issuer_public_address,
      ca.access_code
    FROM credential c
    JOIN credential_types ct ON c.credential_type_id = ct.id
    JOIN student s ON c.owner_id = s.id
    JOIN institution inst ON c.sender_id = inst.id
    JOIN credential_access ca ON ca.credential_id = c.id
    WHERE ca.access_code = ?
      AND ca.is_active = 1
      AND c.status IN ('blockchain_verified', 'uploaded')
    LIMIT 1
  `;

  connection.query(query, [verificationInput], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0] || null);
  });
};


module.exports = {
  getCredentialData
};
