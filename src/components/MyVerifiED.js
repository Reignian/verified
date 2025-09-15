import React, { useState, useEffect } from 'react';

function MyVerifiED() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user info from localStorage
    const userId = localStorage.getItem('userId');
    const userType = localStorage.getItem('userType');
    
    if (userId && userType === 'student') {
      setUser({ id: userId, type: userType });
      // TODO: Fetch student's credentials from API
      setTimeout(() => {
        setCredentials([
          {
            id: 1,
            type: 'Bachelor of Science',
            subject: 'Computer Science',
            issuer: 'Western Mindanao State University',
            date: '2024-05-15',
            status: 'Verified',
            ipfs_hash: 'QmX7Y8Z9...',
            blockchain_id: '12345'
          }
        ]);
        setLoading(false);
      }, 1000);
    } else {
      setLoading(false);
    }
  }, []);

  const handleShareCredential = (credentialId) => {
    alert(`Sharing credential ${credentialId} - Feature coming soon!`);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading your credentials...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Please log in as a student to view your credentials</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', paddingTop: '100px' }}>
      <h1>My VerifiED Dashboard</h1>
      <p>Welcome to your credential management portal</p>
      
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Account Information</h3>
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Account Type:</strong> Student</p>
      </div>

      <div>
        <h2>My Credentials ({credentials.length})</h2>
        
        {credentials.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <p>No credentials found. Your verified credentials will appear here once issued by institutions.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {credentials.map((credential) => (
              <div key={credential.id} style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 10px 0', color: '#4050b5' }}>
                      {credential.type}
                    </h3>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>Subject:</strong> {credential.subject}
                    </p>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>Issued by:</strong> {credential.issuer}
                    </p>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>Date:</strong> {credential.date}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: '#4caf50',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {credential.status}
                    </span>
                  </div>
                </div>
                
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                  <p style={{ margin: '5px 0', fontSize: '12px', color: '#888' }}>
                    <strong>IPFS Hash:</strong> {credential.ipfs_hash}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '12px', color: '#888' }}>
                    <strong>Blockchain ID:</strong> {credential.blockchain_id}
                  </p>
                </div>
                
                <div style={{ marginTop: '15px' }}>
                  <button
                    onClick={() => handleShareCredential(credential.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#4050b5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginRight: '10px'
                    }}
                  >
                    Share Credential
                  </button>
                  <button
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyVerifiED;