const axios = require('axios');

async function testCompleteOTPFlow() {
  console.log('🧪 Testing Complete OTP Flow');
  console.log('=' .repeat(40));

  const phone = '+918050372422';
  const otp = '123456'; // This will be the OTP from console

  try {
    // Step 1: Request OTP
    console.log('📱 Step 1: Requesting OTP...');
    const otpResponse = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      phone: phone,
      method: 'sms'
    });
    console.log('✅ OTP Response:', otpResponse.data);

    // Step 2: Verify OTP
    console.log('\n📱 Step 2: Verifying OTP...');
    const verifyResponse = await axios.post('http://localhost:5000/api/auth/verify-otp', {
      phone: phone,
      otp: otp
    });
    console.log('✅ Verify Response:', verifyResponse.data);

    if (verifyResponse.data.success) {
      const resetToken = verifyResponse.data.resetToken;
      
      // Step 3: Reset Password
      console.log('\n📱 Step 3: Resetting Password...');
      const resetResponse = await axios.post('http://localhost:5000/api/auth/reset-password', {
        phone: phone,
        otp: otp,
        password: 'NewPassword123!',
        method: 'sms'
      });
      console.log('✅ Reset Response:', resetResponse.data);
      
      console.log('\n🎉 Complete OTP flow test successful!');
    } else {
      console.log('❌ OTP verification failed');
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('📋 Full error response:', error.response.data);
    }
  }
}

async function main() {
  console.log('🔧 Instructions:');
  console.log('1. Make sure server is running');
  console.log('2. Check server console for OTP code');
  console.log('3. Update the OTP variable in this script');
  console.log('4. Run this test');
  console.log('\n' + '=' .repeat(40));
  
  await testCompleteOTPFlow();
}

main().catch(console.error);