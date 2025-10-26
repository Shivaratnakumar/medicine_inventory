const axios = require('axios');

async function testResetPasswordDirect() {
  console.log('🧪 Testing Reset Password Direct API Call');
  console.log('=' .repeat(50));

  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyODBiMmY3Ny1mNjg2LTQ0OWQtOWZhMC1jZDU0MTJlNmVkMzkiLCJ0eXBlIjoicGFzc3dvcmRfcmVzZXQiLCJpYXQiOjE3NjEzODk5NjUsImV4cCI6MTc2MTM5MzU2NX0.ah4ilRBd_wmW58gV0rREobubyadRSY6Jiiyk-4iVfYQ';

  try {
    console.log('🔑 Testing token:', token);
    
    // Test the reset password endpoint directly
    const resetResponse = await axios.post('http://localhost:5000/api/auth/reset-password', {
      token: token,
      password: 'NewPassword123!',
      method: 'email'
    });
    
    console.log('✅ Reset Response:', resetResponse.data);
    
    if (resetResponse.data.success) {
      console.log('🎉 Token works! The issue is in the frontend');
      console.log('📋 The backend API is working correctly');
    } else {
      console.log('❌ Token validation failed on server side');
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('📋 Full error response:', error.response.data);
    }
  }
}

testResetPasswordDirect().catch(console.error);
