const connection = require('../config/database');

// Get user by username for login
const getUserByUsername = (username, callback) => {
  const query = 'SELECT * FROM account WHERE username = ?';
  connection.query(query, [username], callback);
};

module.exports = {
  getUserByUsername
};
