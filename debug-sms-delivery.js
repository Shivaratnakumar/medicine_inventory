const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function debugSMSDelivery() {
  console.log('🔍 Debugging SMS Delivery Issues');
  console.log('=' .repeat(40));

  // Test with your actual phone number
  const testPhone = '+1234567890'; // Replace with your real phone number
  const testPhoneFormatted = '1234567890';

  try {
    console.log('\n📱 Step 1: Testing SMS delivery...');
    console.log(`📞 Phone: ${testPhone}`);
    
    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      phone: testPhoneFormatted,
      method: 'sms'
    });

    console.log('✅ API Response:', response.data);

    if (response.data.success) {
      console.log('\n📱 SMS Service Status:');
      console.log('   ✅ Request processed successfully');
      console.log('   📱 SMS should be sent via TextBelt');
      console.log('   ⏰ OTP expires in 10 minutes');
      
      console.log('\n🔍 Debugging Steps:');
      console.log('   1. Check server console for SMS details');
      console.log('   2. Verify phone number format');
      console.log('   3. Check TextBelt API status');
      console.log('   4. Try alternative SMS providers');
    }

  } catch (error) {
    console.error('❌ SMS delivery test failed:', error.response?.data?.message || error.message);
  }
}

async function testTextBeltDirectly() {
  console.log('\n🧪 Testing TextBelt API directly...');
  
  try {
    const response = await axios.post('https://textbelt.com/text', {
      phone: '+1234567890', // Replace with your phone
      message: 'Test SMS from Medicine Inventory - OTP: 123456',
      key: 'textbelt'
    });

    console.log('📱 TextBelt Response:', response.data);
    
    if (response.data.success) {
      console.log('✅ TextBelt API working - SMS should be delivered');
    } else {
      console.log('❌ TextBelt API error:', response.data.error);
      console.log('💡 Try using Twilio instead');
    }
    
  } catch (error) {
    console.error('❌ TextBelt API error:', error.response?.data || error.message);
  }
}

async function suggestAlternatives() {
  console.log('\n💡 SMS Delivery Alternatives:');
  console.log('=' .repeat(40));
  
  console.log('\n1. 📱 Twilio (Recommended for Production):');
  console.log('   - Get free credits: https://twilio.com/try-twilio');
  console.log('   - Update SMS_PROVIDER=twilio in .env');
  console.log('   - Add Twilio credentials');
  
  console.log('\n2. 📱 AWS SNS:');
  console.log('   - AWS free tier available');
  console.log('   - More reliable than TextBelt');
  
  console.log('\n3. 📱 Console Mode (Development):');
  console.log('   - OTP displayed in server console');
  console.log('   - Good for testing without SMS');
  
  console.log('\n4. 📱 Email OTP (Alternative):');
  console.log('   - Send OTP via email instead');
  console.log('   - More reliable than SMS');
}

async function main() {
  await debugSMSDelivery();
  await testTextBeltDirectly();
  await suggestAlternatives();
  
  console.log('\n🎯 Immediate Solutions:');
  console.log('1. Check server console for OTP code');
  console.log('2. Use console mode for testing');
  console.log('3. Set up Twilio for real SMS delivery');
  console.log('4. Try email OTP as alternative');
}

main().catch(console.error);
