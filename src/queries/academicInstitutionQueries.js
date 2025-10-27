// fileName: academicInstitutionQueries.js

const connection = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10; // bcrypt salt rounds

const getCredentialTypes = (callback) => {
  connection.query('SELECT id, type_name FROM credential_types', callback);
};

// NEW: Get the most recent custom credential type
const getRecentCustomType = (callback) => {
  const query = `
    SELECT custom_type 
    FROM credential 
    WHERE custom_type IS NOT NULL AND custom_type != '' 
    ORDER BY created_at DESC 
    LIMIT 1
  `;
  connection.query(query, (err, results) => {
    if (err) return callback(err);
    callback(null, results[0] ? results[0].custom_type : null);
  });
};

// UPDATED: Get students filtered by institution
const getStudents = (institutionId, callback) => {
  const query = `
    SELECT 
      s.id, 
      s.student_id, 
      s.first_name, 
      s.middle_name,
      s.last_name,
      s.program_id,
      p.program_name,
      p.program_code
    FROM student s 
    JOIN account a ON s.id = a.id 
    LEFT JOIN program p ON s.program_id = p.id
    WHERE a.account_type = 'student' AND s.institution_id = ?
  `;
  connection.query(query, [institutionId], callback);
};

// NEW: Get institution name by account ID
const getInstitutionName = (accountId, callback) => {
  const query = `
    SELECT i.institution_name 
    FROM institution i 
    WHERE i.id = ?
  `;
  connection.query(query, [accountId], callback);
};

// Get institution public address by account ID
const getInstitutionPublicAddress = (accountId, callback) => {
  const query = `
    SELECT i.public_address 
    FROM institution i 
    WHERE i.id = ?
  `;
  connection.query(query, [accountId], callback);
};

// Get all institution addresses with history
const getInstitutionAddresses = (institutionId, callback) => {
  const query = `
    SELECT 
      ia.id,
      ia.public_address,
      ia.created_at,
      CASE 
        WHEN ia.public_address = i.public_address THEN 1
        ELSE 0
      END AS is_current
    FROM institution_addresses ia
    JOIN institution i ON i.id = ia.institution_id
    WHERE ia.institution_id = ?
    ORDER BY is_current DESC, ia.created_at DESC
  `;
  connection.query(query, [institutionId], callback);
};

// Update institution public address by account ID
// Also creates a record in institution_addresses table for historical tracking
const updateInstitutionPublicAddress = (accountId, publicAddress, callback) => {
  // Get a connection from the pool for transaction
  connection.getConnection((err, conn) => {
    if (err) {
      return callback(err);
    }

    // Start transaction
    conn.beginTransaction((transErr) => {
      if (transErr) {
        conn.release();
        return callback(transErr);
      }

      // Step 1: Update the primary public_address in institution table
      const updateQuery = `
        UPDATE institution 
        SET public_address = ? 
        WHERE id = ?
      `;
      
      conn.query(updateQuery, [publicAddress, accountId], (updateErr, updateResult) => {
        if (updateErr) {
          return conn.rollback(() => {
            conn.release();
            callback(updateErr);
          });
        }

        // Step 2: Check if this address already exists for this institution
        const checkQuery = `
          SELECT id 
          FROM institution_addresses 
          WHERE institution_id = ? AND public_address = ?
          LIMIT 1
        `;
        
        conn.query(checkQuery, [accountId, publicAddress], (checkErr, checkResults) => {
          if (checkErr) {
            return conn.rollback(() => {
              conn.release();
              callback(checkErr);
            });
          }

          // If address already exists in history, skip insert
          if (checkResults && checkResults.length > 0) {
            // Address already exists, just commit the institution table update
            return conn.commit((commitErr) => {
              conn.release();
              if (commitErr) {
                return callback(commitErr);
              }
              callback(null, { 
                updateResult,
                message: 'Public address updated successfully (already in history)'
              });
            });
          }

          // Step 3: Insert new address into institution_addresses table
          const insertQuery = `
            INSERT INTO institution_addresses 
            (institution_id, public_address) 
            VALUES (?, ?)
          `;
          
          conn.query(insertQuery, [accountId, publicAddress], (insertErr, insertResult) => {
            if (insertErr) {
              // Rollback on any insert error
              return conn.rollback(() => {
                conn.release();
                callback(insertErr);
              });
            }

            // Both operations succeeded, commit the transaction
            conn.commit((commitErr) => {
              conn.release();
              if (commitErr) {
                return callback(commitErr);
              }
              
              // Return success with both results
              callback(null, { 
                updateResult, 
                insertResult,
                message: 'Public address updated and recorded in history'
              });
            });
          });
        });
      });
    });
  });
};

