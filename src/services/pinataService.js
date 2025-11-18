const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const FormData = require('form-data');
const { Readable } = require('stream');
const { logMetric } = require('./metricsService');

// Initialize Pinata with your credentials
const pinata = new pinataSDK('991fce5c15746a608dbf', 'b05c5ec4f007e291be2427b1df8bd6341a1b3c9c141b5f9be04fad6dde86d015');

// Test Pinata connection
const testConnection = async () => {
  try {
    const result = await pinata.testAuthentication();
    console.log('Pinata connection successful:', result);
    return result;
  } catch (error) {
    console.error('Pinata connection failed:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

// Upload file to Pinata IPFS
const uploadToPinata = async (file, metadata = {}) => {
  const startTime = Date.now();
  try {
    const options = {
      pinataMetadata: {
        name: metadata.name || 'Credential File',
        keyvalues: {
          uploadedBy: metadata.uploadedBy || 'Academic Institution',
          credentialType: metadata.credentialType || 'Unknown',
          timestamp: new Date().toISOString()
        }
      },
      pinataOptions: {
        cidVersion: 0
      }
    };

    const result = await pinata.pinFileToIPFS(file, options);
    console.log('File uploaded to Pinata:', result);

    const durationMs = Date.now() - startTime;
    logMetric({
      name: 'IPFS_UploadToPinata',
      durationMs,
      extra: {
        success: true,
        name: metadata.name || 'Credential File',
        uploadedBy: metadata.uploadedBy || 'Academic Institution',
        credentialType: metadata.credentialType || 'Unknown',
        ipfsHash: result.IpfsHash
      }
    });

    return {
      ipfsHash: result.IpfsHash,
      pinSize: result.PinSize,
      timestamp: result.Timestamp
    };
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    console.error('Error message:', error.message);
    console.error('Error response:', error.response?.data);

    const durationMs = Date.now() - startTime;
    logMetric({
      name: 'IPFS_UploadToPinata',
      durationMs,
      extra: {
        success: false,
        name: metadata.name || 'Credential File',
        uploadedBy: metadata.uploadedBy || 'Academic Institution',
        credentialType: metadata.credentialType || 'Unknown',
        error: error.message
      }
    });
    throw error;
  }
};

// Upload file buffer to Pinata (for handling file uploads from frontend)
const uploadBufferToPinata = async (buffer, filename, metadata = {}) => {
  const startTime = Date.now();
  try {

    // Convert buffer to readable stream
    const readableStream = new Readable({
      read() {}
    });
    readableStream.push(buffer);
    readableStream.push(null); // End the stream

    const options = {
      pinataMetadata: {
        name: filename,
        keyvalues: {
          uploadedBy: metadata.uploadedBy || 'Academic Institution',
          credentialType: metadata.credentialType || 'Unknown',
          timestamp: new Date().toISOString()
        }
      },
      pinataOptions: {
        cidVersion: 0
      }
    };
    
    // Use pinFileToIPFS with readable stream
    const result = await pinata.pinFileToIPFS(readableStream, options);

    return {
      ipfsHash: result.IpfsHash,
      pinSize: result.PinSize,
      timestamp: result.Timestamp
    };
  } catch (error) {
    console.error('Error in uploadBufferToPinata:', error);
    console.error('Error message:', error.message);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

module.exports = {
  testConnection,
  uploadToPinata,
  uploadBufferToPinata
};
