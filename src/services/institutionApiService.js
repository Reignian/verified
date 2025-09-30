// fileName: institutionApiService.js (Consolidated by Institution Dashboard Page)
// All API calls used by AcademicInstitution dashboard

import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api'
  : 'http://localhost:3001/api';

// ============ INSTITUTION INFO ============

// Get institution name by account ID
export const fetchInstitutionName = async (accountId) => {
  try {
    const response = await axios.get(`${API_URL}/institution/${accountId}/name`);
    return response.data;
  } catch (error) {
    console.error('Error fetching institution name:', error);
    throw error;
  }
};

// ============ STUDENT MANAGEMENT ============

// Add single student account
export const addStudent = async (studentData, institutionId) => {
  try {
    const response = await axios.post(`${API_URL}/institution/students/add/${institutionId}`, studentData);
    return response.data;
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
};

// Bulk import students with institution ID
export const bulkImportStudents = async (file, institutionId) => {
  try {
    const formData = new FormData();
    formData.append('studentFile', file);

    const response = await axios.post(`${API_URL}/institution/students/bulk-import/${institutionId}`, formData, {
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

// Fetch students filtered by institution
export const fetchStudents = async (institutionId) => {
  try {
    const response = await axios.get(`${API_URL}/institution/students/${institutionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

// Get student credentials for management page (simplified view)
export const fetchStudentCredentialsForManagement = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/institution/students/by-id/${studentId}/credentials-management`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student credentials for management:', error);
    throw error;
  }
};

// ============ CREDENTIAL ISSUANCE ============

// Fetch credential types
export const fetchCredentialTypes = async () => {
  try {
    const response = await axios.get(`${API_URL}/institution/credential-types`);
    return response.data;
  } catch (error) {
    console.error('Error fetching credential types:', error);
    throw error;
  }
};

// Fetch recent custom credential type
export const fetchRecentCustomType = async () => {
  try {
    const response = await axios.get(`${API_URL}/institution/recent-custom-type`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recent custom type:', error);
    throw error;
  }
};

// Upload credential to handle custom types
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

    const response = await axios.post(`${API_URL}/institution/upload-credential`, formData, {
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

// Update credential's blockchain_id after on-chain issuance
export const updateBlockchainId = async (credentialId, blockchainId) => {
  try {
    const response = await axios.post(`${API_URL}/institution/update-blockchain-id`, {
      credential_id: credentialId,
      blockchain_id: blockchainId,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating blockchain ID:', error);
    throw error;
  }
};

// ============ DASHBOARD STATS ============

// Fetch issued credentials filtered by institution
export const fetchIssuedCredentials = async (institutionId) => {
  try {
    const response = await axios.get(`${API_URL}/institution/issued-credentials/${institutionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching issued credentials:', error);
    throw error;
  }
};

// Fetch credential stats filtered by institution
export const fetchCredentialStats = async (institutionId) => {
  try {
    const response = await axios.get(`${API_URL}/institution/credential-stats/${institutionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching credential stats:', error);
    throw error;
  }
};
