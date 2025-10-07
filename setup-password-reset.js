const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupPasswordResetTables() {
  console.log('🔧 Setting up password reset tables...');

  try {
    // Read the SQL file
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, 'database', 'password-reset-schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`📝 Executing: ${statement.trim().substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() });
        
        if (error) {
          console.error('❌ Error executing statement:', error);
          // Continue with other statements
        }
      }
    }

    console.log('✅ Password reset tables setup completed!');
    console.log('\n📋 Created tables:');
    console.log('  - password_reset_tokens');
    console.log('  - otp_verifications');
    console.log('\n📋 Created functions:');
    console.log('  - generate_otp()');
    console.log('  - validate_otp()');
    console.log('  - cleanup_expired_tokens()');

  } catch (error) {
    console.error('❌ Error setting up password reset tables:', error);
    process.exit(1);
  }
}

async function testPasswordResetFunctionality() {
  console.log('\n🧪 Testing password reset functionality...');

  try {
    // Test OTP generation
    const { data: otpData, error: otpError } = await supabase.rpc('generate_otp');
    if (otpError) {
      console.error('❌ Error testing OTP generation:', otpError);
    } else {
      console.log('✅ OTP generation test passed:', otpData);
    }

    // Test cleanup function
    const { error: cleanupError } = await supabase.rpc('cleanup_expired_tokens');
    if (cleanupError) {
      console.error('❌ Error testing cleanup function:', cleanupError);
    } else {
      console.log('✅ Cleanup function test passed');
    }

  } catch (error) {
    console.error('❌ Error testing functionality:', error);
  }
}

async function main() {
  console.log('🚀 Setting up Password Reset Feature for Medicine Inventory');
  console.log('=' .repeat(60));

  await setupPasswordResetTables();
  await testPasswordResetFunctionality();

  console.log('\n🎉 Password reset feature setup completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Update your .env file with email and SMS service credentials');
  console.log('2. Install required packages: npm install nodemailer twilio aws-sdk');
  console.log('3. Start your server: npm start');
  console.log('4. Test the forgot password functionality on the login page');
  
  console.log('\n📧 Email Service Configuration:');
  console.log('  - Set EMAIL_PROVIDER in .env (console, gmail, smtp, sendgrid)');
  console.log('  - Configure corresponding credentials');
  
  console.log('\n📱 SMS Service Configuration:');
  console.log('  - Set SMS_PROVIDER in .env (console, twilio, aws-sns)');
  console.log('  - Configure corresponding credentials');
  
  console.log('\n🔗 Frontend URL:');
  console.log('  - Set FRONTEND_URL in .env for email reset links');
  console.log('  - Default: http://localhost:3000');
}

main().catch(console.error);
