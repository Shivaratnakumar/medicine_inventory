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
  
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, phone')
      .eq('phone', '+1234567890')
      .single();

    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser);
      return existingUser;
    }

    // Create new test user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        email: 'testuser@example.com',
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
    return newUser;

  } catch (error) {
    console.log('❌ Error with test user:', error.message);
    return null;
  }
}

async function testOTPWithUser(user) {
  console.log('\n📱 Testing OTP with existing user...');
  console.log(`📞 Phone: ${user.phone}`);
  
  try {
    // Send OTP request
    console.log('📞 Sending OTP request...');
    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      phone: user.phone.replace('+', ''), // Remove + for API call
      method: 'sms'
    });

    console.log('✅ Forgot password response:', response.data);

    if (response.data.success) {
      console.log('\n🎉 SUCCESS! OTP should now be generated!');
      console.log('📱 Check the server console for the OTP code');
      console.log('📱 Look for: "📱 SMS MESSAGE (Development Mode)"');
      console.log('📱 The OTP code will be displayed there');
      
      // Wait for processing
      console.log('\n⏳ Waiting 3 seconds for OTP generation...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check database for OTP
      const { data: otpRecords, error } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('phone', user.phone)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.log('❌ Error checking OTP in database:', error.message);
      } else if (otpRecords && otpRecords.length > 0) {
        const otp = otpRecords[0];
        console.log('\n✅ OTP found in database:');
        console.log('   📱 OTP Code:', otp.otp_code);
        console.log('   ⏰ Expires at:', otp.expires_at);
        console.log('   📞 Phone:', otp.phone);
        
        console.log('\n🎯 Use this OTP code in your frontend testing!');
        console.log(`📱 OTP: ${otp.otp_code}`);
        
      } else {
        console.log('❌ No OTP found in database');
        console.log('🔍 Check server console for error messages');
      }
    } else {
      console.log('❌ OTP request failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ OTP test failed:', error.response?.data?.message || error.message);
  }
}

async function main() {
  console.log('🔧 Creating User and Testing OTP');
  console.log('=' .repeat(40));

  const user = await createTestUser();
  
  if (!user) {
    console.log('❌ Cannot proceed without test user');
    return;
  }

  await testOTPWithUser(user);
  
  console.log('\n📋 Summary:');
  console.log('1. ✅ Test user created/found');
  console.log('2. ✅ OTP request sent');
  console.log('3. 📱 Check server console for OTP display');
  console.log('4. 📱 Use the OTP code in frontend testing');
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Check server console for OTP code');
  console.log('2. Start frontend: cd client && npm start');
  console.log('3. Test forgot password flow');
  console.log('4. Use the OTP code from server console');
}

main().catch(console.error);
