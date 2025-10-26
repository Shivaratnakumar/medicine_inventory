const axios = require('axios');

// Test script for Ollama integration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testOllamaIntegration() {
  console.log('🧪 Testing Ollama Integration...\n');

  try {
    // Test 1: Check Ollama service status
    console.log('1. Testing Ollama service status...');
    const statusResponse = await axios.get(`${API_BASE_URL}/medicine-names/ollama-status`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'your-test-token'}`
      }
    });
    
    console.log('✅ Ollama Status:', statusResponse.data);
    console.log('   Available:', statusResponse.data.data?.available);
    console.log('   Models:', statusResponse.data.data?.models?.length || 0);
    console.log('   Base URL:', statusResponse.data.data?.baseURL);
    console.log('   Model:', statusResponse.data.data?.model);
    console.log('');

    // Test 2: Test Ollama search with various queries
    const testQueries = [
      'paracetamol',
      'aspirin',
      'antibiotic',
      'pain relief',
      'fever medicine'
    ];

    for (const query of testQueries) {
      console.log(`2. Testing Ollama search for: "${query}"`);
      
      try {
        const searchResponse = await axios.get(`${API_BASE_URL}/medicine-names/ollama-search`, {
          params: {
            q: query,
            limit: 5,
            min_score: 0.1
          },
          headers: {
            'Authorization': `Bearer ${process.env.TEST_TOKEN || 'your-test-token'}`
          }
        });

        console.log(`   ✅ Search successful for "${query}"`);
        console.log(`   Source: ${searchResponse.data.source}`);
        console.log(`   Results: ${searchResponse.data.data?.length || 0}`);
        
        if (searchResponse.data.data && searchResponse.data.data.length > 0) {
          console.log(`   First result: ${searchResponse.data.data[0].name}`);
          console.log(`   Score: ${searchResponse.data.data[0].score}`);
        }
        console.log('');

      } catch (error) {
        console.log(`   ❌ Search failed for "${query}":`, error.response?.data?.message || error.message);
        console.log('');
      }
    }

    // Test 3: Test fallback behavior
    console.log('3. Testing fallback behavior...');
    
    try {
      // This should trigger fallback if Ollama is not available
      const fallbackResponse = await axios.get(`${API_BASE_URL}/medicine-names/ollama-search`, {
        params: {
          q: 'test medicine',
          limit: 3,
          min_score: 0.1
        },
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'your-test-token'}`
        }
      });

      console.log('   ✅ Fallback test successful');
      console.log(`   Source: ${fallbackResponse.data.source}`);
      console.log(`   Message: ${fallbackResponse.data.message || 'No message'}`);
      console.log('');

    } catch (error) {
      console.log('   ❌ Fallback test failed:', error.response?.data?.message || error.message);
      console.log('');
    }

    console.log('🎉 Ollama integration test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    console.error('Make sure the server is running and Ollama is configured properly.');
  }
}

// Run the test
if (require.main === module) {
  testOllamaIntegration();
}

module.exports = { testOllamaIntegration };
