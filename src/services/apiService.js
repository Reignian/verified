import axios from 'axios';

// General API service for all pages
export const fetchCredentialTypes = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/credential-types');
    return response.data;
  } catch (error) {
    console.error('Error fetching credential types:', error);
    return [];
  }
};
