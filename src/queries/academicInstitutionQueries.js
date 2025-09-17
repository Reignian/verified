// fileName: academicInstitutionQueries.js

const connection = require('../config/database');

const getCredentialTypes = (callback) => {
  connection.query('SELECT id, type_name FROM credential_types', callback);
};

const getStudents = (callback) => {
  const query = `
    SELECT s.id, s.student_id, s.first_name, s.last_name, a.public_address 
    FROM student s 
    JOIN account a ON s.id = a.id 
    WHERE a.account_type = 'student'
  `;
  connection.query(query, callback);
};

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

const getCredentialStats = (callback) => {
  const query = `
    SELECT 
      COUNT(*) as total_credentials,
      COUNT(CASE WHEN c.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_credentials_week
    FROM credential c
  `;
  connection.query(query, callback);
};

// NEW: Create a new credential type
const createCredentialType = (typeName, callback) => {
  const query = 'INSERT INTO credential_types (type_name) VALUES (?)';
  connection.query(query, [typeName], callback);
};

// NEW: Find a credential type by name to avoid duplicates
const findCredentialTypeByName = (typeName, callback) => {
  const query = 'SELECT * FROM credential_types WHERE LOWER(type_name) = LOWER(?) LIMIT 1';
  connection.query(query, [typeName], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]); // Returns the first match or undefined
  });
};

const bulkCreateStudents = async (studentsData) => {
  return new Promise((resolve, reject) => {
    if (!studentsData || studentsData.length === 0) {
      return reject(new Error('No student data provided'));
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
          INSERT INTO account (account_type, username, password, email, public_address) 
          VALUES ('student', ?, ?, ?, '')
        `;
        
        const accountValues = [
          student.username || `${student.first_name.toLowerCase()}${student.student_id}`,
          student.password || 'student123',
          student.email || `${student.username || student.first_name}@student.edu`
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
            INSERT INTO student (id, student_id, first_name, middle_name, last_name) 
            VALUES (?, ?, ?, ?, ?)
          `;
          
          const studentValues = [
            accountId,
            student.student_id,
            student.first_name,
            student.middle_name || null,
            student.last_name || ''
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

const getBulkImportStats = (callback) => {
  const query = `
    SELECT 
      COUNT(*) as total_students,
      COUNT(CASE WHEN a.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as new_students_today,
      COUNT(CASE WHEN a.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_students_week
    FROM student s
    JOIN account a ON s.id = a.id
    WHERE a.account_type = 'student'
  `;
  connection.query(query, callback);
};

module.exports = {
  getCredentialTypes,
  getStudents,
  createCredential,
  getIssuedCredentials,
  getCredentialStats,
  bulkCreateStudents,
  checkStudentIdExists,
  checkUsernameExists,
  getBulkImportStats,
  createCredentialType,
  findCredentialTypeByName
};