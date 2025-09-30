// fileName: ContactMessages.js

import React, { useState, useEffect } from 'react';
import { 
  fetchAllContactMessages, 
  updateContactMessageStatus, 
  deleteContactMessage 
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
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openMessageModal(message)}
                          title="View Message"
                        >
                          <i className="fas fa-eye"></i>
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
                
                <a 
                  href={`mailto:${selectedMessage.email}?subject=Re: Your message to VerifiED&body=Dear ${selectedMessage.name},%0D%0A%0D%0AThank you for contacting VerifiED. %0D%0A%0D%0ARegarding your message:%0D%0A"${selectedMessage.message}"%0D%0A%0D%0ABest regards,%0D%0AVerifiED Support Team`}
                  className="btn btn-primary"
                >
                  <i className="fas fa-reply me-2"></i>
                  Reply via Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContactMessages;