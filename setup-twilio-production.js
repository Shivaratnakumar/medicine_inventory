const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Twilio for Production SMS');
console.log('=' .repeat(50));

// Check if .env file exists
const envPath = path.join(__dirname, 'server', '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found at:', envPath);
  process.exit(1);
}

// Read current .env file
let envContent = fs.readFileSync(envPath, 'utf8');

// Check if Twilio variables already exist
const hasTwilioConfig = envContent.includes('TWILIO_ACCOUNT_SID') && 
                       envContent.includes('TWILIO_AUTH_TOKEN') && 
                       envContent.includes('TWILIO_PHONE_NUMBER');

if (hasTwilioConfig) {
  console.log('✅ Twilio configuration already exists in .env file');
} else {
  console.log('📝 Adding Twilio configuration to .env file...');
  
  // Add Twilio configuration
  const twilioConfig = `
# Twilio SMS Configuration (Production)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

# SMS Provider (change from 'console' to 'twilio' for production)
SMS_PROVIDER=twilio
`;

  envContent += twilioConfig;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Twilio configuration added to .env file');
}

console.log('\n📋 Next Steps:');
console.log('1. Sign up for Twilio at: https://www.twilio.com/try-twilio');
console.log('2. Get your Account SID and Auth Token from Twilio Console');
console.log('3. Purchase a phone number from Twilio');
console.log('4. Update the .env file with your Twilio credentials:');
console.log('   - TWILIO_ACCOUNT_SID=your_actual_account_sid');
console.log('   - TWILIO_AUTH_TOKEN=your_actual_auth_token');
console.log('   - TWILIO_PHONE_NUMBER=your_actual_phone_number');
console.log('5. Install Twilio SDK: npm install twilio');
console.log('6. Restart your server');

console.log('\n🔧 Twilio Setup Instructions:');
console.log('=' .repeat(50));
console.log('1. Go to: https://console.twilio.com/');
console.log('2. Sign up/Login to your account');
console.log('3. Go to "Phone Numbers" → "Manage" → "Buy a number"');
console.log('4. Choose a phone number with SMS capabilities');
console.log('5. Copy your Account SID and Auth Token from the dashboard');
console.log('6. Update your .env file with the real values');

console.log('\n💰 Twilio Pricing:');
console.log('- Free trial: $15 credit (enough for ~1000 SMS)');
console.log('- SMS cost: ~$0.0075 per message');
console.log('- Phone number: ~$1/month');

console.log('\n🧪 Test Configuration:');
console.log('After setup, run: node test-twilio-sms.js');
