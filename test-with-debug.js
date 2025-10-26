const axios = require('axios');

async function testWithDetailedDebug() {
  console.log('🔧 Detailed OTP Debug Test');
  console.log('=' .repeat(40));

  try {
    console.log('\n📱 Step 1: Testing with phone 1234567890...');
    const response1 = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      phone: '1234567890',
      method: 'sms'
    });
    console.log('✅ Response 1:', response1.data);

    console.log('\n📱 Step 2: Testing with phone +1234567890...');
    const response2 = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      phone: '+1234567890',
      method: 'sms'
    });
    console.log('✅ Response 2:', response2.data);

    console.log('\n📱 Step 3: Testing with different phone...');
    const response3 = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      phone: '9876543210',
      method: 'sms'
    });
    console.log('✅ Response 3:', response3.data);

    console.log('\n🔍 Check server console for debug messages!');
    console.log('📱 Look for:');
    console.log('   - "🔧 DEBUG: Generating OTP..."');
    console.log('   - "📱 SMS MESSAGE (Development Mode)"');
    console.log('   - Any error messages');

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }
}

async function main() {
  await testWithDetailedDebug();
  
  console.log('\n📋 If you still don\'t see logs:');
  console.log('1. Check if server is running from correct directory');
  console.log('2. Check if debug code was saved properly');
  console.log('3. Check if user exists in database');
  console.log('4. Check for any server errors');
}

main().catch(console.error);
