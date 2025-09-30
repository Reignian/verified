// fileName: adminRoutes.js
// Routes for admin operations (institution management, credentials monitoring, etc.)

const express = require('express');
const router = express.Router();
const adminQueries = require('../queries/adminQueries');

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

module.exports = router;
