const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login API...');
    
    // Test with admin credentials
    console.log('\n1. Testing admin@medicineinventory.com / admin123');
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@medicineinventory.com',
        password: 'admin123'
      });
      console.log('Success:', response.data);
    } catch (error) {
      console.log('Error:', error.response?.data || error.message);
    }
    
    // Test with demo user credentials
    console.log('\n2. Testing user@example.com / password123');
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'user@example.com',
        password: 'password123'
      });
      console.log('Success:', response.data);
    } catch (error) {
      console.log('Error:', error.response?.data || error.message);
    }
    
    // Test with demo credentials from login page
    console.log('\n3. Testing admin@pharmacy.com / admin123');
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@pharmacy.com',
        password: 'admin123'
      });
      console.log('Success:', response.data);
    } catch (error) {
      console.log('Error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testLogin();
