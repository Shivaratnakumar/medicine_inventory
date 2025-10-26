const fs = require('fs');
const path = require('path');

console.log('🔄 Switching to Twilio SMS Provider');
console.log('=' .repeat(40));

// Check if .env file exists
const envPath = path.join(__dirname, 'server', '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found at:', envPath);
  process.exit(1);
}

// Read current .env file
let envContent = fs.readFileSync(envPath, 'utf8');

// Update SMS_PROVIDER to twilio
if (envContent.includes('SMS_PROVIDER=')) {
  envContent = envContent.replace(/SMS_PROVIDER=.*/, 'SMS_PROVIDER=twilio');
  console.log('✅ Updated SMS_PROVIDER to twilio');
} else {
  envContent += '\nSMS_PROVIDER=twilio\n';
  console.log('✅ Added SMS_PROVIDER=twilio');
}

// Write back to file
fs.writeFileSync(envPath, envContent);

console.log('\n📋 Next Steps:');
console.log('1. Update your .env file with Twilio credentials:');
console.log('   TWILIO_ACCOUNT_SID=your_account_sid');
console.log('   TWILIO_AUTH_TOKEN=your_auth_token');
console.log('   TWILIO_PHONE_NUMBER=your_phone_number');
console.log('2. Run: node test-twilio-sms.js');
console.log('3. Restart your server');

console.log('\n🔧 Quick Twilio Setup:');
console.log('1. Go to: https://console.twilio.com/');
console.log('2. Get Account SID and Auth Token');
console.log('3. Buy a phone number with SMS capabilities');
console.log('4. Update .env file with real values');
console.log('5. Test with: node test-twilio-sms.js');
