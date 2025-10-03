// fileName: studentApiService.js (Consolidated by Student Dashboard Page)
// All API calls used by MyVerifiED student dashboard

import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api'
  : 'http://localhost:3001/api';

// ============ STUDENT PROFILE ============

// Get student name by ID
export const fetchStudentName = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/student/${studentId}/name`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student name:', error);
    throw error;
  }
};

// Get student credential count
export const fetchStudentCredentialCount = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/student/${studentId}/credential-count`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student credential count:', error);
    throw error;
  }
};

// ============ CREDENTIALS SECTION ============

// Get student credentials (for MyVerifiED page)
export const fetchStudentCredentials = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/student/${studentId}/credentials`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student credentials:', error);
    throw error;
  }
};

// ============ ACCESS CODES SECTION ============

// Get student's access codes with active status (non-deleted)
export const fetchStudentAccessCodes = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/student/${studentId}/access-codes`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student access codes:', error);
    throw error;
  }
};

// Generate a new access code for a credential
export const generateCredentialAccessCode = async (credentialId) => {
  try {
    const response = await axios.post(`${API_URL}/student/generate-access-code`, {
      credential_id: credentialId,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating access code:', error);
    throw error;
  }
};

// Generate a new multi-access code for multiple credentials
export const generateMultiAccessCode = async (studentId, credentialIds) => {
  try {
    const response = await axios.post(`${API_URL}/student/generate-multi-access-code`, {
      student_id: studentId,
      credential_ids: credentialIds,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating multi-access code:', error);
    throw error;
  }
};

// Get student's multi-access codes
export const fetchStudentMultiAccessCodes = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/student/${studentId}/multi-access-codes`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student multi-access codes:', error);
    throw error;
  }
};

// Update multi-access code status (active/inactive)
export const updateMultiAccessCodeStatus = async (accessCode, isActive) => {
  try {
    const response = await axios.put(`${API_URL}/student/update-multi-access-code-status`, {
      access_code: accessCode,
      is_active: isActive
    });
    return response.data;
  } catch (error) {
    console.error('Error updating multi-access code status:', error);
    throw error;
  }
};

// Delete multi-access code
export const deleteMultiAccessCode = async (accessCode) => {
  try {
    const response = await axios.delete(`${API_URL}/student/delete-multi-access-code`, {
      data: { access_code: accessCode }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting multi-access code:', error);
    throw error;
  }
};

// Update access code status (active/inactive)
export const updateAccessCodeStatus = async (accessCode, isActive) => {
  try {
    const response = await axios.put(`${API_URL}/student/update-access-code-status`, {
      access_code: accessCode,
      is_active: isActive
    });
    return response.data;
  } catch (error) {
    console.error('Error updating access code status:', error);
    throw error;
  }
};

// Delete access code (mark as deleted)
export const deleteAccessCode = async (accessCode) => {
  try {
    const response = await axios.delete(`${API_URL}/student/delete-access-code`, {
      data: { access_code: accessCode }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting access code:', error);
    throw error;
  }
};

// ============ ACCOUNT SETTINGS SECTION (Account Linking) ============

// Link student accounts into a single group
export const linkAccount = async (currentAccountId, targetEmail, targetPassword, targetStudentId) => {
  try {
    const response = await axios.post(`${API_URL}/student/link-account`, {
      current_account_id: currentAccountId,
      target_email: targetEmail,
      target_password: targetPassword,
      target_student_id: targetStudentId
    });
    return response.data;
  } catch (error) {
    // Surface server error messages to caller
    if (error.response?.data) throw error;
    throw error;
  }
};

// Fetch linked accounts list for a given account ID
export const fetchLinkedAccounts = async (accountId) => {
  try {
    const response = await axios.get(`${API_URL}/student/linked-accounts`, {
      params: { accountId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching linked accounts:', error);
    throw error;
  }
};

// Unlink a target account from the current user's link group
export const unlinkAccount = async (currentAccountId, targetAccountId, currentPassword) => {
  try {
    const response = await axios.delete(`${API_URL}/student/unlink-account`, {
      data: {
        current_account_id: currentAccountId,
        target_account_id: targetAccountId,
        current_password: currentPassword
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error unlinking account:', error);
    throw error;
  }
};