// UPDATED: Handle custom types without creating new credential types
const createCredential = (credentialData, callback) => {
  const {
    credential_type_id,
    custom_type = null,
    owner_id, 
    sender_id, 
    ipfs_cid = 'default_cid', 
    blockchain_id = null,
    transaction_id = null,
    status = 'pending',
    program_id = null
  } = credentialData;
  
  const query = `
    INSERT INTO credential 
    (credential_type_id, custom_type, owner_id, sender_id, ipfs_cid, blockchain_id, transaction_id, status, program_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  connection.query(query, [
    credential_type_id, 
    custom_type, 
    owner_id, 
    sender_id, 
    ipfs_cid, 
    blockchain_id,
    transaction_id,
    status,
    program_id
  ], callback);
};
// UPDATED: Get issued credentials filtered by institution (sender_id is the institution)
const getIssuedCredentials = (institutionId, callback) => {
  const query = `
    SELECT 
      c.id,
      CONCAT(s.first_name, ' ', s.last_name) as student_name,
      COALESCE(ct.type_name, c.custom_type) as credential_type,
      c.ipfs_cid,
      c.status,
      c.created_at as date_issued,
      c.blockchain_id,
      c.transaction_id
    FROM credential c
    JOIN student s ON c.owner_id = s.id
    LEFT JOIN credential_types ct ON c.credential_type_id = ct.id
    WHERE c.sender_id = ? AND s.institution_id = ?
    ORDER BY c.created_at DESC
  `;
  connection.query(query, [institutionId, institutionId], callback);
};

// UPDATED: Get credential stats filtered by institution
const getCredentialStats = (institutionId, callback) => {
  const query = `
    SELECT 
      COUNT(*) as total_credentials,
      COUNT(CASE WHEN c.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_credentials_week
    FROM credential c
    JOIN student s ON c.owner_id = s.id
    WHERE c.sender_id = ? AND s.institution_id = ?
  `;
  connection.query(query, [institutionId, institutionId], callback);
};

// UPDATED: Bulk create students with institution assignment
const bulkCreateStudents = async (studentsData, institutionId) => {
  return new Promise((resolve, reject) => {
    if (!studentsData || studentsData.length === 0) {
      return reject(new Error('No student data provided'));
    }

    if (!institutionId) {
      return reject(new Error('Institution ID is required'));
    }

    let successful = 0;
    let failed = 0;
    const failures = [];

    const processStudent = (index) => {
      if (index >= studentsData.length) {
        return resolve({ successful, failed, failures });
      }

      const student = studentsData[index];
      
      if (!student.first_name || !student.student_id) {
        failed++;
        failures.push({
          index: index + 1,
          data: student,
          error: 'Missing required fields: first_name or student_id'
        });
        return processStudent(index + 1);
      }

      connection.getConnection((err, conn) => {
        if (err) {
          failed++;
          failures.push({
            index: index + 1,
            data: student,
            error: 'Connection failed: ' + err.message
          });
          return processStudent(index + 1);
        }

        conn.beginTransaction((err) => {
          if (err) {
            conn.release();
            failed++;
            failures.push({
              index: index + 1,
              data: student,
              error: 'Transaction failed: ' + err.message
            });
            return processStudent(index + 1);
          }

          // Hash password before storing
          const plainPassword = student.password || 'student123';
          bcrypt.hash(plainPassword, SALT_ROUNDS, (err, hashedPassword) => {
            if (err) {
              return conn.rollback(() => {
                conn.release();
                failed++;
                failures.push({
                  index: index + 1,
                  data: student,
                  error: 'Password hashing failed: ' + err.message
                });
                processStudent(index + 1);
              });
            }

            const accountQuery = `
              INSERT INTO account (account_type, username, password, email) 
              VALUES ('student', ?, ?, ?)
            `;
            
            const accountValues = [
              student.username || `${student.first_name.toLowerCase()}${student.student_id}`,
              hashedPassword,
              student.email || `${student.username || student.first_name}@student.edu`
            ];

            conn.query(accountQuery, accountValues, (err, accountResult) => {
            if (err) {
              return conn.rollback(() => {
                conn.release();
                failed++;
                failures.push({
                  index: index + 1,
                  data: student,
                  error: 'Account creation failed: ' + err.message
                });
                processStudent(index + 1);
              });
            }

            const accountId = accountResult.insertId;

            const studentQuery = `
              INSERT INTO student (id, student_id, first_name, middle_name, last_name, institution_id, program_id) 
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            const studentValues = [
              accountId,
              student.student_id,
              student.first_name,
              student.middle_name || null,
              student.last_name || '',
              institutionId,
              student.program_id !== '' && student.program_id !== undefined ? student.program_id : null
            ];

            conn.query(studentQuery, studentValues, (err, studentResult) => {
              if (err) {
                return conn.rollback(() => {
                  conn.release();
                  failed++;
                  failures.push({
                    index: index + 1,
                    data: student,
                    error: 'Student record creation failed: ' + err.message
                  });
                  processStudent(index + 1);
                });
              }

              conn.commit((err) => {
                if (err) {
                  return conn.rollback(() => {
                    conn.release();
                    failed++;
                    failures.push({
                      index: index + 1,
                      data: student,
                      error: 'Transaction commit failed: ' + err.message
                    });
                    processStudent(index + 1);
                  });
                }

                conn.release();
                successful++;
                processStudent(index + 1);
              });
            });
          });
          }); // end of bcrypt.hash callback
        });
      });
    };

    processStudent(0);
  });
};

