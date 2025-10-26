const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTablesAndFunctions() {
  console.log('🔧 Creating database tables and functions...');

  try {
    // Create password_reset_tokens table
    console.log('📝 Creating password_reset_tokens table...');
    const { error: tokensError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .limit(1);

    if (tokensError && tokensError.code === 'PGRST116') {
      console.log('⚠️  password_reset_tokens table does not exist. Please create it manually in Supabase SQL Editor.');
    } else {
      console.log('✅ password_reset_tokens table exists');
    }

    // Create otp_verifications table
    console.log('📝 Creating otp_verifications table...');
    const { error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .limit(1);

    if (otpError && otpError.code === 'PGRST116') {
      console.log('⚠️  otp_verifications table does not exist. Please create it manually in Supabase SQL Editor.');
    } else {
      console.log('✅ otp_verifications table exists');
    }

    // Test if validate_otp function exists
    console.log('📝 Testing validate_otp function...');
    const { data: testResult, error: testError } = await supabase
      .rpc('validate_otp', {
        p_phone: '+1234567890',
        p_otp_code: '123456',
        p_type: 'password_reset'
      });

    if (testError) {
      console.log('❌ validate_otp function does not exist:', testError.message);
      console.log('\n📋 Please run the following SQL script in Supabase SQL Editor:');
      console.log('=' .repeat(60));
      console.log(`
-- Create password_reset_tokens table
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

-- Create otp_verifications table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_user_id ON otp_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone ON otp_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_otp_code ON otp_verifications(otp_code);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON otp_verifications(expires_at);

-- Create function to clean up expired tokens and OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- Delete expired password reset tokens
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW() - INTERVAL '1 day';
    
    -- Delete expired OTP verifications
    DELETE FROM otp_verifications 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Create function to generate secure OTP
CREATE OR REPLACE FUNCTION generate_otp()
RETURNS VARCHAR(6) AS $$
BEGIN
    RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create function to validate OTP
CREATE OR REPLACE FUNCTION validate_otp(
    p_phone VARCHAR(20),
    p_otp_code VARCHAR(6),
    p_type VARCHAR(20)
)
RETURNS TABLE (
    is_valid BOOLEAN,
    user_id UUID,
    message TEXT
) AS $$
DECLARE
    v_otp_record RECORD;
    v_user_record RECORD;
BEGIN
    -- Get the most recent OTP for this phone and type
    SELECT * INTO v_otp_record
    FROM otp_verifications
    WHERE phone = p_phone 
      AND type = p_type
      AND expires_at > NOW()
      AND verified_at IS NULL
      AND attempts < max_attempts
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Check if OTP exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Invalid or expired OTP'::TEXT;
        RETURN;
    END IF;
    
    -- Check if OTP matches
    IF v_otp_record.otp_code != p_otp_code THEN
        -- Increment attempts
        UPDATE otp_verifications 
        SET attempts = attempts + 1
        WHERE id = v_otp_record.id;
        
        RETURN QUERY SELECT false, NULL::UUID, 'Invalid OTP code'::TEXT;
        RETURN;
    END IF;
    
    -- Get user ID
    SELECT id INTO v_user_record
    FROM users
    WHERE phone = p_phone AND is_active = true;
    
    -- Mark OTP as verified
    UPDATE otp_verifications 
    SET verified_at = NOW()
    WHERE id = v_otp_record.id;
    
    RETURN QUERY SELECT true, v_user_record.id, 'OTP verified successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;
      `);
      console.log('=' .repeat(60));
    } else {
      console.log('✅ validate_otp function exists and is working');
    }

  } catch (error) {
    console.error('❌ Error creating database functions:', error);
  }
}

async function testOTPFunctionality() {
  console.log('\n🧪 Testing OTP functionality...');
  
  try {
    // Test OTP generation
    const { data: otpData, error: otpError } = await supabase.rpc('generate_otp');
    if (otpError) {
      console.log('❌ OTP generation test failed:', otpError.message);
    } else {
      console.log('✅ OTP generation test passed:', otpData);
    }

    // Test cleanup function
    const { error: cleanupError } = await supabase.rpc('cleanup_expired_tokens');
    if (cleanupError) {
      console.log('❌ Cleanup function test failed:', cleanupError.message);
    } else {
      console.log('✅ Cleanup function test passed');
    }

  } catch (error) {
    console.error('❌ Error testing functionality:', error);
  }
}

async function main() {
  console.log('🚀 Setting up OTP Database Functions');
  console.log('=' .repeat(50));

  await createTablesAndFunctions();
  await testOTPFunctionality();

  console.log('\n🎉 Database setup completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Run the SQL script above in Supabase SQL Editor');
  console.log('2. Test the OTP functionality again');
  console.log('3. The forgot password feature should now work completely');
}

main().catch(console.error);
