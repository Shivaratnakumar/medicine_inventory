const axios = require('axios');

async function testRealPhoneOTP() {
  console.log('🧪 Testing OTP with Real Phone Number');
  console.log('=' .repeat(40));

  try {
    console.log('📱 Testing forgot password with +918050372422...');
    const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      phone: '+918050372422',
      method: 'sms'
    });
    
    console.log('✅ Response:', response.data);
    console.log('\n🎯 Check the server console now!');
    console.log('📱 You should see:');
    console.log('   - "🔧 DEBUG: User lookup result: { user: {...}, userError: null }"');
    console.log('   - "🔧 DEBUG: Generating OTP..."');
    console.log('   - "🔧 DEBUG: OTP generated: XXXXXX"');
    console.log('   - "📱 SMS MESSAGE (Development Mode)" with the actual OTP');

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }
}

testRealPhoneOTP().catch(console.error);