// Delete student account (only if no credentials)
const deleteStudent = (studentId, callback) => {
  connection.getConnection((err, conn) => {
    if (err) {
      return callback(err);
    }

    conn.beginTransaction((err) => {
      if (err) {
        conn.release();
        return callback(err);
      }

      // Check if student has any blockchain verified credentials
      const checkCredentialsQuery = `
        SELECT COUNT(*) as count 
        FROM credential 
        WHERE owner_id = ? AND status = 'blockchain_verified'
      `;

      conn.query(checkCredentialsQuery, [studentId], (err, results) => {
        if (err) {
          return conn.rollback(() => {
            conn.release();
            callback(err);
          });
        }

        if (results[0].count > 0) {
          return conn.rollback(() => {
            conn.release();
            callback(new Error('Cannot delete student with blockchain-verified credentials'));
          });
        }

        // Delete from student table
        const deleteStudentQuery = 'DELETE FROM student WHERE id = ?';
        conn.query(deleteStudentQuery, [studentId], (err, studentResult) => {
          if (err) {
            return conn.rollback(() => {
              conn.release();
              callback(err);
            });
          }

          // Delete from account table
          const deleteAccountQuery = 'DELETE FROM account WHERE id = ?';
          conn.query(deleteAccountQuery, [studentId], (err, accountResult) => {
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
              callback(null, {
                affectedRows: studentResult.affectedRows,
                message: 'Student deleted successfully'
              });
            });
          });
        });
      });
    });
  });
};

const checkStudentIdExists = (studentId, callback) => {
  const query = 'SELECT COUNT(*) as count FROM student WHERE student_id = ?';
  connection.query(query, [studentId], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0].count > 0);
  });
};

const checkUsernameExists = (username, callback) => {
  const query = 'SELECT COUNT(*) as count FROM account WHERE username = ?';
  connection.query(query, [username], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0].count > 0);
  });
};

