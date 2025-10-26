const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testOTPFlow() {
  console.log('🧪 Testing OTP-based Password Reset Flow');
  console.log('=' .repeat(50));

  try {
    // Test 1: Send OTP
    console.log('\n📱 Step 1: Sending OTP...');
    const forgotPasswordResponse = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      phone: '1234567890',
      method: 'sms'
    });

    console.log('✅ Forgot password response:', forgotPasswordResponse.data);

    // Test 2: Verify OTP (this will fail since we don't have a real OTP)
    console.log('\n🔐 Step 2: Verifying OTP...');
    try {
      const verifyOTPResponse = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        phone: '1234567890',
        otp: '123456'
      });
      console.log('✅ OTP verification response:', verifyOTPResponse.data);
    } catch (error) {
      console.log('❌ OTP verification failed (expected):', error.response?.data?.message || error.message);
    }

    // Test 3: Reset password (this will fail since OTP is invalid)
    console.log('\n🔑 Step 3: Resetting password...');
    try {
      const resetPasswordResponse = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        phone: '1234567890',
        otp: '123456',
        password: 'newpassword123',
        method: 'sms'
      });
      console.log('✅ Password reset response:', resetPasswordResponse.data);
    } catch (error) {
      console.log('❌ Password reset failed (expected):', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 OTP flow test completed!');
    console.log('\n📝 Note: The OTP verification and password reset steps failed as expected');
    console.log('   because we used a dummy OTP. In a real scenario, you would:');
    console.log('   1. Check the server console for the actual OTP code');
    console.log('   2. Use that OTP code to verify and reset the password');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

async function testServerConnection() {
  console.log('🔌 Testing server connection...');
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/verify`);
    console.log('✅ Server is running and accessible');
  } catch (error) {
    console.log('❌ Server connection failed:', error.message);
    console.log('   Make sure the server is running on port 5000');
  }
}

async function main() {
  await testServerConnection();
  await testOTPFlow();
}

main().catch(console.error);
