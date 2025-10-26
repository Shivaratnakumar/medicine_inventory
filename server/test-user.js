const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Load environment variables from server/.env
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.JWT_SECRET;

if (!supabaseUrl || !supabaseKey || !jwtSecret) {
  console.log('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  console.log('Creating test user...');
  
  try {
    // Check if test user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test@example.com')
      .single();
    
    if (existingUser) {
      console.log('Test user already exists:', existingUser.email);
      
      // Generate token for existing user
      const token = jwt.sign(
        { userId: existingUser.id, email: existingUser.email },
        jwtSecret,
        { expiresIn: '7d' }
      );
      
      console.log('Generated token for existing user');
      console.log('Token:', token);
      
      // Test the API with this token
      await testAPIWithToken(token);
      return;
    }
    
    // Create new test user
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          email: 'test@example.com',
          password: hashedPassword,
          first_name: 'Test',
          last_name: 'User',
          role: 'admin',
          phone: '1234567890',
          is_active: true
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      return;
    }
    
    console.log('Test user created successfully:', newUser.email);
    
    // Generate token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      jwtSecret,
      { expiresIn: '7d' }
    );
    
    console.log('Generated token for new user');
    console.log('Token:', token);
    
    // Test the API with this token
    await testAPIWithToken(token);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

async function testAPIWithToken(token) {
  const axios = require('axios');
  
  try {
    console.log('\nTesting API with token...');
    
    // Test expired medicines
    const expiredResponse = await axios.get('http://localhost:5000/api/medicines/expiring?days=0', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Expired medicines API response:');
    console.log('- Status:', expiredResponse.status);
    console.log('- Count:', expiredResponse.data.data?.length || 0);
    console.log('- Data:', expiredResponse.data.data);
    
    // Test expiring medicines
    const expiringResponse = await axios.get('http://localhost:5000/api/medicines/expiring?days=30', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\nExpiring medicines API response:');
    console.log('- Status:', expiringResponse.status);
    console.log('- Count:', expiringResponse.data.data?.length || 0);
    console.log('- Data:', expiringResponse.data.data);
    
  } catch (error) {
    console.error('API test error:', error.response?.data || error.message);
  }
}

createTestUser();
