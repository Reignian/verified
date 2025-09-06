const Database = require('../config/database');

// Database instance
const db = new Database();

// Query functions specifically for Academic Institution page
const institutionQueries = {
  
  // Get all credential types for dropdown
  async getCredentialTypes() {
    try {
      const connection = db.connect();
      
      return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM credential_types', (err, results) => {
          if (err) {
            console.error('Error fetching credential types:', err);
            reject(err);
          } else {
            resolve(results);
          }
        });
      });
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }
};

module.exports = institutionQueries;
