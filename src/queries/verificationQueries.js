const connection = require('../config/database');

/**
 * Fetch credential data for verification (single access code)
 * @param {string} accessCode - The access code to verify
 * @param {function} callback - Callback function
 */
const getCredentialData = (accessCode, callback) => {
  const query = `
    SELECT 
      c.id,
      c.ipfs_cid,
      c.blockchain_id,
      c.status,
      c.created_at AS date_issued,
      COALESCE(ct.type_name, c.custom_type) AS credential_type,
      CONCAT(s.first_name, ' ', s.last_name) AS recipient_name,
      s.student_id,
      inst.institution_name AS issuer_name,
      inst.public_address AS issuer_public_address,
      (
        SELECT GROUP_CONCAT(ia.public_address SEPARATOR ',')
        FROM institution_addresses ia
        WHERE ia.institution_id = inst.id
      ) AS institution_addresses,
      ca.access_code,
      c.program_id,
      p.program_name,
      p.program_code
    FROM credential c
    LEFT JOIN credential_types ct ON c.credential_type_id = ct.id
    JOIN student s ON c.owner_id = s.id
    JOIN institution inst ON c.sender_id = inst.id
    LEFT JOIN program p ON c.program_id = p.id
    JOIN credential_access ca ON ca.credential_id = c.id
    WHERE ca.access_code = ?
      AND ca.is_active = 1
      AND c.status IN ('blockchain_verified', 'uploaded')
      AND c.status != 'deleted'
    LIMIT 1
  `;

  connection.query(query, [accessCode], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0] || null);
  });
};

/**
 * Fetch multiple credentials for multi-access code verification
 * @param {string} accessCode - The multi-access code to verify
 * @param {function} callback - Callback function
 */
const getMultiCredentialData = (accessCode, callback) => {
  const query = `
    SELECT 
      c.id,
      c.ipfs_cid,
      c.blockchain_id,
      c.status,
      c.created_at AS date_issued,
      COALESCE(ct.type_name, c.custom_type) AS credential_type,
      CONCAT(s.first_name, ' ', s.last_name) AS recipient_name,
      s.student_id,
      inst.institution_name AS issuer_name,
      inst.public_address AS issuer_public_address,
      (
        SELECT GROUP_CONCAT(ia.public_address SEPARATOR ',')
        FROM institution_addresses ia
        WHERE ia.institution_id = inst.id
      ) AS institution_addresses,
      mac.access_code,
      c.program_id,
      p.program_name,
      p.program_code
    FROM multi_access_code mac
    INNER JOIN multi_access_code_credentials macc ON macc.multi_access_code_id = mac.id
    INNER JOIN credential c ON c.id = macc.credential_id
    LEFT JOIN credential_types ct ON c.credential_type_id = ct.id
    JOIN student s ON c.owner_id = s.id
    JOIN institution inst ON c.sender_id = inst.id
    LEFT JOIN program p ON c.program_id = p.id
    WHERE mac.access_code = ?
      AND mac.is_active = 1
      AND mac.is_deleted = 0
      AND c.status IN ('blockchain_verified', 'uploaded')
      AND c.status != 'deleted'
    ORDER BY c.created_at DESC
  `;

  connection.query(query, [accessCode], (err, results) => {
    if (err) return callback(err);
    callback(null, results || []);
  });
};


module.exports = {
  getCredentialData,
  getMultiCredentialData
};
