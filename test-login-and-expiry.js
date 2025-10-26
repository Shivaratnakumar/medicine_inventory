const axios = require('axios');

async function testLoginAndExpiry() {
  console.log('Testing Login and Expiry API...');
  
  try {
    // First, try to login to get a valid token
    console.log('\n1. Attempting to login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com', // Try common admin email
      password: 'admin123'
    });
    
    console.log('Login successful!');
    const token = loginResponse.data.data.token;
    console.log('Token received:', token ? 'Yes' : 'No');
    
    // Test expired medicines with valid token
    console.log('\n2. Testing expired medicines with valid token...');
    const expiredResponse = await axios.get('http://localhost:5000/api/medicines/expiring?days=0', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Status:', expiredResponse.status);
    console.log('Expired medicines count:', expiredResponse.data.data?.length || 0);
    if (expiredResponse.data.data && expiredResponse.data.data.length > 0) {
      console.log('Sample expired medicine:', expiredResponse.data.data[0]);
    }
    
    // Test expiring medicines
    console.log('\n3. Testing expiring medicines...');
    const expiringResponse = await axios.get('http://localhost:5000/api/medicines/expiring?days=30', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Status:', expiringResponse.status);
    console.log('Expiring medicines count:', expiringResponse.data.data?.length || 0);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    
    // If login fails, try to create a test user
    if (error.response?.status === 401 || error.response?.status === 404) {
      console.log('\nTrying to register a test user...');
      try {
        const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
          email: 'test@example.com',
          password: 'test123',
          firstName: 'Test',
          lastName: 'User',
          role: 'admin'
        });
        
        console.log('Registration successful!');
        const token = registerResponse.data.data.token;
        
        // Test with new token
        const expiredResponse = await axios.get('http://localhost:5000/api/medicines/expiring?days=0', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Expired medicines with new token:', expiredResponse.data.data?.length || 0);
        
      } catch (registerError) {
        console.error('Registration failed:', registerError.response?.data || registerError.message);
      }
    }
  }
}

testLoginAndExpiry();
