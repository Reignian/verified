// fileName: authRoutes.js
// Routes for authentication operations

const express = require('express');
const router = express.Router();
const authQueries = require('../queries/authQueries');
const bcrypt = require('bcrypt');

// POST /api/auth/signup - Institution signup
router.post('/signup', (req, res) => {
  const { username, password, email, institution_name } = req.body;
  
  if (!username || !password || !email || !institution_name) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  // Hash password before storing
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing password:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    const db = require('../config/database');
    db.getConnection((err, conn) => {
      if (err) {
        console.error('Database connection error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      conn.beginTransaction((err) => {
        if (err) {
          conn.release();
          return res.status(500).json({ error: 'Database error' });
        }

        // Insert into account table with status 'pending'
        const accountQuery = `
          INSERT INTO account (account_type, username, password, email, status, created_at) 
          VALUES ('institution', ?, ?, ?, 'pending', NOW())
        `;
        
        conn.query(accountQuery, [username, hashedPassword, email], (err, accountResult) => {
          if (err) {
            return conn.rollback(() => {
              conn.release();
              if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Username or email already exists' });
              }
              console.error('Error creating account:', err);
              return res.status(500).json({ error: 'Failed to create account' });
            });
          }

          const accountId = accountResult.insertId;

          // Insert into institution table with public_address set to NULL
          const institutionQuery = `INSERT INTO institution (id, institution_name, public_address) VALUES (?, ?, NULL)`;
          
          conn.query(institutionQuery, [accountId, institution_name], (err) => {
            if (err) {
              return conn.rollback(() => {
                conn.release();
                console.error('Error creating institution:', err);
                return res.status(500).json({ error: 'Failed to create institution' });
              });
            }

            conn.commit((err) => {
              if (err) {
                return conn.rollback(() => {
                  conn.release();
                  console.error('Error committing transaction:', err);
                  return res.status(500).json({ error: 'Failed to create account' });
                });
              }
              conn.release();
              
              // Create a message in contact_messages for admin notification
              const messageQuery = `
                INSERT INTO contact_messages (name, email, user_type, message, status, message_type, account_id, created_at)
                VALUES (?, ?, 'institution', ?, 'unread', 'signup_request', ?, NOW())
              `;
              const messageText = `New institution signup request from ${institution_name}.\n\nUsername: ${username}\nEmail: ${email}\n\nPlease review and approve or reject this request.`;
              
              db.query(messageQuery, [institution_name, email, messageText, accountId], (err) => {
                if (err) {
                  console.error('Error creating notification message:', err);
                  // Don't fail the signup if message creation fails
                }
              });
              
              res.json({
                success: true,
                message: 'Account request submitted successfully. Waiting for admin approval.',
                id: accountId
              });
            });
          });
        });
      });
    });
  });
});

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
    
    // Check account status (skip for admin)
    if (user.account_type !== 'admin' && user.status === 'pending') {
      return res.status(403).json({ error: 'Your account is pending admin approval. Please wait for approval before logging in.' });
    }
    
    if (user.account_type !== 'admin' && user.status === 'rejected') {
      return res.status(403).json({ error: 'Your account request has been rejected. Please contact the administrator for more information.' });
    }
    
    if (user.account_type !== 'admin' && user.status === 'deleted') {
      return res.status(403).json({ error: 'This account has been deleted. Please contact the administrator for more information.' });
    }
    
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
