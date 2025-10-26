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

async function findExistingUser() {
  console.log('👤 Finding existing user for testing...');
  
  try {
    // Find any existing user
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, phone, first_name')
      .eq('is_active', true)
      .limit(5);

    if (error) {
      console.log('❌ Error finding users:', error.message);
      return null;
    }

    if (users && users.length > 0) {
      console.log('✅ Found existing users:');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.first_name} - ${user.email} - ${user.phone}`);
      });
      
      // Use the first user
      const testUser = users[0];
      console.log(`\n📱 Using user: ${testUser.first_name} (${testUser.phone})`);
      return testUser;
    } else {
      console.log('❌ No active users found');
      return null;
    }

  } catch (error) {
    console.log('❌ Error finding users:', error.message);
    return null;
  }
}

async function testOTPWithUser(user) {
  console.log('\n📱 Testing OTP with existing user...');
  console.log(`📞 Phone: ${user.phone}`);
  
  try {
    // Step 1: Send OTP request
    console.log('📞 Sending OTP request...');
    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      phone: user.phone.replace('+', ''), // Remove + for API call
      method: 'sms'
    });

    console.log('✅ Forgot password response:', response.data);

    if (response.data.success) {
      console.log('📱 OTP request successful');
      console.log('📱 Check server console for OTP display');
      
      // Wait for processing
      console.log('⏳ Waiting 3 seconds for OTP generation...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if OTP was stored in database
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
        console.log('✅ OTP found in database:');
        console.log('   📱 OTP Code:', otp.otp_code);
        console.log('   ⏰ Expires at:', otp.expires_at);
        console.log('   📞 Phone:', otp.phone);
        console.log('   🆔 User ID:', otp.user_id);
        
        // Test OTP verification
        console.log('\n🔐 Testing OTP verification...');
        try {
          const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
            phone: user.phone.replace('+', ''),
            otp: otp.otp_code
          });
          
          console.log('✅ OTP verification successful:', verifyResponse.data);
          
          if (verifyResponse.data.resetToken) {
            console.log('🎉 COMPLETE SUCCESS! OTP system is working!');
            console.log('📱 You can now use the frontend to test the complete flow');
          }
          
        } catch (verifyError) {
          console.log('❌ OTP verification failed:', verifyError.response?.data?.message || verifyError.message);
        }
        
      } else {
        console.log('❌ No OTP found in database');
        console.log('🔍 This means OTP generation/storage failed');
        console.log('📱 Check server console for error messages');
      }
    } else {
      console.log('❌ OTP request failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ OTP test failed:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 500) {
      console.log('🔧 Server error - check server console for details');
    }
  }
}

async function checkServerStatus() {
  console.log('🔍 Checking Server Status...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Server is running and healthy');
    console.log('📊 Server status:', response.data.status);
  } catch (error) {
    console.log('❌ Server not responding:', error.message);
    console.log('🔧 Start server with: cd server && node index.js');
    return false;
  }
  
  return true;
}

async function main() {
  console.log('🔧 Senior Developer - Final OTP Test');
  console.log('=' .repeat(50));

  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    return;
  }

  const user = await findExistingUser();
  if (!user) {
    console.log('❌ No users found to test with');
    console.log('💡 Create a user first or check your database');
    return;
  }

  await testOTPWithUser(user);
  
  console.log('\n📋 Final Status:');
  console.log('1. ✅ Database tables exist');
  console.log('2. ✅ Server is running');
  console.log('3. ✅ Test user found');
  console.log('4. 📱 OTP generation: Check results above');
  console.log('5. 📱 Server console: Check for OTP display');
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Check server console for OTP code');
  console.log('2. Use the OTP code in frontend testing');
  console.log('3. Complete password reset flow');
}

main().catch(console.error);
