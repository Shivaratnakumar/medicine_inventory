const axios = require('axios');

async function testEmailReset() {
  console.log('🧪 Testing Email Reset Flow');
  console.log('=' .repeat(40));

  const testEmail = 'user8050372422@example.com'; // Use the same email as the user we created

  try {
    // Step 1: Request email reset
    console.log('📧 Step 1: Requesting email reset...');
    const resetResponse = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      email: testEmail,
      method: 'email'
    });
    console.log('✅ Email Reset Response:', resetResponse.data);

    console.log('\n🔍 Check the server console for the reset link!');
    console.log('📧 Look for: "📧 EMAIL MESSAGE (Development Mode)"');
    console.log('📧 Copy the reset link and test it in your browser');

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('📋 Full error response:', error.response.data);
    }
  }
}

async function testTokenValidation(token) {
  console.log('🔧 Testing Token Validation');
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
      console.log('🎉 Token validation successful!');
      console.log('📧 Email reset flow is working correctly');
    } else {
      console.log('❌ Token validation failed');
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
    await testEmailReset();
  } else {
    const token = args[0];
    await testTokenValidation(token);
  }
}

main().catch(console.error);
