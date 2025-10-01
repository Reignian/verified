const connection = require('../config/database');

// Get user by username for login (legacy - kept for compatibility)
const getUserByUsername = (username, callback) => {
  const query = 'SELECT * FROM account WHERE username = ?';
  connection.query(query, [username], callback);
};

// Get user by email or username for login
const getUserByEmailOrUsername = (emailOrUsername, callback) => {
  const query = 'SELECT * FROM account WHERE username = ? OR email = ?';
  connection.query(query, [emailOrUsername, emailOrUsername], callback);
};

module.exports = {
  getUserByUsername,
  getUserByEmailOrUsername
};
