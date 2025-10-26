const axios = require('axios');

async function debugEmailReset() {
  console.log('🔧 Debug Email Reset Flow');
  console.log('=' .repeat(40));

  const testEmail = 'user8050372422@example.com';

  try {
    // Step 1: Request email reset
    console.log('📧 Step 1: Requesting email reset...');
    const resetResponse = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      email: testEmail,
      method: 'email'
    });
    console.log('✅ Email Reset Response:', resetResponse.data);

    console.log('\n🔍 Now check the server console for the reset link!');
    console.log('📧 Look for: "📧 EMAIL MESSAGE (Development Mode)"');
    console.log('📧 Copy the reset link and test it');
    console.log('\n📋 The link should look like:');
    console.log('   http://localhost:3000/reset-password?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }
}

async function testTokenDirectly(token) {
  console.log('🔧 Testing Token Directly');
  console.log('=' .repeat(40));

  try {
    console.log('🔑 Testing token:', token);
    
    // Test the reset password endpoint with the token
    const resetResponse = await axios.post('http://localhost:5000/api/auth/reset-password', {
      token: token,
      password: 'NewPassword123!',
      method: 'email'
    });
    
    console.log('✅ Reset Response:', resetResponse.data);
    
    if (resetResponse.data.success) {
      console.log('🎉 Token works! The issue is in the frontend');
      console.log('📋 Check if the frontend is properly extracting the token from URL');
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

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    await debugEmailReset();
  } else {
    const token = args[0];
    await testTokenDirectly(token);
  }
}

main().catch(console.error);
