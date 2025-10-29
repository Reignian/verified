// fileName: DashboardAnalytics.js

import React, { useState, useEffect, useRef } from 'react';
import {
  fetchCredentialTypeDistribution,
  fetchStudentsByProgram,
  fetchRecentActivity,
  fetchDailyCredentialTrends
} from '../../services/institutionApiService';
import './DashboardAnalytics.css';

function DashboardAnalytics({ institutionId }) {
  const [credentialDistribution, setCredentialDistribution] = useState([]);
  const [studentsByProgram, setStudentsByProgram] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [dailyTrends, setDailyTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollPositionRef = useRef(0);
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState('7days'); // 'all', '7days', '30days', 'custom' - DEFAULT to 7 days
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  // Program filter state
  const [selectedProgram, setSelectedProgram] = useState('all');
  
  // Handle date filter change with custom range reset
  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    if (filter === 'custom') {
      // Reset custom dates when opening custom range
      setCustomStartDate('');
      setCustomEndDate('');
      setDateError('');
    }
  };

  useEffect(() => {
    if (!institutionId) return;
    
    const loadAnalytics = async () => {
      // Save current scroll position before loading
      scrollPositionRef.current = window.scrollY;
      
      setLoading(true);
      setDateError('');
      
      try {
        // Calculate date range based on filter
        let startDate = null;
        let endDate = null;
        const now = new Date();
        
        if (dateFilter === '7days') {
          const date = new Date();
          date.setDate(date.getDate() - 7);
          startDate = date.toISOString().split('T')[0];
        } else if (dateFilter === '30days') {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        } else if (dateFilter === 'custom') {
          // Validate custom date range
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            
            if (end < start) {
              setDateError('End date cannot be earlier than start date');
              setLoading(false);
              return;
            }
          }
          
          startDate = customStartDate;
          endDate = customEndDate;
        }
        
        console.log('Fetching analytics with filters:', { startDate, endDate, selectedProgram });
        
        const [distribution, programs, activity, trends] = await Promise.all([
          fetchCredentialTypeDistribution(institutionId, startDate, endDate, selectedProgram),
          fetchStudentsByProgram(institutionId),
          fetchRecentActivity(institutionId),
          fetchDailyCredentialTrends(institutionId, startDate, endDate, selectedProgram)
        ]);
        
        console.log('Received data:', { distribution, trends });
        
        setCredentialDistribution(distribution);
        setStudentsByProgram(programs);
        setRecentActivity(activity);
        setDailyTrends(trends);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
        
        // Restore scroll position after data loads
        setTimeout(() => {
          window.scrollTo(0, scrollPositionRef.current);
        }, 0);
      }
    };

    loadAnalytics();
  }, [institutionId, dateFilter, customStartDate, customEndDate, selectedProgram]);

  // Calculate percentages for credential distribution
  const totalCredentials = credentialDistribution.reduce((sum, item) => sum + item.count, 0);
  
  // Calculate max for bar chart scaling
  const maxStudents = Math.max(...studentsByProgram.map(p => p.student_count), 1);
  
  // Calculate max from VISIBLE daily trends (the actual max in the current date range)
  const maxTrendInRange = dailyTrends.length > 0 
    ? Math.max(...dailyTrends.map(t => t.count))
    : 0;
  
  // Calculate nice Y-axis intervals based on the max in visible range
  const getYAxisIntervals = (max) => {
    if (max === 0) return [5, 4, 3, 2, 1, 0];
    
    // Round up to nearest nice number
    let niceMax = max;
    if (max <= 5) niceMax = 5;
    else if (max <= 10) niceMax = 10;
    else if (max <= 20) niceMax = 20;
    else if (max <= 50) niceMax = Math.ceil(max / 10) * 10;
    else niceMax = Math.ceil(max / 20) * 20;
    
    const interval = niceMax / 5;
    return [0, 1, 2, 3, 4, 5].map(i => Math.round(niceMax - (i * interval)));
  };
  
  const yAxisValues = getYAxisIntervals(maxTrendInRange);
  const yAxisMax = yAxisValues[0]; // Top value

  // Color palette for charts
  const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-analytics">
      {/* Date Filter Row */}
      <div className="analytics-row">
        <div className="analytics-card date-filter-card">
          <h3><i className="fas fa-filter"></i> Filters</h3>
          <div className="date-filter-controls">
            <div className="filter-row">
              <div className="filter-section date-section">
                <label className="filter-label">Date Range:</label>
                <div className="filter-buttons">
                  <button 
                    className={`filter-btn ${dateFilter === 'all' ? 'active' : ''}`}
                    onClick={() => handleDateFilterChange('all')}
                  >
                    All Time
                  </button>
                  <button 
                    className={`filter-btn ${dateFilter === '7days' ? 'active' : ''}`}
                    onClick={() => handleDateFilterChange('7days')}
                  >
                    Last 7 Days
                  </button>
                  <button 
                    className={`filter-btn ${dateFilter === '30days' ? 'active' : ''}`}
                    onClick={() => handleDateFilterChange('30days')}
                  >
                    Last 30 Days
                  </button>
                  <button 
                    className={`filter-btn ${dateFilter === 'custom' ? 'active' : ''}`}
                    onClick={() => handleDateFilterChange('custom')}
                  >
                    Custom Range
                  </button>
                </div>
              </div>
              
              <div className="filter-section program-section">
                <label className="filter-label">Program:</label>
                <select 
                  className="program-filter-select"
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                >
                  <option value="all">All Programs</option>
                  {studentsByProgram.map((program, index) => (
                    <option key={index} value={program.program_id}>
                      {program.program_name || program.program_code}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {dateFilter === 'custom' && (
              <div className="custom-date-inputs">
                <div className="date-input-group">
                  <label>Start Date:</label>
                  <input 
                    type="date" 
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="date-input"
                  />
                </div>
                <div className="date-input-group">
                  <label>End Date:</label>
                  <input 
                    type="date" 
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="date-input"
                    min={customStartDate}
                  />
                </div>
                {dateError && (
                  <div className="date-error">
                    <i className="fas fa-exclamation-circle"></i> {dateError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="analytics-row">
        {/* Credential Type Distribution */}
        <div className="analytics-card">
          <h3><i className="fas fa-chart-pie"></i> Credential Type Distribution</h3>
          {credentialDistribution.length > 0 ? (
            <div className="chart-container">
              <div className="pie-chart">
                {credentialDistribution.map((item, index) => {
                  const percentage = ((item.count / totalCredentials) * 100).toFixed(1);
                  return (
                    <div key={index} className="pie-segment" style={{ '--percentage': percentage, '--color': colors[index % colors.length] }}>
                      <div className="pie-label">
                        <span className="pie-type">{item.credential_type}</span>
                        <span className="pie-count">{item.count} ({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="chart-legend">
                {credentialDistribution.map((item, index) => (
                  <div key={index} className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: colors[index % colors.length] }}></span>
                    <span className="legend-text">{item.credential_type}: {item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-data">No credential data available</div>
          )}
        </div>
        {/* Daily Credential Trends - Line Graph */}
        <div className="analytics-card">
          <h3><i className="fas fa-chart-line"></i> Credential Issuance Trends</h3>
          {dailyTrends.length > 0 ? (
            <div className="chart-container">
              <div className="line-graph-container">
                <svg 
                  className="line-graph" 
                  viewBox="0 0 800 320" 
                  preserveAspectRatio="xMidYMid meet"
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Grid lines */}
                  <g className="grid-lines">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <line
                        key={i}
                        x1="40"
                        y1={40 + i * 40}
                        x2="780"
                        y2={40 + i * 40}
                        stroke="#E5E7EB"
                        strokeWidth="1"
                      />
                    ))}
                  </g>
                  
                  {/* Y-axis labels */}
                  <g className="y-axis-labels">
                    {yAxisValues.map((value, i) => (
                      <text
                        key={i}
                        x="30"
                        y={45 + i * 40}
                        textAnchor="end"
                        fontSize="12"
                        fill="#6B7280"
                      >
                        {value}
                      </text>
                    ))}
                  </g>
                  
                  {/* Line path */}
                  <path
                    d={dailyTrends.map((trend, index) => {
                      const x = 40 + (index * (740 / (dailyTrends.length - 1 || 1)));
                      const y = 280 - ((trend.count / yAxisMax) * 240);
                      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Area under line */}
                  <path
                    d={`
                      M 40 280
                      ${dailyTrends.map((trend, index) => {
                        const x = 40 + (index * (740 / (dailyTrends.length - 1 || 1)));
                        const y = 280 - ((trend.count / yAxisMax) * 240);
                        return `L ${x} ${y}`;
                      }).join(' ')}
                      L ${40 + ((dailyTrends.length - 1) * (740 / (dailyTrends.length - 1 || 1)))} 280
                      Z
                    `}
                    fill="url(#areaGradient)"
                    opacity="0.3"
                  />
                  
                  {/* Hover areas - invisible rectangles for hover detection */}
                  {dailyTrends.map((trend, index) => {
                    const x = 40 + (index * (740 / (dailyTrends.length - 1 || 1)));
                    const rectWidth = 740 / dailyTrends.length;
                    return (
                      <rect
                        key={`hover-${index}`}
                        className="hover-area"
                        x={x - rectWidth / 2}
                        y="40"
                        width={rectWidth}
                        height="240"
                        fill="transparent"
                        onMouseEnter={() => setHoveredPoint(index)}
                      />
                    );
                  })}
                  
                  {/* Vertical line and dot on hover */}
                  {hoveredPoint !== null && (() => {
                    const trend = dailyTrends[hoveredPoint];
                    const x = 40 + (hoveredPoint * (740 / (dailyTrends.length - 1 || 1)));
                    const y = 280 - ((trend.count / yAxisMax) * 240);
                    
                    // Adjust tooltip position to prevent overflow
                    const tooltipWidth = 120;
                    let tooltipX = x - tooltipWidth / 2;
                    
                    // If tooltip goes beyond right edge, shift it left
                    if (tooltipX + tooltipWidth > 780) {
                      tooltipX = 780 - tooltipWidth;
                    }
                    // If tooltip goes beyond left edge, shift it right
                    if (tooltipX < 40) {
                      tooltipX = 40;
                    }
                    
                    return (
                      <g>
                        <line className="hover-vertical-line" x1={x} y1="40" x2={x} y2="280" />
                        <circle className="hover-dot" cx={x} cy={y} r="6" />
                        <g>
                          <rect className="tooltip-bg" x={tooltipX} y={y - 45} width={tooltipWidth} height="35" />
                          <text className="tooltip-date" x={tooltipX + tooltipWidth / 2} y={y - 28}>
                            {trend.date_label}
                          </text>
                          <text className="tooltip-count" x={tooltipX + tooltipWidth / 2} y={y - 14}>
                            {trend.count} credential{trend.count !== 1 ? 's' : ''}
                          </text>
                        </g>
                      </g>
                    );
                  })()}
                  
                  {/* X-axis labels - show every nth label to avoid crowding */}
                  <g className="x-axis-labels">
                    {dailyTrends.map((trend, index) => {
                      const showLabel = dailyTrends.length <= 10 || index % Math.ceil(dailyTrends.length / 10) === 0;
                      if (!showLabel) return null;
                      const x = 40 + (index * (740 / (dailyTrends.length - 1 || 1)));
                      return (
                        <text
                          key={index}
                          x={x}
                          y="305"
                          textAnchor="middle"
                          fontSize="11"
                          fill="#6B7280"
                        >
                          {trend.date_label}
                        </text>
                      );
                    })}
                  </g>
                  
                  {/* Gradients */}
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4F46E5" />
                      <stop offset="100%" stopColor="#7C3AED" />
                    </linearGradient>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#4F46E5" />
                      <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          ) : (
            <div className="no-data">No trend data available</div>
          )}
        </div>
      </div>

      {/* Students by Program & Recent Activity Row */}
      <div className="analytics-row">
        {/* Students by Program */}
        <div className="analytics-card">
          <h3><i className="fas fa-graduation-cap"></i> Students by Program</h3>
          {studentsByProgram.length > 0 ? (
            <div className="chart-container">
              <div className="bar-chart">
                {studentsByProgram.map((program, index) => {
                  const barHeight = (program.student_count / maxStudents) * 100;
                  return (
                    <div key={index} className="bar-item">
                      <div className="bar-wrapper">
                        <div 
                          className="bar" 
                          style={{ 
                            height: `${barHeight}%`,
                            backgroundColor: colors[index % colors.length]
                          }}
                        >
                          <span className="bar-value">{program.student_count}</span>
                        </div>
                      </div>
                      <div className="bar-label">
                        <div className="bar-program-code">{program.program_code}</div>
                        <div className="bar-program-name">{program.program_name}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="no-data">No program data available</div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="analytics-card">
          <h3><i className="fas fa-history"></i> Recent Activity</h3>
          {recentActivity.length > 0 ? (
            <div className="activity-list">
              {recentActivity.map((activity, index) => {
                const actionIcon = activity.action_type === 'create' ? 'fa-plus-circle' :
                                   activity.action_type === 'delete' ? 'fa-trash' :
                                   activity.action_type === 'update' ? 'fa-edit' : 'fa-info-circle';
                const actionColor = activity.action_type === 'create' ? 'success' :
                                    activity.action_type === 'delete' ? 'danger' :
                                    activity.action_type === 'update' ? 'warning' : 'info';
                
                return (
                  <div key={index} className="activity-item">
                    <div className={`activity-icon ${actionColor}`}>
                      <i className={`fas ${actionIcon}`}></i>
                    </div>
                    <div className="activity-content">
                      <div className="activity-description">{activity.description}</div>
                      <div className="activity-meta">
                        <span className="activity-user">{activity.user_name || 'System'}</span>
                        <span className="activity-time">{new Date(activity.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-data">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardAnalytics;
