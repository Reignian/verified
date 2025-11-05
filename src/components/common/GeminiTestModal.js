// GeminiTestModal.js - Test Gemini API connection on startup
import React, { useState, useEffect } from 'react';
import './GeminiTestModal.css';

const GeminiTestModal = () => {
  const [show, setShow] = useState(true);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // 'success', 'error', or null
  const [apiKeyStatus, setApiKeyStatus] = useState('checking');

  // Auto-test on mount
  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setLoading(true);
    setTestStatus(null);
    setResponse('Testing Gemini API connection...');

    try {
      const res = await fetch('http://localhost:3001/api/test/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Hello! Can you confirm you are working?'
        })
      });

      const data = await res.json();

      if (data.success) {
        setTestStatus('success');
        setApiKeyStatus('valid');
        setResponse(`SUCCESS!\n\nModel: ${data.model}\nResponse: ${data.response}\n\nYour Gemini API is working correctly!`);
      } else {
        setTestStatus('error');
        setApiKeyStatus('invalid');
        setResponse(`ERROR\n\n${data.error}\n\nDetails: ${data.details || 'No additional details'}`);
      }
    } catch (error) {
      setTestStatus('error');
      setApiKeyStatus('error');
      setResponse(`CONNECTION ERROR\n\nCannot reach server: ${error.message}\n\nMake sure your backend server is running on port 3001.`);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setResponse('Sending message to Gemini...');

    try {
      const res = await fetch('http://localhost:3001/api/test/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
      });

      const data = await res.json();

      if (data.success) {
        setTestStatus('success');
        setResponse(`Gemini Response:\n\n${data.response}`);
      } else {
        setTestStatus('error');
        setResponse(`Error: ${data.error}`);
      }
    } catch (error) {
      setTestStatus('error');
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!show) return null;

  return (
    <div className="gemini-test-overlay">
      <div className="gemini-test-modal">
        <div className="gemini-test-header">
          <h3>Gemini API Connection Test</h3>
          <button className="close-btn" onClick={() => setShow(false)}>×</button>
        </div>

        <div className="gemini-test-body">
          {/* API Key Status */}
          <div className={`api-status api-status-${apiKeyStatus}`}>
            <strong>API Key Status:</strong> 
            {apiKeyStatus === 'checking' && ' Checking...'}
            {apiKeyStatus === 'valid' && ' Valid & Working'}
            {apiKeyStatus === 'invalid' && ' Invalid or No Access'}
            {apiKeyStatus === 'error' && ' Connection Error'}
          </div>

          {/* Response Display */}
          <div className={`response-box ${testStatus}`}>
            <pre>{response || 'Waiting for test...'}</pre>
          </div>

          {/* Chat Input */}
          <div className="chat-input-section">
            <textarea
              className="chat-input"
              placeholder="Type a message to test Gemini API..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              rows="3"
            />
            <div className="button-group">
              <button 
                className="btn-test" 
                onClick={sendMessage}
                disabled={loading || !message.trim()}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
              <button 
                className="btn-retest" 
                onClick={testConnection}
                disabled={loading}
              >
                Retest Connection
              </button>
            </div>
          </div>

          {/* Help Text */}
          <div className="help-text">
            <small>
              <strong>Free Tier Limits:</strong> 60 requests/minute, 1,500 requests/day
              <br />
              <strong>Active Model:</strong> gemini-2.0-flash-exp (multimodal - text & images)
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeminiTestModal;
