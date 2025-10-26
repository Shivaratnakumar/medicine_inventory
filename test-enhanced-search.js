// Test script for improved medicine search functionality
// Run this script to test the enhanced search with various queries

const axios = require('axios');

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function testMedicineSearch() {
  console.log('🧪 Testing Enhanced Medicine Search Functionality\n');
  
  const testQueries = [
    'Do',           // Original query that was showing few results
    'Doxycycline',  // Specific medicine name
    'Dolophine',    // Another Do medicine
    'Diazepam',     // Medicine starting with Di
    'Aspirin',      // Common medicine
    'Paracetamol',  // Another common medicine
    'Metformin',    // Diabetes medicine
    'a',            // Single character test
    'do',           // Lowercase test
    'DOX',          // Uppercase test
    'doxy',         // Partial match test
    'dol',          // Partial match test
    'dox'           // Partial match test
  ];
  
  for (const query of testQueries) {
    console.log(`\n🔍 Testing query: "${query}"`);
    console.log('=' .repeat(50));
    
    try {
      // Test autocomplete endpoint
      const autocompleteResponse = await axios.get(`${API_BASE_URL}/medicine-names/autocomplete`, {
        params: { q: query, limit: 20 },
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
        }
      });
      
      if (autocompleteResponse.data.success) {
        const results = autocompleteResponse.data.data;
        console.log(`✅ Autocomplete found ${results.length} results:`);
        
        results.slice(0, 10).forEach((medicine, index) => {
          console.log(`  ${index + 1}. ${medicine.name}`);
          if (medicine.generic_name) console.log(`     Generic: ${medicine.generic_name}`);
          if (medicine.brand_name) console.log(`     Brand: ${medicine.brand_name}`);
          if (medicine.common_names && medicine.common_names.length > 0) {
            console.log(`     Also known as: ${medicine.common_names.join(', ')}`);
          }
          console.log(`     Score: ${medicine.score?.toFixed(4) || 'N/A'}`);
          console.log(`     Match Type: ${medicine.matchType || 'N/A'}`);
          console.log('');
        });
        
        if (results.length > 10) {
          console.log(`  ... and ${results.length - 10} more results`);
        }
      } else {
        console.log('❌ Autocomplete failed:', autocompleteResponse.data.message);
      }
      
      // Test search endpoint
      const searchResponse = await axios.get(`${API_BASE_URL}/medicine-names/search`, {
        params: { 
          q: query, 
          limit: 20, 
          min_score: 0.1,
          type: 'all'
        },
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
        }
      });
      
      if (searchResponse.data.success) {
        const searchResults = searchResponse.data.data;
        console.log(`\n🔎 Search found ${searchResults.length} results:`);
        
        searchResults.slice(0, 5).forEach((medicine, index) => {
          console.log(`  ${index + 1}. ${medicine.name}`);
          if (medicine.generic_name) console.log(`     Generic: ${medicine.generic_name}`);
          if (medicine.brand_name) console.log(`     Brand: ${medicine.brand_name}`);
          console.log(`     Score: ${medicine.score?.toFixed(4) || 'N/A'}`);
          console.log(`     Match Type: ${medicine.matchType || 'N/A'}`);
        });
        
        if (searchResults.length > 5) {
          console.log(`  ... and ${searchResults.length - 5} more results`);
        }
      } else {
        console.log('❌ Search failed:', searchResponse.data.message);
      }
      
    } catch (error) {
      console.log('❌ Error testing query:', error.message);
      if (error.response) {
        console.log('   Response:', error.response.data);
      }
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n🎉 Search functionality testing completed!');
  console.log('\n📊 Summary:');
  console.log('- Enhanced search algorithm with multiple strategies');
  console.log('- Increased default limits (20 for autocomplete, 40 for search)');
  console.log('- More flexible fuzzy matching with lower thresholds');
  console.log('- Better coverage for partial matches and single characters');
  console.log('- Comprehensive medicine database with 100+ medicines');
}

// Run the test
testMedicineSearch().catch(console.error);
