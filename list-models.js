// List available Gemini models for your API key
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  try {
    console.log('Fetching available models for your API key...\n');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try to list models
    const models = await genAI.listModels();
    
    console.log('✅ Available Models:\n');
    
    for (const model of models) {
      console.log(`Model: ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Description: ${model.description}`);
      console.log(`  Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log(`  Input Token Limit: ${model.inputTokenLimit}`);
      console.log(`  Output Token Limit: ${model.outputTokenLimit}`);
      console.log('---');
    }
    
  } catch (error) {
    console.error('❌ Error listing models:', error.message);
    console.error('\nThis might mean:');
    console.error('1. Your API key is invalid');
    console.error('2. The API endpoint has changed');
    console.error('3. Your API key doesn\'t have permission to list models');
    console.error('\nTry testing your API key at: https://aistudio.google.com/');
  }
}

listModels();
