const mysql = require('mysql2');

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'verified_db'
});

// Get credential types from database
const getCredentialTypes = (callback) => {
  db.query('SELECT id, type_name FROM credential_types', callback);
};

// Get students from database
const getStudents = (callback) => {
  const query = `
    SELECT s.id, s.student_id, s.first_name, s.last_name, a.public_address 
    FROM student s 
    JOIN account a ON s.id = a.id 
    WHERE a.account_type = 'student'
  `;
  db.query(query, callback);
};

module.exports = {
  getCredentialTypes,
  getStudents
};
