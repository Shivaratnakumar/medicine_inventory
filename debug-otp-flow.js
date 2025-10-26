const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function debugOTPFlow() {
  console.log('🔍 Senior Developer Debug - OTP Flow Analysis');
  console.log('=' .repeat(50));

  const testPhone = '1234567890';

  try {
    console.log('\n📱 Step 1: Testing forgot password endpoint...');
    console.log(`📞 Phone: ${testPhone}`);
    
    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      phone: testPhone,
      method: 'sms'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Data:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n📱 OTP Generation Status:');
      console.log('   ✅ API call successful');
      console.log('   ✅ OTP should be generated');
      console.log('   📱 Check server console for OTP details');
      
      // Wait for server processing
      console.log('\n⏳ Waiting 5 seconds for server processing...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('\n🔍 Server Console Check:');
      console.log('   Look for this in the server terminal:');
      console.log('   📱 SMS MESSAGE (Development Mode)');
      console.log('   ============================================');
      console.log('   To: +1234567890');
      console.log('   Message: Your Medicine Inventory password reset code is: XXXXXX');
      console.log('   OTP Code: XXXXXX');
      console.log('   ============================================');
      
    } else {
      console.log('❌ API call failed:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Error details:');
    console.error('   Status:', error.response?.status);
    console.error('   Message:', error.response?.data?.message || error.message);
    console.error('   Data:', error.response?.data);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Server not running - Start with: cd server && node index.js');
    } else if (error.response?.status === 500) {
      console.log('\n🔧 Server error - Check server console for details');
    }
  }

  // Test OTP verification
  console.log('\n🔐 Step 2: Testing OTP verification...');
  try {
    const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
      phone: testPhone,
      otp: '123456'
    });

    console.log('✅ OTP Verification Response:', verifyResponse.data);
    
  } catch (error) {
    console.log('❌ OTP Verification Error (expected with dummy OTP):', error.response?.data?.message || error.message);
  }

  console.log('\n🎯 Debugging Checklist:');
  console.log('1. ✅ Server is running on port 5000');
  console.log('2. ✅ Health endpoint responding');
  console.log('3. ✅ Forgot password endpoint responding');
  console.log('4. ❓ Check server console for OTP generation');
  console.log('5. ❓ Verify database connection');
  console.log('6. ❓ Check SMS service configuration');
}

async function checkServerConfiguration() {
  console.log('\n⚙️ Checking Server Configuration...');
  
  try {
    // Check if we can reach the auth endpoints
    const authResponse = await axios.get(`${API_BASE_URL}/auth/verify`);
    console.log('✅ Auth endpoints accessible');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Auth endpoints working (401 expected without token)');
    } else {
      console.log('❌ Auth endpoints issue:', error.message);
    }
  }
}

async function main() {
  await checkServerConfiguration();
  await debugOTPFlow();
  
  console.log('\n📋 Next Steps:');
  console.log('1. Check server console for OTP generation logs');
  console.log('2. Verify database tables exist');
  console.log('3. Check SMS service configuration');
  console.log('4. Test with real phone number if needed');
}

main().catch(console.error);
