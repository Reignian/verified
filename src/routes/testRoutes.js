// testRoutes.js - Test routes for Gemini API
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// POST /api/test/gemini - Test Gemini API connection
router.post('/gemini', async (req, res) => {
  try {
    const { message } = req.body;
    
    console.log('\n=== GEMINI API TEST ===');
    console.log('API Key present:', !!process.env.GEMINI_API_KEY);
    console.log('API Key length:', process.env.GEMINI_API_KEY?.length);
    console.log('Test message:', message);
    
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: false,
        error: 'GEMINI_API_KEY not found in environment variables',
        details: 'Please add GEMINI_API_KEY to your .env file'
      });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try gemini-2.0-flash (newest model, works with free tier)
    console.log('Attempting to use gemini-2.0-flash...');
    
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash'
      });
      
      console.log('Model initialized, sending request...');
      
      const result = await model.generateContent(message || 'Say "Hello! I am working correctly." if you can read this.');
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ SUCCESS! Response received');
      console.log('Response length:', text.length);
      
      return res.json({
        success: true,
        model: 'gemini-2.0-flash',
        response: text,
        timestamp: new Date().toISOString()
      });
      
    } catch (flashError) {
      console.log('❌ gemini-2.0-flash failed:', flashError.message);
      
      // Try gemini-1.5-flash as backup
      console.log('Trying gemini-1.5-flash...');
      try {
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash'
        });
        
        const result = await model.generateContent(message || 'Say "Hello! I am working correctly." if you can read this.');
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ gemini-1.5-flash SUCCESS!');
        
        return res.json({
          success: true,
          model: 'gemini-1.5-flash',
          response: text,
          note: 'gemini-2.0-flash failed, using gemini-1.5-flash instead',
          timestamp: new Date().toISOString()
        });
        
      } catch (flash15Error) {
        console.log('❌ gemini-1.5-flash also failed:', flash15Error.message);
        console.log('❌ All models failed');
        
        return res.json({
          success: false,
          error: 'All Gemini models failed',
          details: {
            'gemini-2.0-flash': flashError.message,
            'gemini-1.5-flash': flash15Error.message
          },
          suggestion: 'Your API key may not have access to these models. Check Google AI Studio: https://aistudio.google.com/'
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error in Gemini test:', error);
    
    return res.json({
      success: false,
      error: error.message,
      details: error.stack,
      suggestion: 'Check if your API key is valid at https://aistudio.google.com/'
    });
  }
});

module.exports = router;
