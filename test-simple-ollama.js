const axios = require('axios');

// Simple test for Ollama integration without authentication
async function testSimpleOllama() {
  console.log('🧪 Testing Ollama Integration (Simple Test)...\n');

  const API_BASE_URL = 'http://localhost:5000/api';

  try {
    // Test 1: Check if server is running
    console.log('1. Checking server status...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Server is running');
    console.log('   Status:', healthResponse.data.status);
    console.log('   Database:', healthResponse.data.database);
    console.log('');

    // Test 2: Check if medicine-names routes exist
    console.log('2. Checking medicine-names routes...');
    try {
      const routesResponse = await axios.get(`${API_BASE_URL}/medicine-names`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Medicine-names routes are working');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Medicine-names routes exist (authentication required)');
      } else {
        console.log('❌ Medicine-names routes issue:', error.response?.data?.message || error.message);
      }
    }
    console.log('');

    // Test 3: Check Ollama status endpoint
    console.log('3. Checking Ollama status endpoint...');
    try {
      const ollamaStatusResponse = await axios.get(`${API_BASE_URL}/medicine-names/ollama-status`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Ollama status endpoint is working');
      console.log('   Response:', ollamaStatusResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Ollama status endpoint exists (authentication required)');
        console.log('   This is expected - the endpoint requires authentication');
      } else if (error.response?.status === 404) {
        console.log('❌ Ollama status endpoint not found');
        console.log('   The server may need to be restarted to load new routes');
      } else {
        console.log('❌ Ollama status endpoint error:', error.response?.data?.message || error.message);
      }
    }
    console.log('');

    // Test 4: Check if Ollama service is running locally
    console.log('4. Checking if Ollama service is running locally...');
    try {
      const ollamaResponse = await axios.get('http://localhost:11434/api/tags', {
        timeout: 5000
      });
      console.log('✅ Ollama service is running locally');
      console.log('   Available models:', ollamaResponse.data.models?.map(m => m.name) || []);
    } catch (error) {
      console.log('❌ Ollama service is not running locally');
      console.log('   Start Ollama with: ollama serve');
      console.log('   Then install a model: ollama pull llama3.2');
    }
    console.log('');

    console.log('📋 Next Steps:');
    console.log('   1. Make sure Ollama is running: ollama serve');
    console.log('   2. Install a model: ollama pull llama3.2');
    console.log('   3. Get a valid authentication token from your app');
    console.log('   4. Run the full integration test with a valid token');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testSimpleOllama();
}

module.exports = { testSimpleOllama };
