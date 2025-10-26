const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE_URL = 'http://localhost:5000/api';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseTables() {
  console.log('🔍 Checking Database Tables Status');
  console.log('=' .repeat(40));

  try {
    // Check otp_verifications table
    const { data: otpData, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .limit(1);

    if (otpError) {
      if (otpError.code === 'PGRST205') {
        console.log('❌ otp_verifications table MISSING');
        return false;
      } else {
        console.log('❌ otp_verifications table error:', otpError.message);
        return false;
      }
    } else {
      console.log('✅ otp_verifications table EXISTS');
    }

    // Check password_reset_tokens table
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .limit(1);

    if (tokenError) {
      if (tokenError.code === 'PGRST205') {
        console.log('❌ password_reset_tokens table MISSING');
        return false;
      } else {
        console.log('❌ password_reset_tokens table error:', tokenError.message);
        return false;
      }
    } else {
      console.log('✅ password_reset_tokens table EXISTS');
    }

    return true;

  } catch (error) {
    console.log('❌ Database check error:', error.message);
    return false;
  }
}

async function createTestUser() {
  console.log('\n👤 Creating/Checking Test User...');
  
  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, phone')
      .eq('phone', '+1234567890')
      .single();

    if (existingUser) {
      console.log('✅ Test user exists:', existingUser);
      return existingUser.id;
    }

    // Create test user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        email: 'test@example.com',
        phone: '+1234567890',
        first_name: 'Test',
        last_name: 'User',
        password_hash: '$2a$10$dummy.hash.for.testing',
        role: 'user',
        is_active: true
      }])
      .select('id, email, phone')
      .single();

    if (error) {
      console.log('❌ Error creating test user:', error.message);
      return null;
    }

    console.log('✅ Test user created:', newUser);
    return newUser.id;

  } catch (error) {
    console.log('❌ Error with test user:', error.message);
    return null;
  }
}

async function testOTPFlow() {
  console.log('\n📱 Testing Complete OTP Flow...');
  
  try {
    // Step 1: Send OTP request
    console.log('📞 Sending OTP request...');
    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      phone: '1234567890',
      method: 'sms'
    });

    console.log('✅ Forgot password response:', response.data);

    if (response.data.success) {
      console.log('📱 OTP request successful');
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if OTP was stored in database
      const { data: otpRecords, error } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('phone', '+1234567890')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.log('❌ Error checking OTP in database:', error.message);
      } else if (otpRecords && otpRecords.length > 0) {
        const otp = otpRecords[0];
        console.log('✅ OTP found in database:');
        console.log('   📱 OTP Code:', otp.otp_code);
        console.log('   ⏰ Expires at:', otp.expires_at);
        console.log('   📞 Phone:', otp.phone);
        
        // Test OTP verification
        console.log('\n🔐 Testing OTP verification...');
        try {
          const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
            phone: '1234567890',
            otp: otp.otp_code
          });
          
          console.log('✅ OTP verification successful:', verifyResponse.data);
          
          // Test password reset
          console.log('\n🔑 Testing password reset...');
          try {
            const resetResponse = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
              phone: '1234567890',
              otp: otp.otp_code,
              password: 'newpassword123',
              method: 'sms'
            });
            
            console.log('✅ Password reset successful:', resetResponse.data);
            
          } catch (resetError) {
            console.log('❌ Password reset failed:', resetError.response?.data?.message || resetError.message);
          }
          
        } catch (verifyError) {
          console.log('❌ OTP verification failed:', verifyError.response?.data?.message || verifyError.message);
        }
        
      } else {
        console.log('❌ No OTP found in database');
        console.log('🔍 This means OTP generation/storage failed');
      }
    }

  } catch (error) {
    console.log('❌ OTP flow test failed:', error.response?.data?.message || error.message);
  }
}

async function provideSolution() {
  console.log('\n🔧 SOLUTION STEPS:');
  console.log('=' .repeat(40));
  
  console.log('\n1. 📊 Check if database tables exist:');
  console.log('   - Go to Supabase dashboard');
  console.log('   - Check if otp_verifications table exists');
  console.log('   - Check if password_reset_tokens table exists');
  
  console.log('\n2. 🗄️ If tables are missing, create them:');
  console.log('   - Go to SQL Editor in Supabase');
  console.log('   - Run the SQL script I provided earlier');
  
  console.log('\n3. 🔄 Restart the server:');
  console.log('   - Stop current server (Ctrl+C)');
  console.log('   - Run: cd server && node index.js');
  
  console.log('\n4. 🧪 Test the OTP flow:');
  console.log('   - Run this script again');
  console.log('   - Check server console for OTP display');
  console.log('   - Verify OTP is stored in database');
}

async function main() {
  console.log('🔧 Senior Developer - Complete OTP Debug & Fix');
  console.log('=' .repeat(50));

  const tablesExist = await checkDatabaseTables();
  
  if (!tablesExist) {
    console.log('\n❌ CRITICAL ISSUE: Database tables missing!');
    console.log('📝 You need to create the tables in Supabase first.');
    await provideSolution();
    return;
  }

  const userId = await createTestUser();
  
  if (!userId) {
    console.log('\n❌ Cannot proceed without test user');
    await provideSolution();
    return;
  }

  await testOTPFlow();
  
  console.log('\n📋 Debug Summary:');
  console.log('1. Database tables: ' + (tablesExist ? '✅' : '❌'));
  console.log('2. Test user: ' + (userId ? '✅' : '❌'));
  console.log('3. OTP generation: Check results above');
  console.log('4. Server console: Check for OTP display');
}

main().catch(console.error);
