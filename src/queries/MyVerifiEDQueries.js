const connection = require('../config/database');

// Get student name by student ID
const getStudentName = (studentId, callback) => {
  const query = `
    SELECT 
      s.student_id,
      s.first_name,
      s.middle_name,
      s.last_name,
      a.email,
      i.institution_name
    FROM student s
    INNER JOIN account a ON a.id = s.id
    LEFT JOIN institution i ON s.institution_id = i.id
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
      owner_acc.email AS owner_email
    FROM credential c
    LEFT JOIN credential_types ct ON c.credential_type_id = ct.id
    LEFT JOIN account sender_acc ON c.sender_id = sender_acc.id
    LEFT JOIN institution i ON sender_acc.id = i.id
    LEFT JOIN student owner ON owner.id = c.owner_id
    LEFT JOIN account owner_acc ON owner_acc.id = owner.id
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

// Fetch all non-deleted access codes for the student's linked group with active status
const getStudentAccessCodes = (studentId, callback) => {
  const sql = `
    SELECT 
      ca.access_code,
      ca.is_active,
      ca.created_at,
      ca.credential_id,
      COALESCE(ct.type_name, c.custom_type) AS credential_type
    FROM credential_access ca
    INNER JOIN credential c ON c.id = ca.credential_id
    LEFT JOIN credential_types ct ON c.credential_type_id = ct.id
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

    const findTargetSql = `
      SELECT a.id AS account_id
      FROM account a
      INNER JOIN student s ON s.id = a.id
      WHERE a.email = ? AND a.password = ? AND s.student_id = ?
      LIMIT 1
    `;

    connection.query(findTargetSql, [targetEmail, targetPassword, targetStudentNumber], (findErr, rows) => {
      if (findErr) return rollback(findErr);
      if (!rows || rows.length === 0) return rollback(new Error('Target account not found or credentials invalid.'));

      const targetAccountId = rows[0].account_id;
      if (Number(targetAccountId) === Number(currentAccountId)) return rollback(new Error('Cannot link the same account.'));

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
  unlinkAccount,
  linkAccounts,
  getStudentAccessCodes
};