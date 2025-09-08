import React, { useState, useEffect } from 'react';
import './AcademicInstitution.css';
import { fetchCredentialTypes, fetchStudents, uploadCredential } from '../services/apiService';

function AcademicInstitution() {
  const [account, setAccount] = useState(null);
  const [credentialTypes, setCredentialTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    credentialType: '',
    studentAccount: '',
    credentialFile: null
  });
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  useEffect(() => {
    const getAccount = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (error) {
          console.error('Error getting account:', error);
        }
      }
    };

    const loadCredentialTypes = async () => {
      try {
        const types = await fetchCredentialTypes();
        setCredentialTypes(types);
      } catch (error) {
        console.error('Error loading credential types:', error);
      }
    };

    const loadStudents = async () => {
      try {
        const studentData = await fetchStudents();
        setStudents(studentData);
      } catch (error) {
        console.error('Error loading students:', error);
      }
    };

    getAccount();
    loadCredentialTypes();
    loadStudents();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: files ? files[0] : value
    }));
    // Clear upload message when user changes form
    if (uploadMessage) setUploadMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.credentialType || !formData.studentAccount) {
      setUploadMessage('Please select both credential type and student account');
      return;
    }

    if (!formData.credentialFile) {
      setUploadMessage('Please select a credential file to upload');
      return;
    }

    // Get logged-in user ID from localStorage
    const loggedInUserId = localStorage.getItem('userId');
    
    if (!loggedInUserId) {
      setUploadMessage('Please log in again to upload credentials');
      return;
    }
    
    setUploading(true);
    setUploadMessage('');
    
    try {
      const credentialData = {
        credential_type_id: parseInt(formData.credentialType),
        owner_id: parseInt(formData.studentAccount),
        sender_id: parseInt(loggedInUserId)
      };
      
      const response = await uploadCredential(credentialData, formData.credentialFile);
      setUploadMessage(`Credential uploaded successfully! IPFS Hash: ${response.ipfs_hash}`);
      
      // Reset form
      setFormData({
        credentialType: '',
        studentAccount: '',
        credentialFile: null
      });
      
      // Reset file input by clearing its value
      const fileInput = document.getElementById('credentialFile');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Upload failed:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setUploadMessage(`Error: ${error.response.data.error}`);
      } else {
        setUploadMessage('Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1>Academic Institution</h1>
      {account && (
        <div>
          <p><strong>Connected Wallet Address: </strong>{account}</p>
        </div>
      )}

      {/* Credential Upload Form */}
      <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ccc' }}>
        <h2>Upload Credential</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="credentialType">Credential Type:</label>
            <select id="credentialType" name="credentialType" value={formData.credentialType} onChange={handleInputChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
              <option value="">Select Credential Type</option>
              {credentialTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.type_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="studentAccount">Student Account:</label>
            <select id="studentAccount" name="studentAccount" value={formData.studentAccount} onChange={handleInputChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} ({student.public_address})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="credentialFile">Upload Credential File:</label>
            <input 
              type="file" 
              id="credentialFile" 
              name="credentialFile" 
              onChange={handleInputChange} 
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Credential'}
          </button>
          {uploadMessage && <p style={{ color: uploading ? 'blue' : 'green' }}>{uploadMessage}</p>}
        </form>
      </div>
    </div>
  );
}

export default AcademicInstitution;
