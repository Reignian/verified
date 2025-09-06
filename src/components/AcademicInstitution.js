import React, { useState, useEffect } from 'react';
import './AcademicInstitution.css';
import { fetchCredentialTypes, fetchStudents } from '../services/apiService';

function AcademicInstitution() {
  const [account, setAccount] = useState(null);
  const [credentialTypes, setCredentialTypes] = useState([]);
  const [students, setStudents] = useState([]);

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
