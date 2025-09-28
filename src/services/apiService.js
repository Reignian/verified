// fileName: apiService.js (Updated with contact form and admin imports)

import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api'
  : 'http://localhost:3001/api';

// Login function
export const login = async (username, password, userType) => {
  try {
    const requestData = { username, password };
    // Only include userType if it's provided (not for admin login)
    if (userType) {
      requestData.userType = userType;
    }
    
    const response = await axios.post(`${API_URL}/login`, requestData);
    return response.data;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

// Contact form submission
export const submitContactForm = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/contact`, formData);
    return response.data;
  } catch (error) {
    console.error('Error submitting contact form:', error);
    throw error;
  }
};

// NEW: Get institution name by account ID
export const fetchInstitutionName = async (accountId) => {
  try {
    const response = await axios.get(`${API_URL}/institution/${accountId}/name`);
    return response.data;
  } catch (error) {
    console.error('Error fetching institution name:', error);
    throw error;
  }
};

// UPDATED: Upload credential to handle custom types
export const uploadCredential = async (credentialData, file) => {
  try {
    const formData = new FormData();
    
    // Handle either standard or custom credential type
    if (credentialData.custom_type) {
      formData.append('custom_type', credentialData.custom_type);
    } else {
      formData.append('credential_type_id', credentialData.credential_type_id);
    }
    
    formData.append('owner_id', credentialData.owner_id);
    formData.append('sender_id', credentialData.sender_id);
    
    if (file) {
      formData.append('credentialFile', file);
    }

    const response = await axios.post(`${API_URL}/upload-credential`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading credential:', error);
    throw error;
  }
};

// UPDATED: Bulk import students with institution ID
export const bulkImportStudents = async (file, institutionId) => {
  try {
    const formData = new FormData();
    formData.append('studentFile', file);

    const response = await axios.post(`${API_URL}/bulk-import-students/${institutionId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error during bulk import:', error);
    throw error;
  }
};

export const fetchCredentialTypes = async () => {
  try {
    const response = await axios.get(`${API_URL}/credential-types`);
    return response.data;
  } catch (error) {
    console.error('Error fetching credential types:', error);
    throw error;
  }
};

// NEW: Fetch recent custom credential type
export const fetchRecentCustomType = async () => {
  try {
    const response = await axios.get(`${API_URL}/recent-custom-type`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recent custom type:', error);
    throw error;
  }
};

// UPDATED: Fetch students filtered by institution
export const fetchStudents = async (institutionId) => {
  try {
    const response = await axios.get(`${API_URL}/students/${institutionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

// UPDATED: Fetch issued credentials filtered by institution
export const fetchIssuedCredentials = async (institutionId) => {
  try {
    const response = await axios.get(`${API_URL}/issued-credentials/${institutionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching issued credentials:', error);
    throw error;
  }
};

// UPDATED: Fetch credential stats filtered by institution
export const fetchCredentialStats = async (institutionId) => {
  try {
    const response = await axios.get(`${API_URL}/credential-stats/${institutionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching credential stats:', error);
    throw error;
  }
};

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

// EXISTING: Get student credentials (for MyVerifiED page)
export const fetchStudentCredentials = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/student/${studentId}/credentials`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student credentials:', error);
    throw error;
  }
};

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

// NEW: Get student credentials for management page (simplified view)
export const fetchStudentCredentialsForManagement = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/student/${studentId}/credentials-management`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student credentials for management:', error);
    throw error;
  }
};

// Generate a new access code for a credential
export const generateCredentialAccessCode = async (credentialId) => {
  try {
    const response = await axios.post(`${API_URL}/generate-access-code`, {
      credential_id: credentialId,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating access code:', error);
    throw error;
  }
};

// Verify credential by access code
export const verifyCredential = async (accessCode) => {
  try {
    const response = await axios.post(`${API_URL}/verify-credential`, {
      accessCode
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying credential:', error);
    throw error;
  }
};

// Update access code status (active/inactive)
export const updateAccessCodeStatus = async (accessCode, isActive) => {
  try {
    const response = await axios.put(`${API_URL}/update-access-code-status`, {
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
    const response = await axios.delete(`${API_URL}/delete-access-code`, {
      data: { access_code: accessCode }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting access code:', error);
    throw error;
  }
};

// Link student accounts into a single group
export const linkAccount = async (currentAccountId, targetEmail, targetPassword, targetStudentId) => {
  try {
    const response = await axios.post(`${API_URL}/link-account`, {
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
    const response = await axios.get(`${API_URL}/linked-accounts`, {
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
    const response = await axios.delete(`${API_URL}/unlink-account`, {
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