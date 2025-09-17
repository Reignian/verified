// fileName: apiService.js

import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api'
  : 'http://localhost:3001/api';

export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      username,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

export const uploadCredential = async (credentialData, file) => {
  try {
    const formData = new FormData();
    formData.append('credential_type_id', credentialData.credential_type_id);
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

// NEW: Add a new credential type to the database
export const addCredentialType = async (typeName) => {
  try {
    const response = await axios.post(`${API_URL}/credential-types`, {
      type_name: typeName
    });
    return response.data;
  } catch (error) {
    console.error('Error adding credential type:', error);
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

export const fetchStudents = async () => {
  try {
    const response = await axios.get(`${API_URL}/students`);
    return response.data;
  } catch (error) { // FIXED: Added missing curly brace here
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