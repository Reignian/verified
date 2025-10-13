    // fileName: adminApiService.js

import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://verified-production.up.railway.app/api'
  : 'http://localhost:3001/api';

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

// Admin Dashboard Statistics
export const fetchSystemStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching system stats:', error);
    throw error;
  }
};

// Institution Management
export const fetchAllInstitutions = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/institutions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching institutions:', error);
    throw error;
  }
};

export const createInstitution = async (institutionData) => {
  try {
    const response = await axios.post(`${API_URL}/admin/institutions`, institutionData);
    return response.data;
  } catch (error) {
    console.error('Error creating institution:', error);
    throw error;
  }
};

export const updateInstitution = async (institutionId, institutionData) => {
  try {
    const response = await axios.put(`${API_URL}/admin/institutions/${institutionId}`, institutionData);
    return response.data;
  } catch (error) {
    console.error('Error updating institution:', error);
    throw error;
  }
};

export const deleteInstitution = async (institutionId) => {
  try {
    const response = await axios.delete(`${API_URL}/admin/institutions/${institutionId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting institution:', error);
    throw error;
  }
};

// Credential Monitoring
export const fetchAllCredentials = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/credentials`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all credentials:', error);
    throw error;
  }
};

export const fetchCredentialVerificationStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/verification-stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching verification stats:', error);
    throw error;
  }
};

// Contact Messages Management
export const fetchAllContactMessages = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/contact-messages`);
    return response.data;
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    throw error;
  }
};

export const updateContactMessageStatus = async (messageId, status) => {
  try {
    const response = await axios.put(`${API_URL}/admin/contact-messages/${messageId}`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating contact message status:', error);
    throw error;
  }
};

export const deleteContactMessage = async (messageId) => {
  try {
    const response = await axios.delete(`${API_URL}/admin/contact-messages/${messageId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting contact message:', error);
    throw error;
  }
};

// System Settings Management
export const fetchSystemSettings = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/system-settings`);
    return response.data;
  } catch (error) {
    console.error('Error fetching system settings:', error);
    throw error;
  }
};

export const updateSystemSettings = async (settings) => {
  try {
    const response = await axios.put(`${API_URL}/admin/system-settings`, settings);
    return response.data;
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
};

export const generateGmailReplyUrl = async (messageId) => {
  try {
    const response = await axios.post(`${API_URL}/admin/contact-messages/${messageId}/gmail-reply`);
    return response.data;
  } catch (error) {
    console.error('Error generating Gmail reply URL:', error);
    throw error;
  }
};