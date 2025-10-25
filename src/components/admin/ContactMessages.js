// fileName: ContactMessages.js

import React, { useState, useEffect } from 'react';
import { 
  fetchAllContactMessages, 
  updateContactMessageStatus, 
  deleteContactMessage,
  generateGmailReplyUrl,
  approveSignupRequest,
  rejectSignupRequest
} from '../../services/adminApiService';

function ContactMessages({ onStatsUpdate }) {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    userType: '',
    search: ''
  });

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [messages, filters]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await fetchAllContactMessages();
      setMessages(data);
      setError('');
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError('Failed to load contact messages');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...messages];

    if (filters.status) {
      filtered = filtered.filter(msg => msg.status === filters.status);
    }

    if (filters.userType) {
      filtered = filtered.filter(msg => msg.user_type === filters.userType);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(msg => 
        msg.name.toLowerCase().includes(searchLower) ||
        msg.email.toLowerCase().includes(searchLower) ||
        msg.message.toLowerCase().includes(searchLower)
      );
    }

    setFilteredMessages(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleStatusUpdate = async (messageId, newStatus) => {
    try {
      await updateContactMessageStatus(messageId, newStatus);
      await loadMessages();
      if (onStatsUpdate) onStatsUpdate();
    } catch (error) {
      console.error('Failed to update message status:', error);
      setError('Failed to update message status');
    }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteContactMessage(messageId);
      await loadMessages();
      if (onStatsUpdate) onStatsUpdate();
    } catch (error) {
      console.error('Failed to delete message:', error);
      setError('Failed to delete message');
    }
  };

  const handleGmailReply = async (messageId) => {
    try {
      const response = await generateGmailReplyUrl(messageId);
      
      // Open Gmail in a new tab
      window.open(response.gmailUrl, '_blank');
      
      // Mark as replied
      await handleStatusUpdate(messageId, 'replied');
      
    } catch (error) {
      console.error('Failed to generate Gmail reply:', error);
      setError('Failed to open Gmail reply');
    }
  };

  const handleApproveSignup = async (messageId) => {
    if (!window.confirm('Are you sure you want to approve this institution signup request? A Gmail compose window will open to send the approval email.')) {
      return;
    }

    try {
      const response = await approveSignupRequest(messageId);
      
      // Open Gmail compose window if URL is provided
      if (response.gmailUrl) {
        window.open(response.gmailUrl, '_blank');
      }
      
      await loadMessages();
      if (onStatsUpdate) onStatsUpdate();
      alert('Institution approved successfully! Please send the approval email from Gmail.');
    } catch (error) {
      console.error('Failed to approve signup request:', error);
      setError('Failed to approve signup request');
    }
  };

  const handleRejectSignup = async (messageId) => {
    if (!window.confirm('Are you sure you want to reject this institution signup request? A Gmail compose window will open to send the rejection email.')) {
      return;
    }

    try {
      const response = await rejectSignupRequest(messageId);
      
      // Open Gmail compose window if URL is provided
      if (response.gmailUrl) {
        window.open(response.gmailUrl, '_blank');
      }
      
      await loadMessages();
      if (onStatsUpdate) onStatsUpdate();
      alert('Institution rejected successfully! Please send the rejection email from Gmail.');
    } catch (error) {
      console.error('Failed to reject signup request:', error);
      setError('Failed to reject signup request');
    }
  };

  const openMessageModal = async (message) => {
    setSelectedMessage(message);
    setShowModal(true);
    
    // Mark as read if it's unread
    if (message.status === 'unread') {
      await handleStatusUpdate(message.id, 'read');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'unread': { class: 'bg-danger', text: 'Unread', icon: 'fas fa-envelope' },
      'read': { class: 'bg-warning', text: 'Read', icon: 'fas fa-envelope-open' },
      'replied': { class: 'bg-success', text: 'Replied', icon: 'fas fa-reply' }
    };
    
    const config = statusConfig[status];
    return (
      <span className={`badge ${config.class}`}>
        <i className={`${config.icon} me-1`}></i>
        {config.text}
      </span>
    );
  };

  const getUserTypeBadge = (userType) => {
    const typeConfig = {
      'institution': { class: 'bg-primary', text: 'Institution' },
      'employer': { class: 'bg-info', text: 'Employer' },
      'student': { class: 'bg-success', text: 'Student' },
      'other': { class: 'bg-secondary', text: 'Other' }
    };
    
    const config = typeConfig[userType];
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const getMessageTypeBadge = (messageType) => {
    if (messageType === 'signup_request') {
      return (
        <span className="badge bg-warning text-dark">
          <i className="fas fa-user-plus me-1"></i>
          Signup Request
        </span>
      );
    }
    return null;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateMessage = (message, maxLength = 100) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  const getMessageCounts = () => {
    const counts = {
      total: messages.length,
      unread: messages.filter(m => m.status === 'unread').length,
      read: messages.filter(m => m.status === 'read').length,
      replied: messages.filter(m => m.status === 'replied').length
    };
    return counts;
  };

  const counts = getMessageCounts();

  return (
    <div className="contact-messages">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Contact Messages</h2>
          <p className="text-muted">Manage messages submitted through the contact form</p>
        </div>
        <button 
          className="btn btn-outline-primary"
          onClick={loadMessages}
          disabled={loading}
        >
          <i className="fas fa-sync-alt me-2"></i>
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="text-primary">{counts.total}</h4>
              <p className="mb-0 text-muted">Total Messages</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="text-danger">{counts.unread}</h4>
              <p className="mb-0 text-muted">Unread</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="text-warning">{counts.read}</h4>
              <p className="mb-0 text-muted">Read</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="text-success">{counts.replied}</h4>
              <p className="mb-0 text-muted">Replied</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <h6 className="card-title mb-3">
            <i className="fas fa-filter me-2"></i>
            Filters
          </h6>
          <div className="row g-3">
            <div className="col-md-3">
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
              </select>
            </div>
            
            <div className="col-md-3">
              <select
                className="form-select"
                value={filters.userType}
                onChange={(e) => handleFilterChange('userType', e.target.value)}
              >
                <option value="">All User Types</option>
                <option value="institution">Institution</option>
                <option value="employer">Employer</option>
                <option value="student">Student</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, email, or message content..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted">
              Showing {filteredMessages.length} of {messages.length} messages
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-dark">
                <tr>
                  <th>From</th>
                  <th>User Type</th>
                  <th>Message Preview</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((message) => (
                  <tr 
                    key={message.id}
                    className={message.status === 'unread' ? 'table-warning' : ''}
                  >
                    <td>
                      <div>
                        <strong>{message.name}</strong>
                        <br />
                        <small className="text-muted">{message.email}</small>
                        {message.message_type === 'signup_request' && (
                          <div className="mt-1">
                            {getMessageTypeBadge(message.message_type)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{getUserTypeBadge(message.user_type)}</td>
                    <td>
                      <span 
                        style={{ cursor: 'pointer' }}
                        onClick={() => openMessageModal(message)}
                        className="text-decoration-none"
                      >
                        {truncateMessage(message.message)}
                      </span>
                    </td>
                    <td>{getStatusBadge(message.status)}</td>
                    <td>{formatDate(message.created_at)}</td>
                    <td>
                      {message.message_type === 'signup_request' && message.status !== 'replied' ? (
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleApproveSignup(message.id)}
                            title="Approve Signup"
                          >
                            <i className="fas fa-check me-1"></i>
                            Approve
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRejectSignup(message.id)}
                            title="Reject Signup"
                          >
                            <i className="fas fa-times me-1"></i>
                            Reject
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openMessageModal(message)}
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openMessageModal(message)}
                            title="View Message"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => handleGmailReply(message.id)}
                            title="Reply via Gmail"
                          >
                            <i className="fab fa-google"></i>
                          </button>
                          
                          {message.status !== 'replied' && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleStatusUpdate(message.id, 'replied')}
                              title="Mark as Replied"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                          
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(message.id)}
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredMessages.length === 0 && (
              <div className="text-center py-5">
                <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">No messages found</h5>
                <p className="text-muted">
                  {messages.length === 0 
                    ? 'No contact messages have been received yet'
                    : 'No messages match your current filters'
                  }
                </p>
                {messages.length > 0 && (
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => setFilters({ status: '', userType: '', search: '' })}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Message Detail Modal */}
      {showModal && selectedMessage && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Message from {selectedMessage.name}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Name:</strong> {selectedMessage.name}
                  </div>
                  <div className="col-md-6">
                    <strong>Email:</strong> {selectedMessage.email}
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>User Type:</strong> {getUserTypeBadge(selectedMessage.user_type)}
                  </div>
                  <div className="col-md-6">
                    <strong>Status:</strong> {getStatusBadge(selectedMessage.status)}
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Received:</strong> {formatDate(selectedMessage.created_at)}
                  </div>
                  <div className="col-md-6">
                    <strong>Last Updated:</strong> {formatDate(selectedMessage.updated_at)}
                  </div>
                </div>
                
                <div className="mb-3">
                  <strong>Message:</strong>
                  <div className="mt-2 p-3 bg-light rounded">
                    {selectedMessage.message}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                
                <button 
                  type="button" 
                  className="btn btn-info"
                  onClick={() => {
                    handleGmailReply(selectedMessage.id);
                    setShowModal(false);
                  }}
                >
                  <i className="fab fa-google me-2"></i>
                  Reply via Gmail
                </button>
                
                {selectedMessage.status !== 'replied' && (
                  <button 
                    type="button" 
                    className="btn btn-success"
                    onClick={() => {
                      handleStatusUpdate(selectedMessage.id, 'replied');
                      setShowModal(false);
                    }}
                  >
                    Mark as Replied
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContactMessages;