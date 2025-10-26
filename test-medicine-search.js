const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testMedicineSearch() {
  try {
    console.log('🔍 Testing medicine search functionality...');
    
    // Test autocomplete with 'D'
    console.log('\n1. Testing autocomplete with "D":');
    const autocompleteResponse = await axios.get(`${API_BASE_URL}/medicine-names/autocomplete?q=D&limit=10`);
    console.log('Autocomplete results:', autocompleteResponse.data);
    
    // Test search with 'D'
    console.log('\n2. Testing search with "D":');
    const searchResponse = await axios.get(`${API_BASE_URL}/medicine-names/search?q=D&limit=10`);
    console.log('Search results:', searchResponse.data);
    
    // Test with specific medicine names
    console.log('\n3. Testing with "Duloxetine":');
    const duloxetineResponse = await axios.get(`${API_BASE_URL}/medicine-names/autocomplete?q=Duloxetine&limit=5`);
    console.log('Duloxetine results:', duloxetineResponse.data);
    
    console.log('\n✅ Medicine search test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing medicine search:', error.response?.data || error.message);
  }
}

// Run the test
testMedicineSearch();
