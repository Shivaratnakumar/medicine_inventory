const axios = require('axios');

async function testOTPDirectly() {
  console.log('🧪 Simple OTP Test - Direct API Call');
  console.log('=' .repeat(40));

  try {
    // Test server health first
    console.log('🔍 Testing server connection...');
    const healthResponse = await axios.get('http://localhost:5000/health', { timeout: 5000 });
    console.log('✅ Server is running:', healthResponse.data.status);

    // Test forgot password
    console.log('\n📱 Testing forgot password...');
    const forgotResponse = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      phone: '1234567890',
      method: 'sms'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Forgot password response:', forgotResponse.data);

    if (forgotResponse.data.success) {
      console.log('\n🎉 SUCCESS! OTP request processed');
      console.log('📱 Check the server console for the OTP code');
      console.log('📱 The OTP should be displayed in the server terminal');
      console.log('📱 Look for: "📱 SMS MESSAGE (Development Mode)"');
      
      console.log('\n📋 Next Steps:');
      console.log('1. Check the server console (where you ran "node index.js")');
      console.log('2. Look for the OTP code in the console output');
      console.log('3. Use that OTP code in the frontend or API testing');
      console.log('4. Complete the password reset flow');
      
    } else {
      console.log('❌ Forgot password failed:', forgotResponse.data.message);
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running');
      console.log('🔧 Start server with: cd server && node index.js');
    } else if (error.response?.status === 404) {
      console.log('❌ Server running but endpoint not found');
      console.log('🔧 Check server configuration');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

async function showServerInstructions() {
  console.log('\n📋 Server Instructions:');
  console.log('=' .repeat(30));
  console.log('1. Open a new terminal');
  console.log('2. Run: cd server');
  console.log('3. Run: node index.js');
  console.log('4. Look for: "🚀 Server running on port 5000"');
  console.log('5. Keep this terminal open');
  console.log('6. Run this test script in another terminal');
}

async function main() {
  await testOTPDirectly();
  await showServerInstructions();
}

main().catch(console.error);
