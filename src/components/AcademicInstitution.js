import React, { useState, useEffect } from 'react';
import './AcademicInstitution.css';
import { fetchCredentialTypes } from '../services/apiService';

function AcademicInstitution() {
  const [account, setAccount] = useState(null);
  const [credentialTypes, setCredentialTypes] = useState([]);

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

    getAccount();
    loadCredentialTypes();
  }, []);

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
        <form>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="credentialType">Credential Type:</label>
            <select id="credentialType" name="credentialType" style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
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
            <select id="studentAccount" name="studentAccount" style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
              <option value="">Select Student</option>
              <option value="student1">John Doe (0x1234...5678)</option>
              <option value="student2">Jane Smith (0x9876...4321)</option>
              <option value="student3">Mike Johnson (0xabcd...efgh)</option>
              <option value="student4">Sarah Wilson (0x1111...2222)</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="credentialFile">Upload Credential File:</label>
            <input 
              type="file" 
              id="credentialFile" 
              name="credentialFile" 
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
            Upload Credential
          </button>
        </form>
      </div>
    </div>
  );
}

export default AcademicInstitution;
