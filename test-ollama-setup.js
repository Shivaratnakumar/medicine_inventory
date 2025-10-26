const axios = require('axios');

async function testOllamaSetup() {
  console.log('🔧 Testing Ollama Setup...\n');

  const OLLAMA_URL = 'http://localhost:11434';

  try {
    // Test 1: Check if Ollama service is running
    console.log('1. Checking if Ollama service is running...');
    const response = await axios.get(`${OLLAMA_URL}/api/tags`, {
      timeout: 5000
    });
    
    console.log('✅ Ollama service is running!');
    console.log('Available models:', response.data.models?.map(m => m.name) || []);
    console.log('');

    // Test 2: Test a simple query
    console.log('2. Testing a simple medicine query...');
    const testQuery = {
      model: 'llama3.2', // Change this to your installed model
      prompt: 'List 3 common pain relief medicines:',
      stream: false
    };

    const queryResponse = await axios.post(`${OLLAMA_URL}/api/generate`, testQuery, {
      timeout: 30000
    });

    console.log('✅ Ollama query successful!');
    console.log('Response:', queryResponse.data.response);
    console.log('');

    // Test 3: Test medicine-specific query
    console.log('3. Testing medicine search query...');
    const medicineQuery = {
      model: 'llama3.2',
      prompt: 'Search for medicines related to "fever": Paracetamol, Ibuprofen, Aspirin',
      stream: false
    };

    const medicineResponse = await axios.post(`${OLLAMA_URL}/api/generate`, medicineQuery, {
      timeout: 30000
    });

    console.log('✅ Medicine query successful!');
    console.log('Response:', medicineResponse.data.response);
    console.log('');

    console.log('🎉 Ollama setup is working correctly!');
    console.log('You can now use the medicine search with AI integration.');

  } catch (error) {
    console.error('❌ Ollama setup test failed:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   - Ollama service is not running');
      console.error('   - Start it with: ollama serve');
    } else if (error.code === 'ENOTFOUND') {
      console.error('   - Ollama is not installed or not in PATH');
      console.error('   - Install Ollama from https://ollama.ai/download');
    } else if (error.response?.status === 404) {
      console.error('   - No models installed');
      console.error('   - Install a model with: ollama pull llama3.2');
    } else {
      console.error('   - Error:', error.message);
    }
    
    console.log('\n📋 Setup Checklist:');
    console.log('   1. Install Ollama: https://ollama.ai/download');
    console.log('   2. Start service: ollama serve');
    console.log('   3. Install model: ollama pull llama3.2');
    console.log('   4. Run this test again');
  }
}

// Run the test
if (require.main === module) {
  testOllamaSetup();
}

module.exports = { testOllamaSetup };
