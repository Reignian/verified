// fileName: authRoutes.js
// Routes for authentication operations

const express = require('express');
const router = express.Router();
const authQueries = require('../queries/authQueries');

// POST /api/auth/login - User login
router.post('/login', (req, res) => {
  const { username, password, userType } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  // For admin login, userType is not required
  if (!userType && username !== 'admin') {
    return res.status(400).json({ error: 'User type selection required' });
  }
  
  authQueries.getUserByUsername(username, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = results[0];
    
    if (user.password !== password || user.username !== username) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Special handling for admin login
    if (user.account_type === 'admin') {
      return res.json({
        message: 'Admin login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          account_type: user.account_type
        }
      });
    }
    
    // Validate that the selected user type matches the account type in database
    if (user.account_type !== userType) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }
    
    // For institution accounts, fetch public_address from institution table
    if (user.account_type === 'institution') {
      const db = require('../config/database');
      db.query('SELECT public_address FROM institution WHERE id = ?', [user.id], (instErr, instResults) => {
        if (instErr) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        const publicAddress = instResults && instResults[0] ? instResults[0].public_address : null;
        
        return res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            account_type: user.account_type,
            public_address: publicAddress
          }
        });
      });
    } else {
      // For student accounts, no public_address needed
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          account_type: user.account_type,
          public_address: null
        }
      });
    }
  });
});

module.exports = router;