// Add single student account
const addStudent = (studentData, institutionId, callback) => {
  const { student_id, first_name, middle_name, last_name, username, email, password, program_id } = studentData;

  // Hash password before storing
  bcrypt.hash(password, SALT_ROUNDS, (err, hashedPassword) => {
    if (err) {
      return callback(err);
    }

    connection.getConnection((err, conn) => {
      if (err) {
        return callback(err);
      }

      conn.beginTransaction((err) => {
        if (err) {
          conn.release();
          return callback(err);
        }

        const accountQuery = `
          INSERT INTO account (account_type, username, password, email) 
          VALUES ('student', ?, ?, ?)
        `;

        conn.query(accountQuery, [username, hashedPassword, email], (err, accountResult) => {
          if (err) {
            return conn.rollback(() => {
              conn.release();
              callback(err);
            });
          }

          const accountId = accountResult.insertId;

          const studentQuery = `
            INSERT INTO student (id, student_id, first_name, middle_name, last_name, institution_id, program_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `;

          const finalProgramId = program_id !== '' ? program_id : null;

          conn.query(studentQuery, [accountId, student_id, first_name, middle_name, last_name, institutionId, finalProgramId], (err, studentResult) => {
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
              callback(null, {
                id: accountId,
                student_id,
                first_name,
                middle_name,
                last_name,
                username,
                email
              });
            });
          });
        });
      });
    });
  }); // end of bcrypt.hash callback
};

// UPDATED: Get bulk import stats filtered by institution
const getBulkImportStats = (institutionId, callback) => {
  const query = `
    SELECT 
      COUNT(*) as total_students,
      COUNT(CASE WHEN a.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as new_students_today,
      COUNT(CASE WHEN a.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_students_week
    FROM student s
    JOIN account a ON s.id = a.id
    WHERE a.account_type = 'student' AND s.institution_id = ?
  `;
  connection.query(query, [institutionId], callback);
};

