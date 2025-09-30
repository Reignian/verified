// fileName: publicApiService.js
// Frontend API service for public pages (HomePage - Contact & Verification)

import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api'
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
