const express = require('express');
const cors = require('cors');
require('dotenv').config();
const institutionQueries = require('./src/services/institutionQueries');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API endpoint for Academic Institution page
app.get('/api/credential-types', async (req, res) => {
  try {
    const credentialTypes = await institutionQueries.getCredentialTypes();
    res.json(credentialTypes);
  } catch (error) {
    console.error('Error fetching credential types:', error);
    res.status(500).json({ error: 'Failed to fetch credential types' });
  }
});


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
