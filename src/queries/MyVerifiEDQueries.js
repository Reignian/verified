const connection = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// Get student name by student ID
const getStudentName = (studentId, callback) => {
  const query = `
    SELECT 
      s.student_id,
      s.first_name,
      s.middle_name,
      s.last_name,
      a.email,
      i.institution_name,
      s.program_id,
      p.program_name,
      p.program_code
    FROM student s
    INNER JOIN account a ON a.id = s.id
    LEFT JOIN institution i ON s.institution_id = i.id
    LEFT JOIN program p ON s.program_id = p.id
    WHERE s.id = ?
  `;
  connection.query(query, [studentId], callback);
};

// Fetch linked accounts (same group as given account). Includes the requesting account.
const getLinkedAccounts = (accountId, callback) => {
  const sql = `
    SELECT 
      la2.group_id,
      s.id AS account_id,
      s.student_id,
      s.first_name,
      s.middle_name,
      s.last_name,
      a.email,
      i.institution_name
    FROM linked_accounts la1
    INNER JOIN linked_accounts la2 ON la2.group_id = la1.group_id
    INNER JOIN student s ON s.id = la2.student_id
    INNER JOIN account a ON a.id = s.id
    LEFT JOIN institution i ON s.institution_id = i.id
    WHERE la1.student_id = ?
    ORDER BY s.last_name, s.first_name
  `;
  connection.query(sql, [accountId], callback);
};
// Get student's credential count (including linked accounts in same group)
const getStudentCredentialCount = (studentId, callback) => {
  const query = `
    SELECT 
      COUNT(*) as total_credentials
    FROM credential c
    WHERE c.owner_id IN (
      SELECT la2.student_id
      FROM linked_accounts la1
      JOIN linked_accounts la2 ON la2.group_id = la1.group_id
      WHERE la1.student_id = ?
      UNION SELECT ?
    )
    AND c.status = 'blockchain_verified'
  `;
  connection.query(query, [studentId, studentId], callback);
};

// Get student credentials (including linked accounts) with aggregated active access codes
const getStudentCredentials = (studentId, callback) => {
  const query = `
    SELECT 
      c.id,
      COALESCE(ct.type_name, c.custom_type) AS type,
      c.custom_type,
      c.created_at AS date,
      c.status,
      c.ipfs_cid AS ipfs_hash,
      c.blockchain_id,
      i.institution_name AS issuer,
      ac.access_codes,
      ac.access_code_date,
      owner.student_id AS owner_student_id,
      owner.first_name AS owner_first_name,
      owner.last_name AS owner_last_name,
      owner_acc.email AS owner_email,
      c.program_id,
      p.program_name,
      p.program_code
    FROM credential c
    LEFT JOIN credential_types ct ON c.credential_type_id = ct.id
    LEFT JOIN account sender_acc ON c.sender_id = sender_acc.id
    LEFT JOIN institution i ON sender_acc.id = i.id
    LEFT JOIN student owner ON owner.id = c.owner_id
    LEFT JOIN account owner_acc ON owner_acc.id = owner.id
    LEFT JOIN program p ON c.program_id = p.id
    LEFT JOIN (
      SELECT credential_id, GROUP_CONCAT(access_code SEPARATOR ',') AS access_codes,
             MAX(created_at) AS access_code_date 
      FROM credential_access
      WHERE is_deleted = 0
      GROUP BY credential_id
    ) ac ON ac.credential_id = c.id
    WHERE c.owner_id IN (
      SELECT la2.student_id
      FROM linked_accounts la1
      JOIN linked_accounts la2 ON la2.group_id = la1.group_id
      WHERE la1.student_id = ?
      UNION SELECT ?
    )
    AND c.status != 'deleted'
    ORDER BY c.created_at DESC
  `;
  connection.query(query, [studentId, studentId], callback);
};

