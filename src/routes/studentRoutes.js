// fileName: studentRoutes.js (Consolidated by Student Dashboard Page)
// All routes used by MyVerifiED student dashboard

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const myVerifiEDQueries = require('../queries/MyVerifiEDQueries');

// ============ STUDENT PROFILE ============

// GET /api/student/:studentId/name - Get student name
router.get('/:studentId/name', (req, res) => {
  const { studentId } = req.params;
  
  myVerifiEDQueries.getStudentName(studentId, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(results[0]);
  });
});

// GET /api/student/:studentId/credential-count - Get student credential count
router.get('/:studentId/credential-count', (req, res) => {
  const { studentId } = req.params;
  
  myVerifiEDQueries.getStudentCredentialCount(studentId, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results[0] || { total_credentials: 0 });
  });
});

// ============ CREDENTIALS SECTION ============

// GET /api/student/:studentId/credentials - Get student credentials
router.get('/:studentId/credentials', (req, res) => {
  const { studentId } = req.params;
  
  myVerifiEDQueries.getStudentCredentials(studentId, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results || []);
  });
});

// ============ ACCESS CODES SECTION ============

// GET /api/student/:studentId/access-codes - Get student's access codes
router.get('/:studentId/access-codes', (req, res) => {
  const { studentId } = req.params;
  
  myVerifiEDQueries.getStudentAccessCodes(studentId, (err, results) => {
    if (err) {
      console.error('Error fetching student access codes:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results || []);
  });
});

// GET /api/student/:studentId/multi-access-codes - Get student's multi-access codes
router.get('/:studentId/multi-access-codes', (req, res) => {
  const { studentId } = req.params;
  
  myVerifiEDQueries.getStudentMultiAccessCodes(studentId, (err, results) => {
    if (err) {
      console.error('Error fetching student multi-access codes:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results || []);
  });
});

// PUT /api/student/update-multi-access-code-status - Update multi-access code status
router.put('/update-multi-access-code-status', (req, res) => {
  const { access_code, is_active } = req.body;

  if (!access_code || typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'access_code and is_active (boolean) are required' });
  }

  myVerifiEDQueries.updateMultiAccessCodeStatus(access_code, is_active, (err, result) => {
    if (err) {
      console.error('Error updating multi-access code status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, message: 'Multi-access code status updated successfully' });
  });
});

// DELETE /api/student/delete-multi-access-code - Delete multi-access code
router.delete('/delete-multi-access-code', (req, res) => {
  const { access_code } = req.body;

  if (!access_code) {
    return res.status(400).json({ error: 'access_code is required' });
  }

  myVerifiEDQueries.deleteMultiAccessCode(access_code, (err, result) => {
    if (err) {
      console.error('Error deleting multi-access code:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, message: 'Multi-access code deleted successfully' });
  });
});

// POST /api/student/generate-multi-access-code - Generate new multi-access code for multiple credentials
router.post('/generate-multi-access-code', (req, res) => {
  const { student_id, credential_ids } = req.body;

  if (!student_id || !credential_ids || !Array.isArray(credential_ids) || credential_ids.length < 2) {
    return res.status(400).json({ error: 'student_id and at least 2 credential_ids are required' });
  }

  try {
    const db = require('../config/database');

    // Generate a 6-character alphanumeric code (A-Z, 0-9)
    const generateRandomCode = (len = 6) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let out = '';
      for (let i = 0; i < len; i++) {
        const idx = crypto.randomInt(0, chars.length);
        out += chars[idx];
      }
      return out;
    };

    // Ensure uniqueness with a few attempts
    const ensureUniqueCode = (attempt = 0, maxAttempts = 10) => {
      const candidate = generateRandomCode(6);
      
      // Check uniqueness in both tables
      const checkSql = `
        SELECT 1 FROM credential_access WHERE access_code = ? 
        UNION 
        SELECT 1 FROM multi_access_code WHERE access_code = ?
        LIMIT 1
      `;
      
      db.query(checkSql, [candidate, candidate], (chkErr, rows) => {
        if (chkErr) {
          console.error('Error checking multi-access code uniqueness:', chkErr);
          return res.status(500).json({ error: 'Database error occurred' });
        }
        
        if (rows && rows.length > 0) {
          if (attempt + 1 >= maxAttempts) {
            return res.status(500).json({ error: 'Failed to generate unique multi-access code' });
          }
          return ensureUniqueCode(attempt + 1, maxAttempts);
        }
        
        // Insert when unique
        myVerifiEDQueries.generateMultiAccessCode(Number(student_id), credential_ids.map(Number), candidate, (insErr, result) => {
          if (insErr) {
            console.error('Error generating multi-access code:', insErr);
            return res.status(500).json({ error: insErr.message || 'Database error occurred' });
          }
          return res.json(result);
        });
      });
    };

    ensureUniqueCode();
  } catch (e) {
    console.error('Server error in generate-multi-access-code:', e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/student/generate-access-code - Generate new access code
router.post('/generate-access-code', (req, res) => {
  const { credential_id } = req.body;

  if (!credential_id) {
    return res.status(400).json({ error: 'credential_id is required' });
  }

  try {
    const db = require('../config/database');

    // Generate a 6-character alphanumeric code (A-Z, 0-9)
    const generateRandomCode = (len = 6) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let out = '';
      for (let i = 0; i < len; i++) {
        const idx = crypto.randomInt(0, chars.length);
        out += chars[idx];
      }
      return out;
    };

    // Ensure uniqueness with a few attempts
    const ensureUniqueCode = (attempt = 0, maxAttempts = 10) => {
      const candidate = generateRandomCode(6);
      db.query('SELECT 1 FROM credential_access WHERE access_code = ? LIMIT 1', [candidate], (chkErr, rows) => {
        if (chkErr) {
          console.error('Error checking access code uniqueness:', chkErr);
          return res.status(500).json({ error: 'Database error occurred' });
        }
        if (rows && rows.length > 0) {
          if (attempt + 1 >= maxAttempts) {
            return res.status(500).json({ error: 'Failed to generate unique access code' });
          }
          return ensureUniqueCode(attempt + 1, maxAttempts);
        }
        // Insert when unique
        myVerifiEDQueries.upsertCredentialAccessCode(Number(credential_id), candidate, (insErr) => {
          if (insErr) {
            console.error('Error generating access code:', insErr);
            return res.status(500).json({ error: 'Database error occurred' });
          }
          return res.json({ success: true, access_code: candidate });
        });
      });
    };

    ensureUniqueCode();
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/student/update-access-code-status - Update access code status
router.put('/update-access-code-status', (req, res) => {
  const { access_code, is_active } = req.body;
  
  if (!access_code || is_active === undefined) {
    return res.status(400).json({ error: 'Access code and status are required' });
  }
  
  myVerifiEDQueries.updateAccessCodeStatus(access_code, is_active, (err, result) => {
    if (err) {
      console.error('Error updating access code status:', err);
      return res.status(500).json({ error: 'Database error occurred' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Access code not found' });
    }
    
    res.json({
      success: true,
      message: 'Access code status updated successfully'
    });
  });
});

// DELETE /api/student/delete-access-code - Delete access code
router.delete('/delete-access-code', (req, res) => {
  const { access_code } = req.body;
  
  if (!access_code) {
    return res.status(400).json({ error: 'Access code is required' });
  }
  
  myVerifiEDQueries.deleteAccessCode(access_code, (err, result) => {
    if (err) {
      console.error('Error deleting access code:', err);
      return res.status(500).json({ error: 'Database error occurred' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Access code not found' });
    }
    
    res.json({
      success: true,
      message: 'Access code deleted successfully'
    });
  });
});

// ============ ACCOUNT SETTINGS SECTION (Account Linking) ============

// POST /api/student/link-account - Link student accounts into a single group
router.post('/link-account', (req, res) => {
  const { current_account_id, target_email, target_password, target_student_id } = req.body;

  if (!current_account_id || !target_email || !target_password || !target_student_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  myVerifiEDQueries.linkAccounts(
    Number(current_account_id),
    String(target_email).trim(),
    String(target_password),
    String(target_student_id).trim(),
    (err, result) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'Linking failed' });
      }
      res.json({
        success: true,
        message: 'Accounts linked successfully',
        group_id: result.group_id,
        target_account_id: result.target_account_id
      });
    }
  );
});

// GET /api/student/linked-accounts - Get linked accounts for a given account ID
router.get('/linked-accounts', (req, res) => {
  const { accountId } = req.query;

  if (!accountId) {
    return res.status(400).json({ error: 'accountId is required' });
  }

  myVerifiEDQueries.getLinkedAccounts(Number(accountId), (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    return res.json(results || []);
  });
});

// DELETE /api/student/unlink-account - Unlink a target account from the current user's link group
router.delete('/unlink-account', (req, res) => {
  const { current_account_id, target_account_id, current_password } = req.body;

  if (!current_account_id || !target_account_id || !current_password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const db = require('../config/database');
    const pwSql = 'SELECT 1 FROM account WHERE id = ? AND password = ? LIMIT 1';
    db.query(pwSql, [Number(current_account_id), String(current_password)], (pwErr, pwRows) => {
      if (pwErr) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!pwRows || pwRows.length === 0) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      myVerifiEDQueries.unlinkAccount(
        Number(current_account_id),
        Number(target_account_id),
        (err, result) => {
          if (err) {
            return res.status(400).json({ error: err.message || 'Unlink failed' });
          }
          res.json({ success: true, ...result });
        }
      );
    });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/student/change-password - Change password for a student account
router.put('/change-password', (req, res) => {
  const { account_id, current_password, new_password } = req.body;

  if (!account_id || !current_password || !new_password) {
    return res.status(400).json({ error: 'account_id, current_password, and new_password are required' });
  }

  // Basic validation
  if (String(new_password).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  if (current_password === new_password) {
    return res.status(400).json({ error: 'New password must be different from current password' });
  }

  myVerifiEDQueries.changePassword(
    Number(account_id),
    String(current_password),
    String(new_password),
    (err, result) => {
      if (err) {
        // Handle specific error messages
        if (err.message === 'Current password is incorrect') {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }
        if (err.message === 'Account not found') {
          return res.status(404).json({ error: 'Account not found' });
        }
        console.error('Error changing password:', err);
        return res.status(500).json({ error: 'Database error occurred' });
      }
      
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    }
  );
});

module.exports = router;
