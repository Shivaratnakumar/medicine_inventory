const jwt = require('jsonwebtoken');
const axios = require('axios');

async function testTokenValidation() {
  try {
    console.log('🔍 Testing Token Validation...');
    
    // Step 1: Login and get token
    console.log('\n1️⃣ Getting token from login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@pharmacy.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Token received:', token ? 'Yes' : 'No');
    console.log('Token length:', token?.length);
    console.log('Token starts with:', token?.substring(0, 20) + '...');
    
    // Step 2: Try to decode the token manually
    console.log('\n2️⃣ Testing token decode...');
    try {
      // Try with different JWT secrets
      const secrets = [
        'Santosh@123', // From env.example
        'your_jwt_secret',
        'default_secret',
        'medicine_inventory_secret'
      ];
      
      for (const secret of secrets) {
        try {
          const decoded = jwt.verify(token, secret);
          console.log(`✅ Token decoded successfully with secret: ${secret}`);
          console.log('Decoded payload:', decoded);
          break;
        } catch (error) {
          console.log(`❌ Failed to decode with secret: ${secret}`);
        }
      }
    } catch (error) {
      console.log('❌ Token decode error:', error.message);
    }
    
    // Step 3: Test the token with the API
    console.log('\n3️⃣ Testing token with API...');
    try {
      const response = await axios.get('http://localhost:5000/api/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ API call successful with token');
      console.log('Response data:', response.data);
      
    } catch (error) {
      console.log('❌ API call failed with token');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
    }
    
    // Step 4: Check if the issue is with the user lookup
    console.log('\n4️⃣ Testing user lookup...');
    try {
      // Try to decode without verification first
      const decoded = jwt.decode(token);
      console.log('Decoded token (without verification):', decoded);
      
      if (decoded && decoded.userId) {
        console.log('User ID from token:', decoded.userId);
      }
    } catch (error) {
      console.log('❌ Token decode error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testTokenValidation();
