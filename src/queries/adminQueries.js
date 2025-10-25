const connection = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// Get all academic institutions
const getAllInstitutions = (callback) => {
  const query = `
    SELECT 
      a.id,
      a.username,
      a.email,
      a.status,
      a.created_at,
      i.institution_name,
      (SELECT COUNT(*) FROM student WHERE institution_id = i.id) as student_count,
      (SELECT COUNT(*) FROM credential WHERE sender_id = a.id) as issued_credentials
    FROM account a
    JOIN institution i ON a.id = i.id
    WHERE a.account_type = 'institution'
    ORDER BY 
      CASE a.status 
        WHEN 'pending' THEN 1 
        WHEN 'approved' THEN 2 
        WHEN 'rejected' THEN 3 
      END,
      a.created_at DESC
  `;
  connection.query(query, callback);
};

// Get pending institution requests
const getPendingInstitutions = (callback) => {
  const query = `
    SELECT 
      a.id,
      a.username,
      a.email,
      a.status,
      a.created_at,
      i.institution_name
    FROM account a
    JOIN institution i ON a.id = i.id
    WHERE a.account_type = 'institution' AND a.status = 'pending'
    ORDER BY a.created_at DESC
  `;
  connection.query(query, callback);
};

// Approve institution account
const approveInstitution = (institutionId, callback) => {
  const query = `
    UPDATE account 
    SET status = 'approved' 
    WHERE id = ? AND account_type = 'institution'
  `;
  connection.query(query, [institutionId], callback);
};

// Reject institution account
const rejectInstitution = (institutionId, callback) => {
  const query = `
    UPDATE account 
    SET status = 'rejected' 
    WHERE id = ? AND account_type = 'institution'
  `;
  connection.query(query, [institutionId], callback);
};

// Create new institution account
const createInstitution = (institutionData, callback) => {
  // Hash password before storing
  bcrypt.hash(institutionData.password, SALT_ROUNDS, (err, hashedPassword) => {
    if (err) return callback(err);

    connection.getConnection((err, conn) => {
      if (err) return callback(err);

      conn.beginTransaction((err) => {
        if (err) {
          conn.release();
          return callback(err);
        }

        // First insert into account table with hashed password and status 'approved'
        const accountQuery = `
          INSERT INTO account (account_type, username, password, email, status, created_at) 
          VALUES ('institution', ?, ?, ?, 'approved', NOW())
        `;
        
        conn.query(accountQuery, [
          institutionData.username,
          hashedPassword,
          institutionData.email
        ], (err, accountResult) => {
          if (err) {
            return conn.rollback(() => {
              conn.release();
              callback(err);
            });
          }

          const accountId = accountResult.insertId;

          // Insert into institution table with public_address set to NULL
          const institutionQuery = `INSERT INTO institution (id, institution_name, public_address) VALUES (?, ?, NULL)`;
          
          conn.query(institutionQuery, [accountId, institutionData.institution_name], (err) => {
            if (err) {
              return conn.rollback(() => {
                conn.release();
                callback(err);
              });
            }

            conn.commit((err) => {
              if (err) {
                return conn.rollback(() => {
                  conn.release();
                  callback(err);
                });
              }
              conn.release();
              callback(null, { insertId: accountId });
            });
          });
        });
      });
    });
  }); // end of bcrypt.hash callback
};

// Update institution
const updateInstitution = (institutionId, updateData, callback) => {
  connection.getConnection((err, conn) => {
    if (err) return callback(err);

    conn.beginTransaction((err) => {
      if (err) {
        conn.release();
        return callback(err);
      }

      // Update account table
      const accountQuery = `
        UPDATE account 
        SET username = ?, email = ? 
        WHERE id = ? AND account_type = 'institution'
      `;
      
      conn.query(accountQuery, [
        updateData.username,
        updateData.email,
        institutionId
      ], (err, accountResult) => {
        if (err) {
          return conn.rollback(() => {
            conn.release();
            callback(err);
          });
        }

        // Update institution table
        const institutionQuery = `
          UPDATE institution 
          SET institution_name = ? 
          WHERE id = ?
        `;
        
        conn.query(institutionQuery, [updateData.institution_name, institutionId], (err) => {
          if (err) {
            return conn.rollback(() => {
              conn.release();
              callback(err);
            });
          }

          conn.commit((err) => {
            if (err) {
              return conn.rollback(() => {
                conn.release();
                callback(err);
              });
            }
            conn.release();
            callback(null, { affectedRows: accountResult.affectedRows });
          });
        });
      });
    });
  });
};

// Delete institution
const deleteInstitution = (institutionId, callback) => {
  const query = `
    UPDATE account 
    SET account_type = '', username = CONCAT(username, '_deleted_', UNIX_TIMESTAMP()) 
    WHERE id = ? AND account_type = 'institution'
  `;
  connection.query(query, [institutionId], callback);
};

// Get all credentials with detailed info
const getAllCredentials = (callback) => {
  const query = `
    SELECT 
      c.id,
      c.credential_type_id,
      c.custom_type,
      c.ipfs_cid,
      c.status,
      c.blockchain_id,
      c.created_at,
      c.updated_at,
      COALESCE(ct.type_name, c.custom_type) as credential_type,
      owner_student.first_name as owner_first_name,
      owner_student.last_name as owner_last_name,
      owner_student.student_id,
      sender_institution.institution_name,
      (SELECT COUNT(*) FROM credential_verifications WHERE credential_id = c.id) as verification_count,
      (SELECT MAX(verification_timestamp) FROM credential_verifications WHERE credential_id = c.id) as last_verified
    FROM credential c
    LEFT JOIN credential_types ct ON c.credential_type_id = ct.id
    LEFT JOIN account owner_account ON c.owner_id = owner_account.id
    LEFT JOIN student owner_student ON owner_account.id = owner_student.id
    LEFT JOIN account sender_account ON c.sender_id = sender_account.id
    LEFT JOIN institution sender_institution ON sender_account.id = sender_institution.id
    ORDER BY c.created_at DESC
  `;
  connection.query(query, callback);
};

