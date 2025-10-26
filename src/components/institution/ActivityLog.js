import React, { useState, useEffect } from 'react';
import { fetchActivityLogs } from '../../services/activityLogService';
import './ActivityLog.css';

function ActivityLog({ institutionId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  useEffect(() => {
    if (institutionId) {
      loadActivityLogs();
    }
  }, [institutionId, filter]);

  const loadActivityLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchActivityLogs(institutionId, filter);
      setLogs(data);
    } catch (err) {
      console.error('Error loading activity logs:', err);
      setError('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const iconMap = {
      profile_updated: 'fa-user-edit',
      staff_added: 'fa-user-plus',
      staff_deleted: 'fa-user-minus',
      program_added: 'fa-graduation-cap',
      program_deleted: 'fa-trash-alt',
      credential_issued: 'fa-certificate',
      credential_deleted: 'fa-file-excel',
      student_added: 'fa-user-graduate',
      student_deleted: 'fa-user-times',
      student_imported: 'fa-file-import',
      settings_viewed: 'fa-eye',
      login: 'fa-sign-in-alt',
      logout: 'fa-sign-out-alt',
      other: 'fa-info-circle'
    };
    return iconMap[action] || 'fa-circle';
  };

  const getActionColor = (action) => {
    const colorMap = {
      profile_updated: 'action-update',
      staff_added: 'action-create',
      staff_deleted: 'action-delete',
      program_added: 'action-create',
      program_deleted: 'action-delete',
      credential_issued: 'action-create',
      credential_deleted: 'action-delete',
      student_added: 'action-create',
      student_deleted: 'action-delete',
      student_imported: 'action-create',
      settings_viewed: 'action-view',
      login: 'action-info',
      logout: 'action-info',
      other: 'action-other'
    };
    return colorMap[action] || 'action-other';
  };

  const formatActionText = (action) => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.user_display_name?.toLowerCase().includes(searchLower) ||
      log.username?.toLowerCase().includes(searchLower) ||
      log.user_role?.toLowerCase().includes(searchLower) ||
      log.action?.toLowerCase().includes(searchLower) ||
      log.description?.toLowerCase().includes(searchLower)
    );
  });

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageJump = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="activity-log-container">
      <div className="activity-log-header">
        <div className="header-content">
          <h2 className="activity-log-title">
            <i className="fas fa-history"></i>
            Activity Log
          </h2>
          <p className="activity-log-subtitle">
            Track all actions performed in your institution settings
          </p>
        </div>
        <button 
          className="btn-refresh-logs"
          onClick={loadActivityLogs}
          disabled={loading}
        >
          <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
          Refresh
        </button>
      </div>

      <div className="activity-log-filters">
        <div className="filter-group">
          <label htmlFor="filter-select">Filter by Action:</label>
          <select
            id="filter-select"
            className="filter-select"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Actions</option>
            <option value="profile_updated">Profile Updates</option>
            <option value="staff_added">Staff Added</option>
            <option value="staff_deleted">Staff Deleted</option>
            <option value="program_added">Program Added</option>
            <option value="program_deleted">Program Deleted</option>
            <option value="credential_issued">Credentials Issued</option>
            <option value="student_added">Students Added</option>
          </select>
        </div>

        <div className="search-group">
          <i className="fas fa-search search-icon"></i>
          <input
            type="text"
            className="search-input"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {error && (
        <div className="activity-log-error">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {loading ? (
        <div className="activity-log-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading activity logs...</p>
        </div>
      ) : currentLogs.length === 0 ? (
        <div className="activity-log-empty">
          <i className="fas fa-clipboard-list"></i>
          <p>No activity logs found</p>
          <span className="empty-subtitle">
            {searchTerm ? 'Try adjusting your search or filter' : 'Actions will appear here once performed'}
          </span>
        </div>
      ) : (
        <>
          <div className="activity-log-results-info">
            <span className="results-count">
              Showing {indexOfFirstLog + 1}-{Math.min(indexOfLastLog, filteredLogs.length)} of {filteredLogs.length} {filteredLogs.length === 1 ? 'log' : 'logs'}
            </span>
          </div>

          <div className="activity-log-list-container">
            <div className="activity-log-list">
              {currentLogs.map((log) => (
              <div key={log.id} className={`activity-log-item ${getActionColor(log.action)}`}>
                <div className="log-icon">
                  <i className={`fas ${getActionIcon(log.action)}`}></i>
                </div>
                <div className="log-content">
                  <div className="log-main">
                    <span className="log-user">
                      {log.user_display_name || log.username || 'System'}
                    </span>
                    {log.user_role && (
                      <span className="log-user-role">({log.user_role})</span>
                    )}
                    <span className="log-action">{formatActionText(log.action)}</span>
                  </div>
                  {log.description && (
                    <p className="log-description">{log.description}</p>
                  )}
                  <div className="log-meta">
                    <span className="log-timestamp">
                      <i className="fas fa-clock"></i>
                      {formatTimestamp(log.created_at)}
                    </span>
                    {log.ip_address && (
                      <span className="log-ip">
                        <i className="fas fa-network-wired"></i>
                        {log.ip_address}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="activity-log-pagination">
              <button
                className="pagination-btn pagination-btn-prev"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                title="Previous page"
              >
                <i className="fas fa-chevron-left"></i>
                Previous
              </button>
              
              <div className="pagination-pages">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      className={`pagination-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => handlePageJump(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                className="pagination-btn pagination-btn-next"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                title="Next page"
              >
                Next
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ActivityLog;
