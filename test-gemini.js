// Test Gemini API Key
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API...');
    console.log('API Key:', process.env.GEMINI_API_KEY ? 'Present (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'MISSING');
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try gemini-1.5-flash first
    console.log('\n--- Testing gemini-1.5-flash ---');
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent('Say "Hello, I am working!" if you can read this.');
      const response = await result.response;
      const text = response.text();
      console.log('✅ gemini-1.5-flash WORKS!');
      console.log('Response:', text);
    } catch (error) {
      console.log('❌ gemini-1.5-flash FAILED');
      console.log('Error:', error.message);
      if (error.response) {
        console.log('API Response:', JSON.stringify(error.response, null, 2));
      }
    }
    
    // Try gemini-1.5-pro as backup
    console.log('\n--- Testing gemini-1.5-pro ---');
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result = await model.generateContent('Say "Hello, I am working!" if you can read this.');
      const response = await result.response;
      const text = response.text();
      console.log('✅ gemini-1.5-pro WORKS!');
      console.log('Response:', text);
    } catch (error) {
      console.log('❌ gemini-1.5-pro FAILED');
      console.log('Error:', error.message);
    }
    
    // Try gemini-pro (text only, older)
    console.log('\n--- Testing gemini-pro ---');
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent('Say "Hello, I am working!" if you can read this.');
      const response = await result.response;
      const text = response.text();
      console.log('✅ gemini-pro WORKS!');
      console.log('Response:', text);
    } catch (error) {
      console.log('❌ gemini-pro FAILED');
      console.log('Error:', error.message);
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

testGeminiAPI();
