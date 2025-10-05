const axios = require('axios');

async function testFrontendLogin() {
  try {
    console.log('Testing frontend login flow...');
    
    // Test the login API that the frontend uses
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@pharmacy.com',
      password: 'admin123'
    });
    
    console.log('Login successful!');
    console.log('Token:', response.data.token);
    console.log('User:', response.data.user);
    
    // Test token verification
    const verifyResponse = await axios.get('http://localhost:5000/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${response.data.token}`
      }
    });
    
    console.log('\nToken verification successful!');
    console.log('Verified user:', verifyResponse.data.user);
    
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
  }
}

testFrontendLogin();
