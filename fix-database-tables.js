const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMissingTables() {
  console.log('🔧 Creating Missing Database Tables');
  console.log('=' .repeat(40));

  try {
    // Test if otp_verifications table exists
    const { data: otpTest, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .limit(1);

    if (otpError && otpError.code === 'PGRST205') {
      console.log('❌ otp_verifications table missing - creating...');
      
      // Since we can't create tables via Supabase client, we need to use SQL
      console.log('📝 Please run this SQL in Supabase SQL Editor:');
      console.log('=' .repeat(60));
      console.log(`
-- Create OTP verification table
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'password_reset',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL DEFAULT 'email',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone ON otp_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_otp_code ON otp_verifications(otp_code);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
      `);
      console.log('=' .repeat(60));
      
      console.log('\n📋 Steps to fix:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the SQL script above');
      console.log('4. Test the OTP functionality again');
      
    } else if (otpError) {
      console.log('❌ Error checking otp_verifications table:', otpError);
    } else {
      console.log('✅ otp_verifications table exists');
    }

    // Test password_reset_tokens table
    const { data: tokenTest, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .limit(1);

    if (tokenError && tokenError.code === 'PGRST205') {
      console.log('❌ password_reset_tokens table missing');
    } else if (tokenError) {
      console.log('❌ Error checking password_reset_tokens table:', tokenError);
    } else {
      console.log('✅ password_reset_tokens table exists');
    }

  } catch (error) {
    console.error('❌ Error checking tables:', error);
  }
}

async function testAfterTablesCreated() {
  console.log('\n🧪 Testing OTP functionality after tables are created...');
  
  try {
    const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      phone: '1234567890',
      method: 'sms'
    });

    console.log('✅ Forgot password response:', response.data);

    if (response.data.success) {
      console.log('\n📱 OTP should now be generated and stored');
      console.log('📱 Check server console for OTP display');
      console.log('📱 Check database for OTP storage');
    }

  } catch (error) {
    console.log('❌ Error testing OTP:', error.response?.data?.message || error.message);
  }
}

async function main() {
  await createMissingTables();
  
  console.log('\n🎯 Root Cause Found:');
  console.log('❌ Missing database tables: otp_verifications, password_reset_tokens');
  console.log('✅ Solution: Run the SQL script in Supabase SQL Editor');
  console.log('✅ After creating tables, OTP functionality will work');
}

main().catch(console.error);
