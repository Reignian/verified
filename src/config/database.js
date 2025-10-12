const mysql = require('mysql2');
require('dotenv').config();

// Check if we're in production (Railway)
const isProduction = process.env.NODE_ENV === 'production';

// Create connection pool with SSL for production
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'verified_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
  // Enable SSL for Railway MySQL
  ssl: isProduction ? {
    rejectUnauthorized: false
  } : undefined
});

// Test the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to database:', err);
    console.error('DB_HOST:', process.env.DB_HOST);
    console.error('DB_NAME:', process.env.DB_NAME);
    console.error('DB_USER:', process.env.DB_USER);
    return;
  }
  console.log('Connected to MySQL database');
  connection.release();
});

module.exports = pool;