// NEW: Get student credentials for Student Management page (simplified view)
const getStudentCredentialsForManagement = (studentId, callback) => {
  const query = `
    SELECT 
      c.id,
      c.ipfs_cid,
      c.status,
      c.created_at as date_issued,
      c.blockchain_id,
      COALESCE(ct.type_name, c.custom_type) as credential_type
    FROM credential c
    LEFT JOIN credential_types ct ON c.credential_type_id = ct.id
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

// Update access code status
const updateAccessCodeStatus = (accessCode, isActive, callback) => {
  const query = 'UPDATE credential_access SET is_active = ? WHERE access_code = ? AND is_deleted = 0';
  connection.query(query, [isActive ? 1 : 0, accessCode], callback);
};

// Delete access code (mark as deleted)
const deleteAccessCode = (accessCode, callback) => {
  const query = 'UPDATE credential_access SET is_deleted = 1 WHERE access_code = ? AND is_deleted = 0';
  connection.query(query, [accessCode], callback);
};

// Generate multi-access code for multiple credentials
const generateMultiAccessCode = (studentId, credentialIds, accessCode, callback) => {
  if (!credentialIds || credentialIds.length < 2) {
    return callback(new Error('At least 2 credentials are required for multi-access code'));
  }

  connection.beginTransaction((txErr) => {
    if (txErr) return callback(txErr);

    const rollback = (err) => connection.rollback(() => callback(err));

    // 1. Insert new multi-access code (keep existing ones active, just like single access codes)
    const insertCodeQuery = 'INSERT INTO multi_access_code (access_code, student_id, is_active) VALUES (?, ?, 1)';
    connection.query(insertCodeQuery, [accessCode, studentId], (insertErr, insertResult) => {
      if (insertErr) return rollback(insertErr);

      const multiAccessCodeId = insertResult.insertId;

      // 2. Insert credential mappings
      const credentialMappings = credentialIds.map(credId => [multiAccessCodeId, credId]);
      const insertMappingsQuery = 'INSERT INTO multi_access_code_credentials (multi_access_code_id, credential_id) VALUES ?';
      
      connection.query(insertMappingsQuery, [credentialMappings], (mappingErr) => {
        if (mappingErr) return rollback(mappingErr);

        connection.commit((commitErr) => {
          if (commitErr) return rollback(commitErr);
          callback(null, { 
            success: true, 
            access_code: accessCode, 
            multi_access_code_id: multiAccessCodeId,
            credential_count: credentialIds.length 
          });
        });
      });
    });
  });
};

// Fetch all non-deleted access codes for the student's linked group with active status
const getStudentAccessCodes = (studentId, callback) => {
  const sql = `
    SELECT 
      ca.access_code,
      ca.is_active,
      ca.created_at,
      ca.credential_id,
      COALESCE(ct.type_name, c.custom_type) AS credential_type,
      i.institution_name
    FROM credential_access ca
    INNER JOIN credential c ON c.id = ca.credential_id
    LEFT JOIN credential_types ct ON c.credential_type_id = ct.id
    LEFT JOIN institution i ON i.id = c.sender_id
    WHERE ca.is_deleted = 0 AND c.owner_id IN (
      SELECT la2.student_id
      FROM linked_accounts la1
      JOIN linked_accounts la2 ON la2.group_id = la1.group_id
      WHERE la1.student_id = ?
      UNION SELECT ?
    )
    ORDER BY ca.created_at DESC
  `;
  connection.query(sql, [studentId, studentId], callback);
};

// Fetch all non-deleted multi-access codes for the student's linked group with credential details
const getStudentMultiAccessCodes = (studentId, callback) => {
  const sql = `
    SELECT 
      mac.id,
      mac.access_code,
      mac.is_active,
      mac.created_at,
      GROUP_CONCAT(
        CONCAT(
          COALESCE(ct.type_name, c.custom_type),
          CASE 
            WHEN i.institution_name IS NOT NULL AND i.institution_name != '' 
            THEN CONCAT(' - ', i.institution_name)
            ELSE ''
          END
        ) 
        SEPARATOR ', '
      ) AS credential_types,
      COUNT(macc.credential_id) AS credential_count
    FROM multi_access_code mac
    INNER JOIN multi_access_code_credentials macc ON macc.multi_access_code_id = mac.id
    INNER JOIN credential c ON c.id = macc.credential_id
    LEFT JOIN credential_types ct ON c.credential_type_id = ct.id
    LEFT JOIN institution i ON i.id = c.sender_id
    WHERE mac.is_deleted = 0 AND mac.student_id IN (
      SELECT la2.student_id
      FROM linked_accounts la1
      JOIN linked_accounts la2 ON la2.group_id = la1.group_id
      WHERE la1.student_id = ?
      UNION SELECT ?
    )
    GROUP BY mac.id, mac.access_code, mac.is_active, mac.created_at
    ORDER BY mac.created_at DESC
  `;
  connection.query(sql, [studentId, studentId], callback);
};

// Update multi-access code status (active/inactive)
const updateMultiAccessCodeStatus = (accessCode, isActive, callback) => {
  const sql = 'UPDATE multi_access_code SET is_active = ? WHERE access_code = ? AND is_deleted = 0';
  connection.query(sql, [isActive ? 1 : 0, accessCode], callback);
};

// Delete multi-access code (soft delete)
const deleteMultiAccessCode = (accessCode, callback) => {
  const sql = 'UPDATE multi_access_code SET is_deleted = 1 WHERE access_code = ? AND is_deleted = 0';
  connection.query(sql, [accessCode], callback);
};

// Unlink target account from the current user's link group
const unlinkAccount = (currentAccountId, targetAccountId, callback) => {
  if (!currentAccountId || !targetAccountId) return callback(new Error('Missing account IDs'));
  if (Number(currentAccountId) === Number(targetAccountId)) return callback(new Error('Cannot unlink the same account'));

  const lookupSql = 'SELECT student_id, group_id FROM linked_accounts WHERE student_id IN (?, ?)';
  connection.query(lookupSql, [currentAccountId, targetAccountId], (err, rows) => {
    if (err) return callback(err);

    let currentGroup = null;
    let targetGroup = null;
    for (const r of rows || []) {
      if (Number(r.student_id) === Number(currentAccountId)) currentGroup = r.group_id;
      if (Number(r.student_id) === Number(targetAccountId)) targetGroup = r.group_id;
    }

    if (!currentGroup || !targetGroup || currentGroup !== targetGroup) {
      return callback(new Error('Accounts are not linked in the same group'));
    }

    const delSql = 'DELETE FROM linked_accounts WHERE student_id = ? AND group_id = ?';
    connection.query(delSql, [targetAccountId, currentGroup], (delErr, result) => {
      if (delErr) return callback(delErr);
      callback(null, { success: true, group_id: currentGroup, removed_account_id: targetAccountId, affected: result.affectedRows });
    });
  });
};

// Link two student accounts into a shared group in linked_accounts
// Steps:
// 1) Validate target credentials (account.email/password) and student student_id
// 2) Determine existing group(s) for current and target; merge if both exist and differ
// 3) If none exist, create next group_id as MAX(group_id)+1
// 4) Ensure each student_id appears once (delete existing rows for the two accounts), then insert both with the selected group_id
const linkAccounts = (currentAccountId, targetEmail, targetPassword, targetStudentNumber, callback) => {
  const rollback = (err) => connection.rollback(() => callback(err));

  connection.beginTransaction((txErr) => {
    if (txErr) return callback(txErr);

    // First find the target account without password check
    const findTargetSql = `
      SELECT a.id AS account_id, a.password
      FROM account a
      INNER JOIN student s ON s.id = a.id
      WHERE a.email = ? AND s.student_id = ?
      LIMIT 1
    `;

    connection.query(findTargetSql, [targetEmail, targetStudentNumber], (findErr, rows) => {
      if (findErr) return rollback(findErr);
      if (!rows || rows.length === 0) return rollback(new Error('Target account not found or credentials invalid.'));

      const targetAccountId = rows[0].account_id;
      const hashedPassword = rows[0].password;
      
      if (Number(targetAccountId) === Number(currentAccountId)) return rollback(new Error('Cannot link the same account.'));

      // Verify password using bcrypt
      bcrypt.compare(targetPassword, hashedPassword, (compareErr, isMatch) => {
        if (compareErr) return rollback(compareErr);
        if (!isMatch) return rollback(new Error('Target account not found or credentials invalid.'));

      const groupLookupSql = 'SELECT student_id, group_id FROM linked_accounts WHERE student_id IN (?, ?)';
      connection.query(groupLookupSql, [currentAccountId, targetAccountId], (grpErr, grpRows) => {
        if (grpErr) return rollback(grpErr);

        let currentGroup = null;
        let targetGroup = null;
        for (const r of grpRows || []) {
          if (Number(r.student_id) === Number(currentAccountId)) currentGroup = r.group_id;
          if (Number(r.student_id) === Number(targetAccountId)) targetGroup = r.group_id;
        }

        const proceedWithGroup = (groupId) => {
          const deleteSql = 'DELETE FROM linked_accounts WHERE student_id IN (?, ?)';
          connection.query(deleteSql, [currentAccountId, targetAccountId], (delErr) => {
            if (delErr) return rollback(delErr);

            const insertSql = 'INSERT INTO linked_accounts (group_id, student_id) VALUES (?, ?), (?, ?)';
            connection.query(insertSql, [groupId, currentAccountId, groupId, targetAccountId], (insErr) => {
              if (insErr) return rollback(insErr);

              connection.commit((commitErr) => {
                if (commitErr) return rollback(commitErr);
                callback(null, { linked: true, group_id: groupId, target_account_id: targetAccountId });
              });
            });
          });
        };

        if (currentGroup && targetGroup && currentGroup !== targetGroup) {
          // Merge target group into current group
          const mergeSql = 'UPDATE linked_accounts SET group_id = ? WHERE group_id = ?';
          connection.query(mergeSql, [currentGroup, targetGroup], (mergeErr) => {
            if (mergeErr) return rollback(mergeErr);
            proceedWithGroup(currentGroup);
          });
        } else if (currentGroup || targetGroup) {
          proceedWithGroup(currentGroup || targetGroup);
        } else {
          const nextSql = 'SELECT COALESCE(MAX(group_id), 0) + 1 AS next_group_id FROM linked_accounts';
          connection.query(nextSql, [], (nextErr, nextRows) => {
            if (nextErr) return rollback(nextErr);
            const nextGroupId = (nextRows && nextRows[0] && nextRows[0].next_group_id) ? nextRows[0].next_group_id : 1;
            proceedWithGroup(nextGroupId);
          });
        }
      });
      }); // end of bcrypt.compare callback
    });
  });
};

// Change password for a student account
const changePassword = (accountId, currentPassword, newPassword, callback) => {
  // First get the hashed password from database
  const verifyQuery = 'SELECT password FROM account WHERE id = ? LIMIT 1';
  connection.query(verifyQuery, [accountId], (verifyErr, verifyResults) => {
    if (verifyErr) {
      return callback(verifyErr);
    }
    
    if (verifyResults.length === 0) {
      return callback(new Error('Account not found'));
    }
    
    // Use bcrypt to verify the current password
    bcrypt.compare(currentPassword, verifyResults[0].password, (compareErr, isMatch) => {
      if (compareErr) {
        return callback(compareErr);
      }
      
      if (!isMatch) {
        return callback(new Error('Current password is incorrect'));
      }
      
      // Hash the new password
      bcrypt.hash(newPassword, SALT_ROUNDS, (hashErr, hashedPassword) => {
        if (hashErr) {
          return callback(hashErr);
        }
        
        // Update the password with hashed version
        const updateQuery = 'UPDATE account SET password = ? WHERE id = ?';
        connection.query(updateQuery, [hashedPassword, accountId], (updateErr, updateResults) => {
          if (updateErr) {
            return callback(updateErr);
          }
          
          if (updateResults.affectedRows === 0) {
            return callback(new Error('Account not found'));
          }
          
          callback(null, { success: true, message: 'Password changed successfully' });
        });
      });
    });
  });
};

module.exports = {
  getStudentName,
  getLinkedAccounts,
  getStudentCredentialCount,
  getStudentCredentials,
  getStudentCredentialsForManagement,
  upsertCredentialAccessCode,
  updateAccessCodeStatus,
  deleteAccessCode,
  generateMultiAccessCode,
  getStudentMultiAccessCodes,
  updateMultiAccessCodeStatus,
  deleteMultiAccessCode,
  unlinkAccount,
  linkAccounts,
  getStudentAccessCodes,
  changePassword
};