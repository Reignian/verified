// fileName: academicInstitutionQueries.js

const connection = require('../config/database');

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
    SELECT s.id, s.student_id, s.first_name, s.last_name
    FROM student s 
    JOIN account a ON s.id = a.id 
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

// Update institution public address by account ID
const updateInstitutionPublicAddress = (accountId, publicAddress, callback) => {
  const query = `
    UPDATE institution 
    SET public_address = ? 
    WHERE id = ?
  `;
  connection.query(query, [publicAddress, accountId], callback);
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
    status = 'pending' 
  } = credentialData;

  console.log('Creating credential with data:', credentialData);
  
  const query = `
    INSERT INTO credential 
    (credential_type_id, custom_type, owner_id, sender_id, ipfs_cid, blockchain_id, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  connection.query(query, [
    credential_type_id, 
    custom_type, 
    owner_id, 
    sender_id, 
    ipfs_cid, 
    blockchain_id,
    status
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
      c.blockchain_id
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

      connection.beginTransaction((err) => {
        if (err) {
          failed++;
          failures.push({
            index: index + 1,
            data: student,
            error: 'Transaction failed: ' + err.message
          });
          return processStudent(index + 1);
        }

        const accountQuery = `
          INSERT INTO account (account_type, username, password, email, institution_id) 
          VALUES ('student', ?, ?, ?, ?)
        `;
        
        const accountValues = [
          student.username || `${student.first_name.toLowerCase()}${student.student_id}`,
          student.password || 'student123',
          student.email || `${student.username || student.first_name}@student.edu`,
          institutionId
        ];

        connection.query(accountQuery, accountValues, (err, accountResult) => {
          if (err) {
            return connection.rollback(() => {
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
            INSERT INTO student (id, student_id, first_name, middle_name, last_name, institution_id) 
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          
          const studentValues = [
            accountId,
            student.student_id,
            student.first_name,
            student.middle_name || null,
            student.last_name || '',
            institutionId
          ];

          connection.query(studentQuery, studentValues, (err, studentResult) => {
            if (err) {
              return connection.rollback(() => {
                failed++;
                failures.push({
                  index: index + 1,
                  data: student,
                  error: 'Student record creation failed: ' + err.message
                });
                processStudent(index + 1);
              });
            }

            connection.commit((err) => {
              if (err) {
                return connection.rollback(() => {
                  failed++;
                  failures.push({
                    index: index + 1,
                    data: student,
                    error: 'Transaction commit failed: ' + err.message
                  });
                  processStudent(index + 1);
                });
              }

              successful++;
              processStudent(index + 1);
            });
          });
        });
      });
    };

    processStudent(0);
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
  const { student_id, first_name, middle_name, last_name, username, email, password } = studentData;

  connection.beginTransaction((err) => {
    if (err) {
      return callback(err);
    }

    const accountQuery = `
      INSERT INTO account (account_type, username, password, email, institution_id) 
      VALUES ('student', ?, ?, ?, ?)
    `;

    connection.query(accountQuery, [username, password, email, institutionId], (err, accountResult) => {
      if (err) {
        return connection.rollback(() => {
          callback(err);
        });
      }

      const accountId = accountResult.insertId;

      const studentQuery = `
        INSERT INTO student (id, student_id, first_name, middle_name, last_name, institution_id) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      connection.query(studentQuery, [accountId, student_id, first_name, middle_name, last_name, institutionId], (err, studentResult) => {
        if (err) {
          return connection.rollback(() => {
            callback(err);
          });
        }

        connection.commit((err) => {
          if (err) {
            return connection.rollback(() => {
              callback(err);
            });
          }

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


module.exports = {
  getCredentialTypes,
  getRecentCustomType,
  getStudents,
  getInstitutionName,
  getInstitutionPublicAddress,
  updateInstitutionPublicAddress,
  createCredential,
  getIssuedCredentials,
  getCredentialStats,
  bulkCreateStudents,
  addStudent,
  checkStudentIdExists,
  checkUsernameExists,
  getBulkImportStats
};