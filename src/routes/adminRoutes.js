// fileName: adminRoutes.js
// Routes for admin operations (institution management, credentials monitoring, etc.)

const express = require('express');
const router = express.Router();
const adminQueries = require('../queries/adminQueries');
const SystemSettingsService = require('../services/systemSettingsService');
const emailService = require('../services/emailService');
const db = require('../config/database');

// GET /api/admin/stats - Get system statistics for admin dashboard
router.get('/stats', (req, res) => {
  adminQueries.getSystemStats((err, stats) => {
    if (err) {
      console.error('Error fetching system stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(stats);
  });
});

// GET /api/admin/institutions - Get all institutions for admin management
router.get('/institutions', (req, res) => {
  adminQueries.getAllInstitutions((err, results) => {
    if (err) {
      console.error('Error fetching institutions:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// GET /api/admin/institutions/pending - Get pending institution requests
router.get('/institutions/pending', (req, res) => {
  adminQueries.getPendingInstitutions((err, results) => {
    if (err) {
      console.error('Error fetching pending institutions:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// PUT /api/admin/institutions/:id/approve - Approve institution account
router.put('/institutions/:id/approve', (req, res) => {
  const { id } = req.params;
  
  adminQueries.approveInstitution(id, (err, result) => {
    if (err) {
      console.error('Error approving institution:', err);
      return res.status(500).json({ error: 'Failed to approve institution' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    
    res.json({
      success: true,
      message: 'Institution approved successfully'
    });
  });
});

// PUT /api/admin/institutions/:id/reject - Reject institution account
router.put('/institutions/:id/reject', (req, res) => {
  const { id } = req.params;
  
  adminQueries.rejectInstitution(id, (err, result) => {
    if (err) {
      console.error('Error rejecting institution:', err);
      return res.status(500).json({ error: 'Failed to reject institution' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    
    res.json({
      success: true,
      message: 'Institution rejected successfully'
    });
  });
});

// POST /api/admin/institutions - Create new institution
router.post('/institutions', (req, res) => {
  const { username, password, email, institution_name } = req.body;
  
  if (!username || !password || !email || !institution_name) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  adminQueries.createInstitution({ username, password, email, institution_name }, (err, result) => {
    if (err) {
      console.error('Error creating institution:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      return res.status(500).json({ error: 'Failed to create institution' });
    }
    
    res.json({
      success: true,
      message: 'Institution created successfully',
      id: result.insertId
    });
  });
});

// PUT /api/admin/institutions/:id - Update institution
router.put('/institutions/:id', (req, res) => {
  const { id } = req.params;
  const { username, email, institution_name } = req.body;
  
  if (!username || !email || !institution_name) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  adminQueries.updateInstitution(id, { username, email, institution_name }, (err, result) => {
    if (err) {
      console.error('Error updating institution:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      return res.status(500).json({ error: 'Failed to update institution' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    
    res.json({
      success: true,
      message: 'Institution updated successfully'
    });
  });
});

// DELETE /api/admin/institutions/:id - Delete institution (soft delete)
router.delete('/institutions/:id', (req, res) => {
  const { id } = req.params;
  
  adminQueries.deleteInstitution(id, (err, result) => {
    if (err) {
      console.error('Error deleting institution:', err);
      return res.status(500).json({ error: 'Failed to delete institution' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    
    res.json({
      success: true,
      message: 'Institution deleted successfully'
    });
  });
});

// GET /api/admin/credentials - Get all credentials for admin monitoring
router.get('/credentials', (req, res) => {
  adminQueries.getAllCredentials((err, results) => {
    if (err) {
      console.error('Error fetching all credentials:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// GET /api/admin/verification-stats - Get credential verification statistics
router.get('/verification-stats', (req, res) => {
  adminQueries.getCredentialVerificationStats((err, results) => {
    if (err) {
      console.error('Error fetching verification stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// GET /api/admin/contact-messages - Get all contact messages
router.get('/contact-messages', (req, res) => {
  adminQueries.getAllContactMessages((err, results) => {
    if (err) {
      console.error('Error fetching contact messages:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// PUT /api/admin/contact-messages/:id - Update contact message status
router.put('/contact-messages/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['unread', 'read', 'replied'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  adminQueries.updateContactMessageStatus(id, status, (err, result) => {
    if (err) {
      console.error('Error updating contact message status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({
      success: true,
      message: 'Message status updated'
    });
  });
});

// DELETE /api/admin/contact-messages/:id - Delete contact message
router.delete('/contact-messages/:id', (req, res) => {
  const { id } = req.params;
  
  adminQueries.deleteContactMessage(id, (err, result) => {
    if (err) {
      console.error('Error deleting contact message:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  });
});

// System Settings Routes

// GET /api/admin/system-settings - Get all system settings
router.get('/system-settings', async (req, res) => {
  try {
    const settings = await SystemSettingsService.getAllSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
});

// PUT /api/admin/system-settings - Update system settings
router.put('/system-settings', async (req, res) => {
  try {
    const settings = req.body;
    await SystemSettingsService.updateMultipleSettings(settings);
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ error: 'Failed to update system settings' });
  }
});

// POST /api/admin/contact-messages/:id/approve-signup - Approve signup request from Messages tab
router.post('/contact-messages/:id/approve-signup', async (req, res) => {
  const { id } = req.params;
  
  // Get the message to find the account_id
  const query = 'SELECT * FROM contact_messages WHERE id = ? AND message_type = "signup_request"';
  db.query(query, [id], async (err, messages) => {
    if (err) {
      console.error('Error fetching message:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (messages.length === 0) {
      return res.status(404).json({ error: 'Signup request not found' });
    }
    
    const message = messages[0];
    const accountId = message.account_id;
    
    // Get institution details
    const accountQuery = `
      SELECT a.*, i.institution_name 
      FROM account a 
      JOIN institution i ON a.id = i.id 
      WHERE a.id = ?
    `;
    
    db.query(accountQuery, [accountId], async (err, accounts) => {
      if (err) {
        console.error('Error fetching account:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (accounts.length === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      const account = accounts[0];
      
      // Approve the institution
      adminQueries.approveInstitution(accountId, async (err, result) => {
        if (err) {
          console.error('Error approving institution:', err);
          return res.status(500).json({ error: 'Failed to approve institution' });
        }
        
        // Update message status to 'replied'
        adminQueries.updateContactMessageStatus(id, 'replied', (err) => {
          if (err) {
            console.error('Error updating message status:', err);
          }
        });
        
        // Generate Gmail compose URL for approval email
        try {
          const emailResult = await emailService.generateApprovalEmailUrl(account.email, account.institution_name, account.username);
          res.json({
            success: true,
            message: 'Institution approved successfully',
            gmailUrl: emailResult.gmailUrl
          });
        } catch (error) {
          console.error('Error generating approval email URL:', error);
          res.json({
            success: true,
            message: 'Institution approved successfully (email URL generation failed)'
          });
        }
      });
    });
  });
});

// POST /api/admin/contact-messages/:id/reject-signup - Reject signup request from Messages tab
router.post('/contact-messages/:id/reject-signup', async (req, res) => {
  const { id } = req.params;
  
  // Get the message to find the account_id
  const query = 'SELECT * FROM contact_messages WHERE id = ? AND message_type = "signup_request"';
  db.query(query, [id], async (err, messages) => {
    if (err) {
      console.error('Error fetching message:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (messages.length === 0) {
      return res.status(404).json({ error: 'Signup request not found' });
    }
    
    const message = messages[0];
    const accountId = message.account_id;
    
    // Get institution details
    const accountQuery = `
      SELECT a.*, i.institution_name 
      FROM account a 
      JOIN institution i ON a.id = i.id 
      WHERE a.id = ?
    `;
    
    db.query(accountQuery, [accountId], async (err, accounts) => {
      if (err) {
        console.error('Error fetching account:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (accounts.length === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      const account = accounts[0];
      
      // Reject the institution
      adminQueries.rejectInstitution(accountId, async (err, result) => {
        if (err) {
          console.error('Error rejecting institution:', err);
          return res.status(500).json({ error: 'Failed to reject institution' });
        }
        
        // Update message status to 'replied'
        adminQueries.updateContactMessageStatus(id, 'replied', (err) => {
          if (err) {
            console.error('Error updating message status:', err);
          }
        });
        
        // Generate Gmail compose URL for rejection email
        try {
          const emailResult = await emailService.generateRejectionEmailUrl(account.email, account.institution_name, account.username);
          res.json({
            success: true,
            message: 'Institution rejected successfully',
            gmailUrl: emailResult.gmailUrl
          });
        } catch (error) {
          console.error('Error generating rejection email URL:', error);
          res.json({
            success: true,
            message: 'Institution rejected successfully (email URL generation failed)'
          });
        }
      });
    });
  });
});

// POST /api/admin/contact-messages/:id/gmail-reply - Generate Gmail reply URL
router.post('/contact-messages/:id/gmail-reply', async (req, res) => {
  const { id } = req.params;
  
  // First get the contact message
  adminQueries.getAllContactMessages((err, messages) => {
    if (err) {
      console.error('Error fetching contact message:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const message = messages.find(m => m.id == id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Generate Gmail URL
    SystemSettingsService.generateGmailReplyUrl(message)
      .then(gmailUrl => {
        res.json({ 
          success: true, 
          gmailUrl: gmailUrl,
          message: 'Gmail compose URL generated successfully'
        });
      })
      .catch(error => {
        console.error('Error generating Gmail URL:', error);
        res.status(500).json({ error: 'Failed to generate Gmail URL' });
      });
  });
});

module.exports = router;
