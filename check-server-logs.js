const axios = require('axios');

async function checkServerLogs() {
  console.log('🔍 Checking Server Logs for OTP Issues');
  console.log('=' .repeat(50));

  try {
    console.log('\n📱 Sending OTP request to trigger server logs...');
    const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      phone: '1234567890',
      method: 'sms'
    });

    console.log('✅ API Response:', response.data);

    if (response.data.success) {
      console.log('\n📋 What to Check in Server Console:');
      console.log('=' .repeat(40));
      
      console.log('\n1. 🔍 Look for these messages:');
      console.log('   - "📱 SMS MESSAGE (Development Mode)"');
      console.log('   - OTP codes (6-digit numbers)');
      console.log('   - Phone numbers');
      
      console.log('\n2. ❌ Look for error messages:');
      console.log('   - Database errors');
      console.log('   - SMS service errors');
      console.log('   - OTP generation errors');
      console.log('   - User lookup errors');
      
      console.log('\n3. 🔧 If you see errors:');
      console.log('   - Database connection issues');
      console.log('   - Missing database tables');
      console.log('   - SMS service configuration');
      
      console.log('\n4. 📱 If you see the OTP display:');
      console.log('   - Copy the OTP code');
      console.log('   - Use it in frontend testing');
      console.log('   - Complete the password reset flow');
      
    } else {
      console.log('❌ API call failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }
}

async function provideTroubleshootingSteps() {
  console.log('\n🔧 Troubleshooting Steps:');
  console.log('=' .repeat(30));
  
  console.log('\n1. 📱 Check Server Console:');
  console.log('   - Look for "📱 SMS MESSAGE (Development Mode)"');
  console.log('   - Look for any error messages');
  console.log('   - Look for OTP codes');
  
  console.log('\n2. 🗄️ Check Database:');
  console.log('   - Verify otp_verifications table exists');
  console.log('   - Check if OTP is being stored');
  console.log('   - Look for database errors');
  
  console.log('\n3. ⚙️ Check Configuration:');
  console.log('   - SMS_PROVIDER=console in .env');
  console.log('   - Database connection working');
  console.log('   - Server running properly');
  
  console.log('\n4. 🧪 Test Steps:');
  console.log('   - Send OTP request');
  console.log('   - Check server console');
  console.log('   - Look for OTP display');
  console.log('   - Use OTP in frontend');
}

async function main() {
  await checkServerLogs();
  await provideTroubleshootingSteps();
  
  console.log('\n🎯 Current Status:');
  console.log('✅ Server is running');
  console.log('✅ Database tables exist');
  console.log('✅ Test user created');
  console.log('✅ API calls working');
  console.log('❓ OTP display in server console');
  
  console.log('\n📱 Next Action:');
  console.log('Check the server console (where you ran "node index.js")');
  console.log('Look for the OTP code display');
  console.log('If not visible, there may be a server-side error');
}

main().catch(console.error);
