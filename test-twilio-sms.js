const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTwilioSMS() {
  console.log('🧪 Testing Twilio SMS Configuration');
  console.log('=' .repeat(50));

  // Check environment variables
  console.log('🔍 Checking Twilio configuration...');
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  const smsProvider = process.env.SMS_PROVIDER;

  console.log('📋 Configuration Status:');
  console.log(`   SMS Provider: ${smsProvider}`);
  console.log(`   Twilio Account SID: ${twilioAccountSid ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Twilio Auth Token: ${twilioAuthToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Twilio Phone Number: ${twilioPhoneNumber ? '✅ Set' : '❌ Missing'}`);

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.log('\n❌ Twilio credentials not configured!');
    console.log('📋 Please update your .env file with:');
    console.log('   TWILIO_ACCOUNT_SID=your_account_sid');
    console.log('   TWILIO_AUTH_TOKEN=your_auth_token');
    console.log('   TWILIO_PHONE_NUMBER=your_phone_number');
    console.log('   SMS_PROVIDER=twilio');
    return;
  }

  if (smsProvider !== 'twilio') {
    console.log('\n⚠️  SMS_PROVIDER is not set to "twilio"');
    console.log('📋 Please update your .env file:');
    console.log('   SMS_PROVIDER=twilio');
    return;
  }

  // Test Twilio connection
  console.log('\n🔧 Testing Twilio connection...');
  try {
    const twilio = require('twilio')(twilioAccountSid, twilioAuthToken);
    
    // Test account info
    const account = await twilio.api.accounts(twilioAccountSid).fetch();
    console.log('✅ Twilio connection successful!');
    console.log(`   Account Name: ${account.friendlyName}`);
    console.log(`   Account Status: ${account.status}`);
    
    // Test phone number
    console.log('\n📱 Testing phone number...');
    const phoneNumbers = await twilio.incomingPhoneNumbers.list({ limit: 1 });
    if (phoneNumbers.length > 0) {
      console.log('✅ Phone number found!');
      console.log(`   Number: ${phoneNumbers[0].phoneNumber}`);
      console.log(`   Capabilities: ${JSON.stringify(phoneNumbers[0].capabilities)}`);
    } else {
      console.log('❌ No phone numbers found in your Twilio account');
      console.log('📋 Please purchase a phone number from Twilio Console');
    }

  } catch (error) {
    console.log('❌ Twilio connection failed:', error.message);
    console.log('📋 Please check your credentials in the .env file');
    return;
  }

  // Test SMS sending
  console.log('\n📱 Testing SMS sending...');
  const testPhone = '+918050372422'; // Your phone number
  const testOTP = '123456';

  try {
    const smsService = require('./server/services/realSmsService');
    
    console.log(`📤 Sending test SMS to ${testPhone}...`);
    const result = await smsService.sendOTP(testPhone, testOTP, 'password_reset');
    
    if (result.success) {
      console.log('✅ SMS sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Provider: ${result.provider}`);
      console.log(`📱 Check your phone for the SMS message!`);
    } else {
      console.log('❌ SMS sending failed');
    }

  } catch (error) {
    console.log('❌ SMS sending error:', error.message);
  }
}

async function main() {
  await testTwilioSMS();
  
  console.log('\n📋 Next Steps:');
  console.log('1. If SMS was sent successfully, your Twilio setup is working!');
  console.log('2. Update your production environment with these settings');
  console.log('3. Test the complete OTP flow in your frontend');
  console.log('4. Monitor Twilio usage in the Twilio Console');
}

main().catch(console.error);
