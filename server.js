const express = require('express');
const cors = require('cors');
const academicQueries = require('./src/queries/academicInstitutionQueries');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Get credential types
app.get('/api/credential-types', (req, res) => {
  academicQueries.getCredentialTypes((err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Get students
app.get('/api/students', (req, res) => {
  academicQueries.getStudents((err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
