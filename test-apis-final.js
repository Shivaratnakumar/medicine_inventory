const axios = require('axios');

async function testAllAPIs() {
  try {
    console.log('🔍 Testing all APIs after routing fix...\n');

    // Login first
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@medicineinventory.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Test 1: Medicines expiring
    try {
      const response = await axios.get('http://localhost:5000/api/medicines/expiring?days=30', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Expiry Tracker:', response.data.success ? `${response.data.data?.length || 0} medicines` : 'Error');
    } catch (error) {
      console.log('❌ Expiry Tracker:', error.response?.data?.message || 'Error');
    }

    // Test 2: Low stock medicines
    try {
      const response = await axios.get('http://localhost:5000/api/medicines/low-stock', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Low Stock Alerts:', response.data.success ? `${response.data.data?.length || 0} medicines` : 'Error');
    } catch (error) {
      console.log('❌ Low Stock Alerts:', error.response?.data?.message || 'Error');
    }

    // Test 3: Support tickets
    try {
      const response = await axios.get('http://localhost:5000/api/support', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Support Module:', response.data.success ? `${response.data.data?.length || 0} tickets` : 'Error');
    } catch (error) {
      console.log('❌ Support Module:', error.response?.data?.message || 'Error');
    }

    // Test 4: Payment history
    try {
      const response = await axios.get('http://localhost:5000/api/payments/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Payment Module:', response.data.success ? `${response.data.data?.length || 0} payments` : 'Error');
    } catch (error) {
      console.log('❌ Payment Module:', error.response?.data?.message || 'Error');
    }

    console.log('\n🎉 All API tests completed!');

  } catch (error) {
    console.log('❌ General error:', error.message);
  }
}

testAllAPIs();
