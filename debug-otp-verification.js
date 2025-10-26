const axios = require('axios');

async function debugOTPVerification() {
  console.log('🔧 Debug OTP Verification');
  console.log('=' .repeat(40));

  const phone = '+918050372422';
  
  try {
    // Step 1: Request OTP
    console.log('📱 Step 1: Requesting OTP...');
    const otpResponse = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      phone: phone,
      method: 'sms'
    });
    console.log('✅ OTP Response:', otpResponse.data);

    console.log('\n🔍 Now check the server console for the OTP code!');
    console.log('📱 Look for: "📱 SMS MESSAGE (Development Mode)"');
    console.log('📱 Copy the 6-digit OTP code and update this script');
    console.log('\n📋 Next: Update the OTP variable below and run again');

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }
}

async function testOTPVerification(otp) {
  console.log('🔧 Testing OTP Verification');
  console.log('=' .repeat(40));

  const phone = '+918050372422';
  
  try {
    console.log('📱 Verifying OTP:', otp);
    const verifyResponse = await axios.post('http://localhost:5000/api/auth/verify-otp', {
      phone: phone,
      otp: otp
    });
    console.log('✅ Verify Response:', verifyResponse.data);

    if (verifyResponse.data.success) {
      console.log('🎉 OTP verification successful!');
      console.log('🔑 Reset Token:', verifyResponse.data.resetToken);
      
      // Now test password reset
      console.log('\n📱 Testing Password Reset...');
      const resetResponse = await axios.post('http://localhost:5000/api/auth/reset-password', {
        phone: phone,
        otp: otp,
        password: 'NewPassword123!',
        method: 'sms'
      });
      console.log('✅ Reset Response:', resetResponse.data);
      
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
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    await debugOTPVerification();
  } else {
    const otp = args[0];
    await testOTPVerification(otp);
  }
}

main().catch(console.error);
