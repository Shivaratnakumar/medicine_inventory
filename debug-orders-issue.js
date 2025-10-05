// Debug script to test the orders API step by step
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function debugOrdersIssue() {
  console.log('🔍 Debugging Orders Page Issue...\n');
  
  try {
    // Step 1: Test server health
    console.log('1️⃣ Testing server health...');
    const healthResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Server is running:', healthResponse.data);
    
    // Step 2: Test login
    console.log('\n2️⃣ Testing login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@pharmacy.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      const token = loginResponse.data.token;
      
      // Step 3: Test orders API directly
      console.log('\n3️⃣ Testing orders API...');
      const ordersResponse = await axios.get(`${API_BASE_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Orders API Response:');
      console.log('Status:', ordersResponse.status);
      console.log('Success:', ordersResponse.data.success);
      console.log('Data length:', ordersResponse.data.data?.length || 0);
      console.log('Full response:', JSON.stringify(ordersResponse.data, null, 2));
      
      // Step 4: Test medicines API
      console.log('\n4️⃣ Testing medicines API...');
      const medicinesResponse = await axios.get(`${API_BASE_URL}/medicines`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('💊 Medicines API Response:');
      console.log('Status:', medicinesResponse.status);
      console.log('Success:', medicinesResponse.data.success);
      console.log('Data length:', medicinesResponse.data.data?.length || 0);
      
      // Step 5: Test with different parameters
      console.log('\n5️⃣ Testing orders API with different parameters...');
      const ordersWithParams = await axios.get(`${API_BASE_URL}/orders?page=1&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📋 Orders with params:');
      console.log('Data length:', ordersWithParams.data.data?.length || 0);
      console.log('Pagination:', ordersWithParams.data.pagination);
      
    } else {
      console.log('❌ Login failed:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:');
    console.error('Message:', error.message);
    console.error('Response:', error.response?.data);
    console.error('Status:', error.response?.status);
  }
}

debugOrdersIssue();

