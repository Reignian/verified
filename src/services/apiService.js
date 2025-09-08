import axios from 'axios';

// API base URL - works for both development and production
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // In production, use relative path (same domain)
  : 'http://localhost:3001/api';  // In development, use localhost

// Login function
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

// Upload credential function with file support
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

// Get credential types from the server
export const fetchCredentialTypes = async () => {
  try {
    const response = await axios.get(`${API_URL}/credential-types`);
    return response.data;
  } catch (error) {
    console.error('Error fetching credential types:', error);
    throw error;
  }
};

// Get students from the server
export const fetchStudents = async () => {
  try {
    const response = await axios.get(`${API_URL}/students`);
    return response.data;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};
