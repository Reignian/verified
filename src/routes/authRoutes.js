// fileName: authRoutes.js
// Routes for authentication operations

const express = require('express');
const router = express.Router();
const authQueries = require('../queries/authQueries');
const bcrypt = require('bcrypt');

// POST /api/auth/login - User login
router.post('/login', (req, res) => {
  const { emailOrUsername, password, userType } = req.body;
  
  if (!emailOrUsername || !password) {
    return res.status(400).json({ error: 'Email/Username and password required' });
  }
  
  // For admin login, userType is not required
  if (!userType && emailOrUsername !== 'admin') {
    return res.status(400).json({ error: 'User type selection required' });
  }
  
  authQueries.getUserByEmailOrUsername(emailOrUsername, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = results[0];
    
    // Verify username/email matches
    if (user.username !== emailOrUsername && user.email !== emailOrUsername) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Use bcrypt to verify password
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: 'Authentication error' });
      }
      
      if (!isMatch) {
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
    // Allow institution_staff to login with userType='institution'
    const isValidUserType = user.account_type === userType || 
                           (userType === 'institution' && user.account_type === 'institution_staff');
    
    if (!isValidUserType) {
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
    } else if (user.account_type === 'institution_staff') {
      // For institution staff, fetch institution_id and institution's public_address
      const db = require('../config/database');
      db.query('SELECT institution_id FROM institution_staff WHERE id = ?', [user.id], (staffErr, staffResults) => {
        if (staffErr) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (!staffResults || staffResults.length === 0) {
          return res.status(500).json({ error: 'Staff record not found' });
        }
        
        const institutionId = staffResults[0].institution_id;
        
        // Fetch institution's public_address
        db.query('SELECT public_address FROM institution WHERE id = ?', [institutionId], (instErr, instResults) => {
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
              institution_id: institutionId,
              public_address: publicAddress
            }
          });
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
    }); // end of bcrypt.compare callback
  });
});

module.exports = router;
