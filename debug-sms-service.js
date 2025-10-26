const axios = require('axios');

async function debugSMSService() {
  console.log('🔍 Debugging SMS Service - Why OTP Not Showing');
  console.log('=' .repeat(50));

  try {
    console.log('\n📱 Step 1: Testing forgot password API...');
    const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      phone: '1234567890',
      method: 'sms'
    });

    console.log('✅ API Response:', response.data);

    if (response.data.success) {
      console.log('\n📱 Step 2: Checking what should happen...');
      console.log('   ✅ API call successful');
      console.log('   📱 Server should generate OTP');
      console.log('   📱 Server should call SMS service');
      console.log('   📱 SMS service should display OTP in console');
      
      console.log('\n🔍 Possible Issues:');
      console.log('   1. ❓ SMS service not being called');
      console.log('   2. ❓ Error in OTP generation');
      console.log('   3. ❓ User not found in database');
      console.log('   4. ❓ SMS service configuration issue');
      
      // Wait and check if anything appears in server logs
      console.log('\n⏳ Waiting 5 seconds for server processing...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('\n📋 Check server console for:');
      console.log('   - Any error messages');
      console.log('   - SMS service logs');
      console.log('   - OTP generation logs');
      console.log('   - Database operation logs');
      
    } else {
      console.log('❌ API call failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }
}

async function testSMSConfiguration() {
  console.log('\n⚙️ Testing SMS Service Configuration...');
  
  try {
    // Test the SMS service directly
    const smsService = require('./server/services/realSmsService');
    
    console.log('📱 SMS Service Provider:', smsService.provider);
    console.log('📱 SMS Service Status: Configured');
    
    // Test OTP generation
    const otp = smsService.generateOTP();
    console.log('✅ OTP Generation Test:', otp);
    
    // Test SMS sending (this should show in console)
    console.log('\n📱 Testing SMS sending...');
    await smsService.sendOTP('+1234567890', otp, 'password_reset');
    console.log('✅ SMS service test completed');
    
  } catch (error) {
    console.log('❌ SMS service error:', error.message);
  }
}

async function checkServerLogs() {
  console.log('\n📋 What to Check in Server Console:');
  console.log('=' .repeat(40));
  
  console.log('\n1. 🔍 Look for error messages:');
  console.log('   - Database connection errors');
  console.log('   - SMS service errors');
  console.log('   - OTP generation errors');
  
  console.log('\n2. 📱 Look for SMS service logs:');
  console.log('   - "📱 SMS MESSAGE (Development Mode)"');
  console.log('   - OTP codes');
  console.log('   - Phone numbers');
  
  console.log('\n3. 🗄️ Look for database logs:');
  console.log('   - User lookup results');
  console.log('   - OTP storage results');
  console.log('   - Database errors');
  
  console.log('\n4. 🔧 If nothing appears:');
  console.log('   - Check if user exists in database');
  console.log('   - Check SMS service configuration');
  console.log('   - Check server error logs');
}

async function main() {
  await debugSMSService();
  await testSMSConfiguration();
  await checkServerLogs();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Check server console for any error messages');
  console.log('2. Verify SMS service is working');
  console.log('3. Check if user exists in database');
  console.log('4. Test with a real user if needed');
}

main().catch(console.error);
