const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testServerStatus() {
  console.log('🔌 Testing Server Status');
  console.log('=' .repeat(30));

  try {
    // Test basic connectivity
    console.log('📡 Testing server connectivity...');
    const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
      timeout: 5000
    });
    console.log('✅ Server is running and accessible');
    console.log('📊 Response status:', response.status);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running');
      console.log('🔧 Start the server with: cd server && npm start');
    } else if (error.response?.status === 401) {
      console.log('✅ Server is running (401 is expected for /auth/verify without token)');
    } else {
      console.log('❌ Server error:', error.message);
    }
  }

  try {
    // Test forgot password endpoint
    console.log('\n📱 Testing forgot password endpoint...');
    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      phone: '1234567890',
      method: 'sms'
    }, {
      timeout: 10000
    });
    
    console.log('✅ Forgot password endpoint working');
    console.log('📊 Response:', response.data);
    
    if (response.data.success) {
      console.log('📱 SMS service is working');
      console.log('📱 Check server console for OTP details');
    }
    
  } catch (error) {
    console.log('❌ Forgot password endpoint error:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 500) {
      console.log('🔧 Server error - check server console for details');
    }
  }

  try {
    // Test OTP verification endpoint
    console.log('\n🔐 Testing OTP verification endpoint...');
    const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
      phone: '1234567890',
      otp: '123456'
    }, {
      timeout: 5000
    });
    
    console.log('✅ OTP verification endpoint working');
    console.log('📊 Response:', response.data);
    
  } catch (error) {
    console.log('❌ OTP verification endpoint error:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 500) {
      console.log('🔧 Server error - check server console for details');
    }
  }

  console.log('\n📋 Summary:');
  console.log('  - Server connectivity: ' + (await testConnectivity() ? '✅' : '❌'));
  console.log('  - Forgot password: ' + (await testForgotPassword() ? '✅' : '❌'));
  console.log('  - OTP verification: ' + (await testOTPVerification() ? '✅' : '❌'));
}

async function testConnectivity() {
  try {
    await axios.get(`${API_BASE_URL}/auth/verify`, { timeout: 5000 });
    return true;
  } catch (error) {
    return error.response?.status === 401; // 401 is expected
  }
}

async function testForgotPassword() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      phone: '1234567890',
      method: 'sms'
    }, { timeout: 10000 });
    return response.data.success;
  } catch (error) {
    return false;
  }
}

async function testOTPVerification() {
  try {
    await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
      phone: '1234567890',
      otp: '123456'
    }, { timeout: 5000 });
    return true;
  } catch (error) {
    return error.response?.status === 400; // 400 is expected for invalid OTP
  }
}

testServerStatus().catch(console.error);
