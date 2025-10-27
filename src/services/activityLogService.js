import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Fetch activity logs for an institution
 * @param {number} institutionId - The institution ID
 * @param {string} filter - Filter by action type (optional)
 * @returns {Promise<Array>} Array of activity logs
 */
export const fetchActivityLogs = async (institutionId, filter = 'all') => {
  try {
    const url = filter === 'all'
      ? `${API_BASE_URL}/api/institution/${institutionId}/activity-logs`
      : `${API_BASE_URL}/api/institution/${institutionId}/activity-logs?action=${filter}`;
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
};

/**
 * Log an activity action
 * @param {Object} logData - Activity log data
 * @returns {Promise<Object>} Created log response
 */
export const logActivity = async (logData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/institution/activity-logs`,
      logData
    );
    return response.data;
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error to prevent disrupting user actions
    return null;
  }
};

/**
 * Helper function to log profile update
 */
export const logProfileUpdate = async (institutionId, userId, changes) => {
  return logActivity({
    user_id: userId,
    institution_id: institutionId,
    action: 'profile_updated',
    action_type: 'update',
    description: `Updated institution profile: ${changes}`
  });
};

/**
 * Helper function to log staff addition
 */
export const logStaffAdded = async (institutionId, userId, staffName) => {
  return logActivity({
    user_id: userId,
    institution_id: institutionId,
    action: 'staff_added',
    action_type: 'create',
    description: `Added staff member: ${staffName}`
  });
};

/**
 * Helper function to log staff deletion
 */
export const logStaffDeleted = async (institutionId, userId, staffName) => {
  return logActivity({
    user_id: userId,
    institution_id: institutionId,
    action: 'staff_deleted',
    action_type: 'delete',
    description: `Deleted staff member: ${staffName}`
  });
};

/**
 * Helper function to log program addition
 */
export const logProgramAdded = async (institutionId, userId, programName) => {
  return logActivity({
    user_id: userId,
    institution_id: institutionId,
    action: 'program_added',
    action_type: 'create',
    description: `Added program: ${programName}`
  });
};

/**
 * Helper function to log program deletion
 */
export const logProgramDeleted = async (institutionId, userId, programName) => {
  return logActivity({
    user_id: userId,
    institution_id: institutionId,
    action: 'program_deleted',
    action_type: 'delete',
    description: `Deleted program: ${programName}`
  });
};

/**
 * Helper function to log credential issuance
 */
export const logCredentialIssued = async (institutionId, userId, credentialType, studentName) => {
  return logActivity({
    user_id: userId,
    institution_id: institutionId,
    action: 'credential_issued',
    action_type: 'create',
    description: `Issued ${credentialType} credential to ${studentName}`
  });
};

/**
 * Helper function to log credential deletion
 */
export const logCredentialDeleted = async (institutionId, userId, credentialType) => {
  return logActivity({
    user_id: userId,
    institution_id: institutionId,
    action: 'credential_deleted',
    action_type: 'delete',
    description: `Deleted ${credentialType} credential`
  });
};

/**
 * Helper function to log student addition
 */
export const logStudentAdded = async (institutionId, userId, studentName) => {
  return logActivity({
    user_id: userId,
    institution_id: institutionId,
    action: 'student_added',
    action_type: 'create',
    description: `Added student: ${studentName}`
  });
};

/**
 * Helper function to log student deletion
 */
export const logStudentDeleted = async (institutionId, userId, studentName) => {
  return logActivity({
    user_id: userId,
    institution_id: institutionId,
    action: 'student_deleted',
    action_type: 'delete',
    description: `Deleted student: ${studentName}`
  });
};

/**
 * Helper function to log student import
 */
export const logStudentImported = async (institutionId, userId, count) => {
  return logActivity({
    user_id: userId,
    institution_id: institutionId,
    action: 'student_imported',
    action_type: 'create',
    description: `Imported ${count} student${count > 1 ? 's' : ''}`
  });
};

/**
 * Helper function to log settings view
 */
export const logSettingsViewed = async (institutionId, userId, section) => {
  return logActivity({
    user_id: userId,
    institution_id: institutionId,
    action: 'settings_viewed',
    action_type: 'view',
    description: `Viewed ${section} settings`
  });
};
