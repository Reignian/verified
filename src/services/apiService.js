// fileName: apiService.js

import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api'
  : 'http://localhost:3001/api';

// Login function
export const login = async (username, password, userType) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      username,
      password,
      userType
    });
    return response.data;
  } catch (error) {
    console.error('Error during login:', error);
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

export const bulkImportStudents = async (file) => {
  try {
    const formData = new FormData();
    formData.append('studentFile', file);

    const response = await axios.post(`${API_URL}/bulk-import-students`, formData, {
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

// REMOVED: addCredentialType function (no longer needed)

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

export const fetchStudents = async () => {
  try {
    const response = await axios.get(`${API_URL}/students`);
    return response.data;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

export const fetchIssuedCredentials = async () => {
  try {
    const response = await axios.get(`${API_URL}/issued-credentials`);
    return response.data;
  } catch (error) {
    console.error('Error fetching issued credentials:', error);
    throw error;
  }
};

export const fetchCredentialStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/credential-stats`);
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

export const fetchStudentCredentials = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/student/${studentId}/credentials`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student credentials:', error);
    throw error;
  }
};