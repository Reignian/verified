import React, { useState, useEffect } from 'react';
import './AcademicInstitution.css';
import { fetchCredentialTypes, fetchStudents, uploadCredential } from '../services/apiService';
import blockchainService from '../services/blockchainService';

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
          let accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          
          if (accounts.length === 0) {
            accounts = await window.ethereum.request({
              method: 'eth_requestAccounts'
            });
          }
          
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (error) {
          console.error('MetaMask connection failed:', error);
        }
      }
    };

    const loadData = async () => {
      try {
        const [types, studentData] = await Promise.all([
          fetchCredentialTypes(),
          fetchStudents()
        ]);
        setCredentialTypes(types);
        setStudents(studentData);
      } catch (error) {
        console.error('Data loading failed:', error);
      }
    };

    getAccount();
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: files ? files[0] : value
    }));
    if (uploadMessage) setUploadMessage('');
  };

  const resetForm = () => {
    setFormData({
      credentialType: '',
      studentAccount: '',
      credentialFile: null
    });
    const fileInput = document.getElementById('credentialFile');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.credentialType || !formData.studentAccount || !formData.credentialFile) {
      setUploadMessage('Please fill all required fields');
      return;
    }

    const loggedInUserId = localStorage.getItem('userId');
    if (!loggedInUserId) {
      setUploadMessage('Please log in again');
      return;
    }
    
    setUploading(true);
    setUploadMessage('Uploading...');
    
    try {
      const credentialData = {
        credential_type_id: parseInt(formData.credentialType),
        owner_id: parseInt(formData.studentAccount),
        sender_id: parseInt(loggedInUserId)
      };
      
      const response = await uploadCredential(credentialData, formData.credentialFile);
      const blockchainResult = await blockchainService.issueCredential(
        response.ipfs_hash, 
        formData.studentAccount.toString()
      );
      
      const updateResponse = await fetch('http://localhost:3001/api/update-blockchain-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential_id: response.credential_id,
          blockchain_id: blockchainResult.credentialId
        }),
      });
      
      if (!updateResponse.ok) {
        throw new Error('Database update failed');
      }
      
      setUploadMessage(`✅ Success! IPFS: ${response.ipfs_hash} | Blockchain: ${blockchainResult.credentialId} | TX: ${blockchainResult.transactionHash}`);
      resetForm();
      
    } catch (error) {
      setUploadMessage(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1>Academic Institution</h1>
      {account && (
        <div>
          <p><strong>Connected Wallet: </strong>{account}</p>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ccc' }}>
        <h2>Upload Credential</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="credentialType">Credential Type:</label>
            <select 
              id="credentialType" 
              name="credentialType" 
              value={formData.credentialType} 
              onChange={handleInputChange} 
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            >
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
            <select 
              id="studentAccount" 
              name="studentAccount" 
              value={formData.studentAccount} 
              onChange={handleInputChange} 
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            >
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

          <button 
            type="submit" 
            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }} 
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Credential'}
          </button>
          {uploadMessage && <p style={{ color: uploading ? 'blue' : 'green' }}>{uploadMessage}</p>}
        </form>
      </div>
    </div>
  );
}

export default AcademicInstitution;