// Get credential verification statistics
const getCredentialVerificationStats = (callback) => {
  const query = `
    SELECT 
      c.id as credential_id,
      COALESCE(ct.type_name, c.custom_type) as credential_type,
      owner_student.first_name as owner_first_name,
      owner_student.last_name as owner_last_name,
      owner_student.student_id,
      sender_institution.institution_name,
      COUNT(cv.id) as verification_count,
      MAX(cv.verification_timestamp) as last_verified,
      MIN(cv.verification_timestamp) as first_verified
    FROM credential c
    LEFT JOIN credential_types ct ON c.credential_type_id = ct.id
    LEFT JOIN account owner_account ON c.owner_id = owner_account.id
    LEFT JOIN student owner_student ON owner_account.id = owner_student.id
    LEFT JOIN account sender_account ON c.sender_id = sender_account.id
    LEFT JOIN institution sender_institution ON sender_account.id = sender_institution.id
    LEFT JOIN credential_verifications cv ON c.id = cv.credential_id
    WHERE cv.id IS NOT NULL
    GROUP BY c.id, ct.type_name, c.custom_type, owner_student.first_name, 
             owner_student.last_name, owner_student.student_id, sender_institution.institution_name
    ORDER BY verification_count DESC, last_verified DESC
  `;
  connection.query(query, callback);
};

// Get system statistics
const getSystemStats = (callback) => {
  const queries = [
    'SELECT COUNT(*) as total_institutions FROM account WHERE account_type = "institution"',
    'SELECT COUNT(*) as total_students FROM account WHERE account_type = "student"',
    'SELECT COUNT(*) as total_credentials FROM credential',
    'SELECT COUNT(*) as verified_credentials FROM credential WHERE status = "blockchain_verified"',
    'SELECT COUNT(*) as total_verifications FROM credential_verifications',
    'SELECT COUNT(*) as unread_messages FROM contact_messages WHERE status = "unread"'
  ];
  
  Promise.all(queries.map(query => {
    return new Promise((resolve, reject) => {
      connection.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  })).then(results => {
    callback(null, {
      total_institutions: results[0].total_institutions,
      total_students: results[1].total_students,
      total_credentials: results[2].total_credentials,
      verified_credentials: results[3].verified_credentials,
      total_verifications: results[4].total_verifications,
      unread_messages: results[5].unread_messages
    });
  }).catch(err => callback(err));
};

// Contact Messages
const getAllContactMessages = (callback) => {
  const query = `
    SELECT id, name, email, user_type, message, status, message_type, account_id, created_at, updated_at
    FROM contact_messages
    ORDER BY 
      CASE message_type 
        WHEN 'signup_request' THEN 1 
        WHEN 'contact' THEN 2 
      END,
      CASE status 
        WHEN 'unread' THEN 1 
        WHEN 'read' THEN 2 
        WHEN 'replied' THEN 3 
      END,
      created_at DESC
  `;
  connection.query(query, callback);
};

const updateContactMessageStatus = (messageId, status, callback) => {
  const query = `
    UPDATE contact_messages 
    SET status = ?, updated_at = NOW() 
    WHERE id = ?
  `;
  connection.query(query, [status, messageId], callback);
};

const deleteContactMessage = (messageId, callback) => {
  const query = `DELETE FROM contact_messages WHERE id = ?`;
  connection.query(query, [messageId], callback);
};

const createContactMessage = (messageData, callback) => {
  // Handle both old format (backward compatibility) and new format with tracking
  const hasTrackingData = messageData.deviceFingerprint || messageData.ipAddress || messageData.userAgent;
  
  if (hasTrackingData) {
    const query = `
      INSERT INTO contact_messages (name, email, user_type, message, status, created_at, device_fingerprint, ip_address, user_agent)
      VALUES (?, ?, ?, ?, 'unread', NOW(), ?, ?, ?)
    `;
    connection.query(query, [
      messageData.name,
      messageData.email,
      messageData.user_type,
      messageData.message,
      messageData.deviceFingerprint || null,
      messageData.ipAddress || null,
      messageData.userAgent || null
    ], callback);
  } else {
    // Backward compatibility - old format
    const query = `
      INSERT INTO contact_messages (name, email, user_type, message, status, created_at)
      VALUES (?, ?, ?, ?, 'unread', NOW())
    `;
    connection.query(query, [
      messageData.name,
      messageData.email,
      messageData.user_type,
      messageData.message
    ], callback);
  }
};

// Track credential verification
const logCredentialVerification = (verificationData, callback) => {
  const query = `
    INSERT INTO credential_verifications (credential_id, access_code, verifier_ip, verifier_user_agent, verification_timestamp, status)
    VALUES (?, ?, ?, ?, NOW(), ?)
  `;
  connection.query(query, [
    verificationData.credential_id,
    verificationData.access_code,
    verificationData.verifier_ip,
    verificationData.verifier_user_agent,
    verificationData.status
  ], callback);
};

module.exports = {
  getAllInstitutions,
  getPendingInstitutions,
  approveInstitution,
  rejectInstitution,
  createInstitution,
  updateInstitution,
  deleteInstitution,
  getAllCredentials,
  getCredentialVerificationStats,
  getSystemStats,
  getAllContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
  createContactMessage,
  logCredentialVerification
};