require('dotenv').config({ path: './server/.env' });
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test data
const testMedicine = {
  name: 'Test Medicine API',
  generic_name: 'Test Generic API',
  brand_name: 'Test Brand API',
  common_names: ['Test API', 'API Test'],
  popularity_score: 100
};

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@pharmacy.com',
      password: 'admin123'
    });
    
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testEndpoints() {
  const headers = { Authorization: `Bearer ${authToken}` };
  
  try {
    console.log('\n🧪 Testing Medicine Names API...\n');
    
    // Test 1: Get all medicine names
    console.log('1️⃣ Testing GET /api/medicine-names');
    try {
      const response = await axios.get(`${BASE_URL}/medicine-names`, { headers });
      console.log('✅ GET /api/medicine-names:', response.data.success ? 'SUCCESS' : 'FAILED');
      console.log(`   Found ${response.data.data?.length || 0} medicine names`);
    } catch (error) {
      console.log('❌ GET /api/medicine-names:', error.response?.data?.message || error.message);
    }
    
    // Test 2: Autocomplete
    console.log('\n2️⃣ Testing GET /api/medicine-names/autocomplete?q=para');
    try {
      const response = await axios.get(`${BASE_URL}/medicine-names/autocomplete?q=para`, { headers });
      console.log('✅ Autocomplete:', response.data.success ? 'SUCCESS' : 'FAILED');
      console.log(`   Found ${response.data.data?.length || 0} suggestions`);
      if (response.data.data?.length > 0) {
        console.log(`   First suggestion: ${response.data.data[0].name}`);
      }
    } catch (error) {
      console.log('❌ Autocomplete:', error.response?.data?.message || error.message);
    }
    
    // Test 3: Search
    console.log('\n3️⃣ Testing GET /api/medicine-names/search?q=ibuprofen');
    try {
      const response = await axios.get(`${BASE_URL}/medicine-names/search?q=ibuprofen`, { headers });
      console.log('✅ Search:', response.data.success ? 'SUCCESS' : 'FAILED');
      console.log(`   Found ${response.data.data?.length || 0} results`);
      if (response.data.data?.length > 0) {
        console.log(`   First result: ${response.data.data[0].name} (score: ${response.data.data[0].score})`);
      }
    } catch (error) {
      console.log('❌ Search:', error.response?.data?.message || error.message);
    }
    
    // Test 4: Add new medicine name
    console.log('\n4️⃣ Testing POST /api/medicine-names');
    try {
      const response = await axios.post(`${BASE_URL}/medicine-names`, testMedicine, { headers });
      console.log('✅ POST /api/medicine-names:', response.data.success ? 'SUCCESS' : 'FAILED');
      if (response.data.success) {
        console.log(`   Created: ${response.data.data.name}`);
        testMedicine.id = response.data.data.id;
      }
    } catch (error) {
      console.log('❌ POST /api/medicine-names:', error.response?.data?.message || error.message);
    }
    
    // Test 5: Update medicine name
    if (testMedicine.id) {
      console.log('\n5️⃣ Testing PUT /api/medicine-names/:id');
      try {
        const updateData = { ...testMedicine, popularity_score: 150 };
        const response = await axios.put(`${BASE_URL}/medicine-names/${testMedicine.id}`, updateData, { headers });
        console.log('✅ PUT /api/medicine-names/:id:', response.data.success ? 'SUCCESS' : 'FAILED');
        if (response.data.success) {
          console.log(`   Updated popularity score to: ${response.data.data.popularity_score}`);
        }
      } catch (error) {
        console.log('❌ PUT /api/medicine-names/:id:', error.response?.data?.message || error.message);
      }
    }
    
    // Test 6: Stats
    console.log('\n6️⃣ Testing GET /api/medicine-names/stats');
    try {
      const response = await axios.get(`${BASE_URL}/medicine-names/stats`, { headers });
      console.log('✅ Stats:', response.data.success ? 'SUCCESS' : 'FAILED');
      if (response.data.success) {
        console.log(`   Total medicines: ${response.data.data.total}`);
        console.log(`   With generic names: ${response.data.data.with_generic}`);
        console.log(`   With brand names: ${response.data.data.with_brand}`);
      }
    } catch (error) {
      console.log('❌ Stats:', error.response?.data?.message || error.message);
    }
    
    // Test 7: Delete medicine name
    if (testMedicine.id) {
      console.log('\n7️⃣ Testing DELETE /api/medicine-names/:id');
      try {
        const response = await axios.delete(`${BASE_URL}/medicine-names/${testMedicine.id}`, { headers });
        console.log('✅ DELETE /api/medicine-names/:id:', response.data.success ? 'SUCCESS' : 'FAILED');
      } catch (error) {
        console.log('❌ DELETE /api/medicine-names/:id:', error.response?.data?.message || error.message);
      }
    }
    
    // Test 8: Bulk import
    console.log('\n8️⃣ Testing POST /api/medicine-names/bulk-import');
    try {
      const bulkData = {
        medicines: [
          { name: 'Bulk Test 1', generic_name: 'Bulk Generic 1', popularity_score: 10 },
          { name: 'Bulk Test 2', generic_name: 'Bulk Generic 2', popularity_score: 20 },
          { name: 'Bulk Test 3', generic_name: 'Bulk Generic 3', popularity_score: 30 }
        ]
      };
      const response = await axios.post(`${BASE_URL}/medicine-names/bulk-import`, bulkData, { headers });
      console.log('✅ Bulk import:', response.data.success ? 'SUCCESS' : 'FAILED');
      if (response.data.success) {
        console.log(`   Imported ${response.data.data.imported} medicines`);
      }
    } catch (error) {
      console.log('❌ Bulk import:', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test suite error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Medicine Names API Tests\n');
  
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  await testEndpoints();
  
  console.log('\n✅ Test suite completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Run the SQL script in Supabase dashboard to create the medicine_names table');
  console.log('2. Start the server: npm run dev');
  console.log('3. Test the API endpoints with the frontend');
}

// Run the tests
runTests().catch(console.error);

