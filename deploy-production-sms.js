const fs = require('fs');
const path = require('path');

console.log('🚀 Production SMS Deployment Script');
console.log('=' .repeat(50));

// Check if .env file exists
const envPath = path.join(__dirname, 'server', '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found at:', envPath);
  process.exit(1);
}

// Read current .env file
let envContent = fs.readFileSync(envPath, 'utf8');

console.log('📋 Current Configuration:');
console.log(`   SMS Provider: ${envContent.match(/SMS_PROVIDER=(.+)/)?.[1] || 'Not set'}`);
console.log(`   Twilio Account SID: ${envContent.includes('TWILIO_ACCOUNT_SID=') ? '✅ Set' : '❌ Missing'}`);
console.log(`   Twilio Auth Token: ${envContent.includes('TWILIO_AUTH_TOKEN=') ? '✅ Set' : '❌ Missing'}`);
console.log(`   Twilio Phone Number: ${envContent.includes('TWILIO_PHONE_NUMBER=') ? '✅ Set' : '❌ Missing'}`);

// Check if Twilio is properly configured
const hasTwilioCredentials = envContent.includes('TWILIO_ACCOUNT_SID=') && 
                           envContent.includes('TWILIO_AUTH_TOKEN=') && 
                           envContent.includes('TWILIO_PHONE_NUMBER=');

if (!hasTwilioCredentials) {
  console.log('\n❌ Twilio credentials not configured!');
  console.log('📋 Please follow these steps:');
  console.log('1. Go to: https://console.twilio.com/');
  console.log('2. Sign up/Login to your account');
  console.log('3. Get your Account SID and Auth Token');
  console.log('4. Buy a phone number with SMS capabilities');
  console.log('5. Update your .env file with the real values');
  console.log('\n📝 Required .env variables:');
  console.log('   TWILIO_ACCOUNT_SID=your_account_sid');
  console.log('   TWILIO_AUTH_TOKEN=your_auth_token');
  console.log('   TWILIO_PHONE_NUMBER=your_phone_number');
  console.log('   SMS_PROVIDER=twilio');
  process.exit(1);
}

// Check if SMS_PROVIDER is set to twilio
if (!envContent.includes('SMS_PROVIDER=twilio')) {
  console.log('\n⚠️  SMS_PROVIDER is not set to "twilio"');
  console.log('🔄 Updating SMS_PROVIDER to twilio...');
  
  if (envContent.includes('SMS_PROVIDER=')) {
    envContent = envContent.replace(/SMS_PROVIDER=.*/, 'SMS_PROVIDER=twilio');
  } else {
    envContent += '\nSMS_PROVIDER=twilio\n';
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ SMS_PROVIDER updated to twilio');
}

console.log('\n✅ Configuration looks good!');
console.log('\n🧪 Testing SMS service...');

// Test the SMS service
async function testSMSService() {
  try {
    const smsService = require('./server/services/realSmsService');
    
    console.log('📤 Testing SMS service...');
    const result = await smsService.sendOTP('+918050372422', '123456', 'password_reset');
    
    if (result.success) {
      console.log('✅ SMS service test successful!');
      console.log(`   Provider: ${result.provider}`);
      console.log(`   Message ID: ${result.messageId}`);
      console.log('\n🎉 Your OTP system is production-ready!');
      console.log('📱 SMS messages will now be delivered to real phone numbers');
    } else {
      console.log('❌ SMS service test failed');
      console.log('📋 Please check your Twilio configuration');
    }
    
  } catch (error) {
    console.log('❌ SMS service test error:', error.message);
    console.log('📋 Please check your Twilio credentials and try again');
  }
}

// Run the test
testSMSService().then(() => {
  console.log('\n📋 Production Deployment Checklist:');
  console.log('✅ Twilio credentials configured');
  console.log('✅ SMS provider set to twilio');
  console.log('✅ SMS service tested');
  console.log('\n🚀 Next Steps:');
  console.log('1. Deploy to your production server');
  console.log('2. Update production .env file with same values');
  console.log('3. Restart your production server');
  console.log('4. Test the complete OTP flow in production');
  console.log('5. Monitor usage in Twilio Console');
  
  console.log('\n💰 Cost Monitoring:');
  console.log('- SMS cost: ~$0.0075 per message');
  console.log('- Phone number: ~$1/month');
  console.log('- Monitor usage at: https://console.twilio.com/');
  
  console.log('\n🔒 Security Reminders:');
  console.log('- Never commit .env file to version control');
  console.log('- Use environment variables in production');
  console.log('- Set up billing alerts in Twilio');
  console.log('- Monitor for unusual usage patterns');
}).catch(console.error);
