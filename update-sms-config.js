const fs = require('fs');
const path = require('path');

// Update the .env file to use real SMS service
const envPath = path.join(__dirname, 'server', '.env');

try {
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update SMS provider to textbelt
  envContent = envContent.replace(
    /SMS_PROVIDER=console/,
    'SMS_PROVIDER=textbelt'
  );
  
  // Add TextBelt API key if not present
  if (!envContent.includes('TEXTBELT_API_KEY')) {
    envContent += '\n# TextBelt Configuration (Free SMS API)\nTEXTBELT_API_KEY=textbelt\n';
  }
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ SMS configuration updated successfully!');
  console.log('📱 SMS Provider: textbelt (Free SMS API)');
  console.log('🔑 API Key: textbelt (free tier)');
  console.log('\n📝 To use Twilio instead:');
  console.log('   1. Get Twilio credentials from https://twilio.com');
  console.log('   2. Update SMS_PROVIDER=twilio in .env');
  console.log('   3. Add your Twilio credentials');
  
} catch (error) {
  console.error('❌ Error updating SMS configuration:', error.message);
  console.log('\n📝 Manual update required:');
  console.log('   Change SMS_PROVIDER=console to SMS_PROVIDER=textbelt in server/.env');
}
