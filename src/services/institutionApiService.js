// fileName: institutionApiService.js (Consolidated by Institution Dashboard Page)
// All API calls used by AcademicInstitution dashboard

import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://verified-production.up.railway.app/api'
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

// Get institution public address by account ID
export const getInstitutionPublicAddress = async (accountId) => {
  try {
    const response = await axios.get(`${API_URL}/institution/${accountId}/public-address`);
    return response.data;
  } catch (error) {
    console.error('Error fetching institution public address:', error);
    throw error;
  }
};

// Get all institution addresses with history
export const getInstitutionAddresses = async (accountId) => {
  try {
    const response = await axios.get(`${API_URL}/institution/${accountId}/addresses`);
    return response.data;
  } catch (error) {
    console.error('Error fetching institution addresses:', error);
    throw error;
  }
};

// Update institution public address by account ID
// Also creates a record in institution_addresses table for historical tracking
export const updateInstitutionPublicAddress = async (accountId, publicAddress) => {
  try {
    const response = await axios.put(`${API_URL}/institution/${accountId}/public-address`, {
      public_address: publicAddress
    });
    return response.data;
  } catch (error) {
    console.error('Error updating institution public address:', error);
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
    
    // Add program_id if provided
    if (credentialData.program_id) {
      formData.append('program_id', credentialData.program_id);
    }
    
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

// Upload credential after blockchain confirmation (blockchain-first approach)
export const uploadCredentialAfterBlockchain = async (credentialData, file, credentialId, transactionHash) => {
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
    formData.append('blockchain_id', credentialId);  // Store credential ID from smart contract
    formData.append('transaction_hash', transactionHash || '');  // Store transaction hash for reference
    
    // Add program_id if provided
    if (credentialData.program_id) {
      formData.append('program_id', credentialData.program_id);
    }
    
    if (file) {
      formData.append('credentialFile', file);
    }

    const response = await axios.post(`${API_URL}/institution/upload-credential-after-blockchain`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading credential after blockchain:', error);
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

// Fetch dashboard statistics (students count, credentials count, daily verifications)
export const fetchDashboardStats = async (institutionId) => {
  try {
    const response = await axios.get(`${API_URL}/institution/dashboard-stats/${institutionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// ============ INSTITUTION PROFILE ============

// Get institution profile information
export const fetchInstitutionProfile = async (institutionId) => {
  try {
    const response = await axios.get(`${API_URL}/institution/${institutionId}/profile`);
    return response.data;
  } catch (error) {
    console.error('Error fetching institution profile:', error);
    throw error;
  }
};

// Update institution profile
export const updateInstitutionProfile = async (institutionId, profileData) => {
  try {
    const response = await axios.put(`${API_URL}/institution/${institutionId}/profile`, profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating institution profile:', error);
    throw error;
  }
};

// ============ STAFF MANAGEMENT ============

// Get all staff members for an institution
export const fetchInstitutionStaff = async (institutionId) => {
  try {
    const response = await axios.get(`${API_URL}/institution/${institutionId}/staff`);
    return response.data;
  } catch (error) {
    console.error('Error fetching institution staff:', error);
    throw error;
  }
};

// Add a new staff member
export const addInstitutionStaff = async (institutionId, staffData) => {
  try {
    const response = await axios.post(`${API_URL}/institution/${institutionId}/staff`, staffData);
    return response.data;
  } catch (error) {
    console.error('Error adding institution staff:', error);
    throw error;
  }
};

// Delete a staff member
export const deleteInstitutionStaff = async (staffId) => {
  try {
    const response = await axios.delete(`${API_URL}/institution/staff/${staffId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting institution staff:', error);
    throw error;
  }
};

// ============ PROGRAM MANAGEMENT ============

// Get all programs for an institution
export const fetchInstitutionPrograms = async (institutionId) => {
  try {
    const response = await axios.get(`${API_URL}/institution/${institutionId}/programs`);
    return response.data;
  } catch (error) {
    console.error('Error fetching institution programs:', error);
    throw error;
  }
};

// Add a new program
export const addInstitutionProgram = async (institutionId, programData) => {
  try {
    const response = await axios.post(`${API_URL}/institution/${institutionId}/programs`, programData);
    return response.data;
  } catch (error) {
    console.error('Error adding institution program:', error);
    throw error;
  }
};

// Delete a program
export const deleteInstitutionProgram = async (programId) => {
  try {
    const response = await axios.delete(`${API_URL}/institution/programs/${programId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting institution program:', error);
    throw error;
  }
};

// ============ CREDENTIAL MANAGEMENT ============

// Delete a credential (set status to 'deleted')
export const deleteCredential = async (credentialId) => {
  try {
    const response = await axios.delete(`${API_URL}/institution/credential/${credentialId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting credential:', error);
    throw error;
  }
};
