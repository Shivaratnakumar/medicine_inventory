const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_EMAIL = 'admin@medicineinventory.com';
const TEST_PASSWORD = 'admin123';

// Helper function to get auth token
async function getAuthToken() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    return response.data.token;
  } catch (error) {
    console.error('Failed to get auth token:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to make authenticated request
async function makeRequest(endpoint, token, params = {}) {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params
    });
    return response.data;
  } catch (error) {
    console.error(`Request failed for ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

// Test cases for search functionality
const testCases = [
  {
    name: 'Exact match search',
    query: 'Paracetamol',
    description: 'Should find exact match for Paracetamol'
  },
  {
    name: 'Partial match search',
    query: 'para',
    description: 'Should find medicines containing "para"'
  },
  {
    name: 'Misspelled search (fuzzy)',
    query: 'paracetamal',
    description: 'Should find Paracetamol despite misspelling'
  },
  {
    name: 'Generic name search',
    query: 'acetaminophen',
    description: 'Should find Paracetamol by its generic name'
  },
  {
    name: 'SKU search',
    query: 'MED001',
    description: 'Should find medicine by SKU'
  },
  {
    name: 'Manufacturer search',
    query: 'PharmaCorp',
    description: 'Should find medicines by manufacturer'
  },
  {
    name: 'Very misspelled search',
    query: 'amoxcillin',
    description: 'Should find Amoxicillin despite significant misspelling'
  },
  {
    name: 'Non-existent search',
    query: 'xyz123nonexistent',
    description: 'Should return empty results with suggestions'
  }
];

// Test autocorrect functionality
const autocorrectTestCases = [
  {
    name: 'Autocorrect for misspelled medicine',
    query: 'paracetamal',
    description: 'Should suggest Paracetamol'
  },
  {
    name: 'Autocorrect for partial generic name',
    query: 'acetamin',
    description: 'Should suggest Acetaminophen'
  },
  {
    name: 'Autocorrect for partial SKU',
    query: 'MED00',
    description: 'Should suggest MED001'
  }
];

async function runTests() {
  console.log('🧪 Starting Medicine Search API Tests\n');
  
  try {
    // Get authentication token
    console.log('🔐 Getting authentication token...');
    const token = await getAuthToken();
    console.log('✅ Authentication successful\n');

    // Test search functionality
    console.log('🔍 Testing Search Functionality\n');
    console.log('=' .repeat(50));
    
    for (const testCase of testCases) {
      console.log(`\n📋 Test: ${testCase.name}`);
      console.log(`Query: "${testCase.query}"`);
      console.log(`Description: ${testCase.description}`);
      
      try {
        const result = await makeRequest('/medicines/search', token, {
          q: testCase.query,
          fuzzy: 'true',
          autocorrect: 'true',
          limit: 10
        });
        
        console.log(`✅ Results: ${result.totalResults} found`);
        console.log(`Search Type: ${result.searchType}`);
        
        if (result.data.length > 0) {
          console.log('📦 Top Results:');
          result.data.slice(0, 3).forEach((medicine, index) => {
            console.log(`  ${index + 1}. ${medicine.name} (${medicine.generic_name || 'N/A'}) - Score: ${medicine.relevanceScore?.toFixed(3) || 'N/A'}`);
          });
        }
        
        if (result.suggestions && result.suggestions.length > 0) {
          console.log('💡 Suggestions:');
          result.suggestions.slice(0, 3).forEach((suggestion, index) => {
            console.log(`  ${index + 1}. ${suggestion.text} (${suggestion.type}) - Similarity: ${suggestion.similarity?.toFixed(3)}`);
          });
        }
        
      } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
      }
    }

    // Test autocorrect functionality
    console.log('\n\n🔧 Testing Autocorrect Functionality\n');
    console.log('=' .repeat(50));
    
    for (const testCase of autocorrectTestCases) {
      console.log(`\n📋 Test: ${testCase.name}`);
      console.log(`Query: "${testCase.query}"`);
      console.log(`Description: ${testCase.description}`);
      
      try {
        const result = await makeRequest('/medicines/autocorrect', token, {
          q: testCase.query,
          limit: 5
        });
        
        console.log(`✅ Suggestions: ${result.totalSuggestions} found`);
        
        if (result.suggestions.length > 0) {
          console.log('💡 Top Suggestions:');
          result.suggestions.forEach((suggestion, index) => {
            console.log(`  ${index + 1}. ${suggestion.text} (${suggestion.type}) - Similarity: ${suggestion.similarity?.toFixed(3)}`);
          });
        } else {
          console.log('  No suggestions found');
        }
        
      } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
      }
    }

    // Test edge cases
    console.log('\n\n🎯 Testing Edge Cases\n');
    console.log('=' .repeat(50));
    
    const edgeCases = [
      { name: 'Empty query', query: '', expected: 'Should return error' },
      { name: 'Very short query', query: 'a', expected: 'Should handle gracefully' },
      { name: 'Special characters', query: 'par@cetamol!', expected: 'Should handle special chars' },
      { name: 'Numbers only', query: '123', expected: 'Should search SKUs' }
    ];
    
    for (const testCase of edgeCases) {
      console.log(`\n📋 Test: ${testCase.name}`);
      console.log(`Query: "${testCase.query}"`);
      console.log(`Expected: ${testCase.expected}`);
      
      try {
        const result = await makeRequest('/medicines/search', token, {
          q: testCase.query,
          fuzzy: 'true',
          autocorrect: 'true'
        });
        
        console.log(`✅ Results: ${result.totalResults} found`);
        if (result.suggestions && result.suggestions.length > 0) {
          console.log(`💡 Suggestions: ${result.suggestions.length} found`);
        }
        
      } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
      }
    }

    console.log('\n\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
