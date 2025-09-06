import React, { useState, useEffect } from 'react';
import './AcademicInstitution.css';

function AcademicInstitution() {
  const [account, setAccount] = useState(null);

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

    getAccount();
  }, []);

  return (
    <div>
      <h1>Academic Institution</h1>
      {account && (
        <div>
          <p><strong>Connected Wallet Address: </strong>{account}</p>
        </div>
      )}
    </div>
  );
}

export default AcademicInstitution;
