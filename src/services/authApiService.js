// fileName: authApiService.js
// Frontend API service for authentication operations

import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://verified-production.up.railway.app/api'
  : 'http://localhost:3001/api';

// Login function
export const login = async (emailOrUsername, password, userType) => {
  try {
    const requestData = { emailOrUsername, password };
    // Only include userType if it's provided (not for admin login)
    if (userType) {
      requestData.userType = userType;
    }
    
    const response = await axios.post(`${API_URL}/auth/login`, requestData);
    return response.data;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};