// Get dashboard statistics for institution
const getDashboardStats = (institutionId, callback) => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM student s WHERE s.institution_id = ?) as total_students,
      (SELECT COUNT(*) FROM credential c JOIN student s ON c.owner_id = s.id WHERE c.sender_id = ? AND s.institution_id = ?) as total_credentials,
      (SELECT COUNT(*) 
       FROM credential_verifications cv 
       JOIN credential c ON cv.credential_id = c.id 
       JOIN student s ON c.owner_id = s.id 
       WHERE c.sender_id = ? AND s.institution_id = ? AND DATE(cv.verification_timestamp) = CURDATE()) as daily_verifications
  `;
  connection.query(query, [institutionId, institutionId, institutionId, institutionId, institutionId], callback);
};

// Get institution profile information
const getInstitutionProfile = (institutionId, callback) => {
  const query = `
    SELECT 
      i.institution_name,
      a.username,
      a.email
    FROM institution i
    JOIN account a ON i.id = a.id
    WHERE i.id = ? AND a.account_type = 'institution'
  `;
  connection.query(query, [institutionId], callback);
};

// Verify institution password
const verifyInstitutionPassword = (institutionId, password, callback) => {
  const query = `
    SELECT password 
    FROM account 
    WHERE id = ? AND account_type = 'institution'
  `;
  
  connection.query(query, [institutionId], (err, results) => {
    if (err) {
      return callback(err);
    }
    
    if (results.length === 0) {
      return callback(null, false);
    }
    
    // Use bcrypt to compare the password with the hashed password
    bcrypt.compare(password, results[0].password, (err, isValid) => {
      if (err) {
        return callback(err);
      }
      callback(null, isValid);
    });
  });
};

// Update institution profile
const updateInstitutionProfile = (institutionId, profileData, callback) => {
  const { institution_name, username, email, password } = profileData;
  
  // Helper function to perform the update
  const performUpdate = (hashedPassword) => {
    connection.getConnection((err, conn) => {
      if (err) {
        return callback(err);
      }

      conn.beginTransaction((err) => {
        if (err) {
          conn.release();
          return callback(err);
        }

        // Update institution table
        const institutionQuery = `
          UPDATE institution 
          SET institution_name = ? 
          WHERE id = ?
        `;
        
        conn.query(institutionQuery, [institution_name, institutionId], (err, result) => {
          if (err) {
            return conn.rollback(() => {
              conn.release();
              callback(err);
            });
          }

          // Update account table
          let accountQuery, accountValues;
          if (hashedPassword) {
            accountQuery = `
              UPDATE account 
              SET username = ?, email = ?, password = ? 
              WHERE id = ? AND account_type = 'institution'
            `;
            accountValues = [username, email, hashedPassword, institutionId];
          } else {
            accountQuery = `
              UPDATE account 
              SET username = ?, email = ? 
              WHERE id = ? AND account_type = 'institution'
            `;
            accountValues = [username, email, institutionId];
          }

          conn.query(accountQuery, accountValues, (err, result) => {
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
              callback(null, { message: 'Profile updated successfully' });
            });
          });
        });
      });
    });
  };
  
  // If password is provided, hash it first
  if (password) {
    bcrypt.hash(password, SALT_ROUNDS, (err, hashedPassword) => {
      if (err) {
        return callback(err);
      }
      performUpdate(hashedPassword);
    });
  } else {
    performUpdate(null);
  }
};


// ============ STAFF MANAGEMENT ============

// Get all staff members for an institution
const getInstitutionStaff = (institutionId, callback) => {
  const query = `
    SELECT 
      s.id,
      s.first_name,
      s.middle_name,
      s.last_name,
      a.username,
      a.email,
      a.account_type,
      a.status
    FROM institution_staff s
    JOIN account a ON s.id = a.id
    WHERE s.institution_id = ? 
      AND a.account_type = 'institution_staff'
      AND (a.status IS NULL OR a.status != 'deleted')
    ORDER BY s.last_name, s.first_name
  `;
  connection.query(query, [institutionId], callback);
};

// Add a new staff member
const addInstitutionStaff = (staffData, callback) => {
  const { first_name, middle_name, last_name, username, email, password, institution_id } = staffData;
  
  // Hash password before storing
  bcrypt.hash(password, SALT_ROUNDS, (err, hashedPassword) => {
    if (err) {
      return callback(err);
    }

    connection.getConnection((err, conn) => {
      if (err) {
        return callback(err);
      }

      conn.beginTransaction((err) => {
        if (err) {
          conn.release();
          return callback(err);
        }
        
        // First, create the account with hashed password
        const accountQuery = `
          INSERT INTO account (account_type, username, password, email)
          VALUES ('institution_staff', ?, ?, ?)
        `;
        
        conn.query(accountQuery, [username, hashedPassword, email], (err, accountResult) => {
          if (err) {
            return conn.rollback(() => {
              conn.release();
              callback(err);
            });
          }
          
          const accountId = accountResult.insertId;
          
          // Then, create the staff record
          const staffQuery = `
            INSERT INTO institution_staff (id, first_name, middle_name, last_name, institution_id)
            VALUES (?, ?, ?, ?, ?)
          `;
          
          conn.query(staffQuery, [accountId, first_name, middle_name, last_name, institution_id], (err, staffResult) => {
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
              callback(null, { 
                accountId: accountId,
                staffId: accountId,
                message: 'Staff member created successfully'
              });
            });
          });
        });
      });
    });
  }); // end of bcrypt.hash callback
};

// Delete a staff member (soft delete - updates status to 'deleted')
const deleteInstitutionStaff = (staffId, callback) => {
  // Soft delete: Update account status to 'deleted' instead of removing the record
  const updateStatusQuery = 'UPDATE account SET status = ? WHERE id = ? AND account_type = ?';
  
  connection.query(updateStatusQuery, ['deleted', staffId, 'institution_staff'], (err, result) => {
    if (err) {
      return callback(err);
    }
    
    callback(null, {
      affectedRows: result.affectedRows,
      message: 'Staff member deleted successfully (soft delete)'
    });
  });
};

// ============ PROGRAM MANAGEMENT ============

// Get all programs for an institution
const getInstitutionPrograms = (institutionId, callback) => {
  const query = `
    SELECT 
      id,
      program_name,
      program_code,
      created_at
    FROM program
    WHERE institution_id = ?
    ORDER BY program_name
  `;
  connection.query(query, [institutionId], callback);
};

// Add a new program
const addInstitutionProgram = (programData, callback) => {
  const { program_name, program_code, institution_id } = programData;
  
  const query = `
    INSERT INTO program (institution_id, program_name, program_code)
    VALUES (?, ?, ?)
  `;
  
  connection.query(query, [institution_id, program_name, program_code], (err, result) => {
    if (err) {
      return callback(err);
    }
    
    callback(null, {
      programId: result.insertId,
      message: 'Program added successfully'
    });
  });
};

// Delete a program
const deleteInstitutionProgram = (programId, callback) => {
  const query = 'DELETE FROM program WHERE id = ?';
  
  connection.query(query, [programId], (err, result) => {
    if (err) {
      return callback(err);
    }
    
    callback(null, {
      affectedRows: result.affectedRows,
      message: 'Program deleted successfully'
    });
  });
};

// Delete a credential (set status to 'deleted')
const deleteCredential = (credentialId, callback) => {
  const query = `
    UPDATE credential 
    SET status = 'deleted'
    WHERE id = ?
  `;
  
  connection.query(query, [credentialId], (err, result) => {
    if (err) {
      return callback(err);
    }
    
    callback(null, {
      affectedRows: result.affectedRows,
      message: 'Credential deleted successfully'
    });
  });
};

// ============ ACTIVITY LOG QUERIES ============

// Get activity logs for an institution
const getActivityLogs = (institutionId, action, callback) => {
  let query = `
    SELECT 
      al.id,
      al.user_id,
      al.action,
      al.action_type,
      al.description,
      al.created_at,
      a.username,
      a.account_type,
      CASE 
        WHEN a.account_type = 'institution' THEN i.institution_name
        WHEN a.account_type = 'institution_staff' THEN CONCAT(ist.first_name, ' ', IFNULL(CONCAT(ist.middle_name, ' '), ''), ist.last_name)
        ELSE a.username
      END AS user_display_name,
      CASE 
        WHEN a.account_type = 'institution' THEN 'Main Admin'
        WHEN a.account_type = 'institution_staff' THEN 'Staff'
        ELSE a.account_type
      END AS user_role
    FROM activity_log al
    JOIN account a ON al.user_id = a.id
    LEFT JOIN institution i ON a.id = i.id AND a.account_type = 'institution'
    LEFT JOIN institution_staff ist ON al.user_id = ist.id AND a.account_type = 'institution_staff'
    WHERE al.institution_id = ?
  `;
  
  const params = [institutionId];
  
  if (action && action !== 'all') {
    query += ' AND al.action = ?';
    params.push(action);
  }
  
  query += ' ORDER BY al.created_at DESC LIMIT 500';
  
  connection.query(query, params, callback);
};

// Create a new activity log entry
const createActivityLog = (logData, callback) => {
  const query = `
    INSERT INTO activity_log 
    (user_id, institution_id, action, action_type, description)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  const params = [
    logData.user_id,
    logData.institution_id,
    logData.action,
    logData.action_type,
    logData.description
  ];
  
  connection.query(query, params, callback);
};

module.exports = {
  getCredentialTypes,
  getRecentCustomType,
  getStudents,
  getInstitutionName,
  getInstitutionPublicAddress,
  getInstitutionAddresses,
  updateInstitutionPublicAddress,
  createCredential,
  getIssuedCredentials,
  getCredentialStats,
  bulkCreateStudents,
  addStudent,
  deleteStudent,
  checkStudentIdExists,
  checkUsernameExists,
  getBulkImportStats,
  getDashboardStats,
  getInstitutionProfile,
  verifyInstitutionPassword,
  updateInstitutionProfile,
  getInstitutionStaff,
  addInstitutionStaff,
  deleteInstitutionStaff,
  getInstitutionPrograms,
  addInstitutionProgram,
  deleteInstitutionProgram,
  deleteCredential,
  getActivityLogs,
  createActivityLog
};