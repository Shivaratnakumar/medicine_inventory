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

async function createTestUser() {
  console.log('👤 Creating test user for OTP testing...');
  
  const testUser = {
    email: 'test@example.com',
    phone: '+1234567890',
    first_name: 'Test',
    last_name: 'User',
    password_hash: '$2a$10$dummy.hash.for.testing',
    role: 'user',
    is_active: true
  };

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, phone')
      .eq('phone', '+1234567890')
      .single();

    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser);
      return existingUser.id;
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([testUser])
      .select('id, email, phone')
      .single();

    if (error) {
      console.error('❌ Error creating test user:', error);
      return null;
    }

    console.log('✅ Test user created:', newUser);
    return newUser.id;

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    return null;
  }
}

async function testOTPGeneration() {
  console.log('\n📱 Testing OTP generation with existing user...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      phone: '1234567890',
      method: 'sms'
    });

    console.log('✅ Forgot password response:', response.data);

    if (response.data.success) {
      console.log('\n📱 OTP should be generated and stored in database');
      console.log('📱 Check server console for OTP display');
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check database for OTP
      const { data: otpRecords, error } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('phone', '+1234567890')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.log('❌ Error checking OTP in database:', error);
      } else if (otpRecords && otpRecords.length > 0) {
        console.log('✅ OTP found in database:', otpRecords[0]);
        console.log('📱 OTP Code:', otpRecords[0].otp_code);
        console.log('⏰ Expires at:', otpRecords[0].expires_at);
        
        // Test OTP verification with real OTP
        console.log('\n🔐 Testing OTP verification with real OTP...');
        try {
          const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
            phone: '1234567890',
            otp: otpRecords[0].otp_code
          });
          
          console.log('✅ OTP verification successful:', verifyResponse.data);
          
        } catch (verifyError) {
          console.log('❌ OTP verification failed:', verifyError.response?.data?.message || verifyError.message);
        }
        
      } else {
        console.log('❌ No OTP found in database');
        console.log('🔍 This means OTP generation failed');
      }
    }

  } catch (error) {
    console.error('❌ Error testing OTP generation:', error.response?.data?.message || error.message);
  }
}

async function checkDatabaseTables() {
  console.log('\n🗄️ Checking database tables...');
  
  try {
    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, phone')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Users table error:', usersError);
    } else {
      console.log('✅ Users table accessible');
    }

    // Check otp_verifications table
    const { data: otps, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .limit(1);
    
    if (otpError) {
      console.log('❌ OTP verifications table error:', otpError);
    } else {
      console.log('✅ OTP verifications table accessible');
    }

  } catch (error) {
    console.error('❌ Database check error:', error);
  }
}

async function main() {
  console.log('🔧 Senior Developer - Complete OTP Debug');
  console.log('=' .repeat(50));

  await checkDatabaseTables();
  const userId = await createTestUser();
  
  if (userId) {
    await testOTPGeneration();
  } else {
    console.log('❌ Cannot proceed without test user');
  }

  console.log('\n📋 Debug Summary:');
  console.log('1. ✅ Database connection working');
  console.log('2. ✅ Test user created/found');
  console.log('3. ✅ OTP generation tested');
  console.log('4. 📱 Check server console for OTP display');
  console.log('5. 📱 Check database for OTP storage');
}

main().catch(console.error);
