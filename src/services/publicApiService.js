// fileName: publicApiService.js
// Frontend API service for public pages (HomePage - Contact & Verification)

import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://verified-production.up.railway.app/api'
  : 'http://localhost:3001/api';

// Contact form submission
export const submitContactForm = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/public/contact`, formData);
    return response.data;
  } catch (error) {
    console.error('Error submitting contact form:', error);
    throw error;
  }
};

// Verify credential by access code
export const verifyCredential = async (accessCode) => {
  try {
    const response = await axios.post(`${API_URL}/public/verify-credential`, {
      accessCode
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying credential:', error);
    throw error;
  }
};

// Compare credential file with uploaded file
export const compareCredentialFile = async (credentialId, file) => {
  try {
    const formData = new FormData();
    formData.append('credentialId', credentialId);
    formData.append('file', file);
    
    const response = await axios.post(`${API_URL}/public/compare-credential`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000 // 2 minute timeout for OCR processing
    });
    
    return response.data;
  } catch (error) {
    console.error('Error comparing credential file:', error);
    throw error;
  }
};

// Verify credential by uploading file directly (no access code needed)
export const verifyCredentialByFile = async (file, abortSignal) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 600000, // 10 minute timeout for OCR + AI extraction + full AI-enhanced comparison
    };
    
    // Add abort signal if provided
    if (abortSignal) {
      config.signal = abortSignal;
    }
    
    const response = await axios.post(`${API_URL}/public/verify-by-file`, formData, config);
    
    return response.data;
  } catch (error) {
    if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      console.log('Request cancelled by user');
      const cancelError = new Error('canceled');
      cancelError.name = 'AbortError';
      throw cancelError;
    }
    console.error('Error verifying credential by file:', error);
    throw error;
  }
};
