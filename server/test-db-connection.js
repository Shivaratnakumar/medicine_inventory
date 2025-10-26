const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env file for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test feedback table
    console.log('\n1. Testing feedback table...');
    const { data: feedback, error: feedbackError } = await supabaseAdmin
      .from('feedback')
      .select('*')
      .limit(5);
    
    if (feedbackError) {
      console.error('Feedback table error:', feedbackError);
    } else {
      console.log('Feedback table OK. Records:', feedback?.length || 0);
    }
    
    // Test payments table
    console.log('\n2. Testing payments table...');
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .limit(5);
    
    if (paymentsError) {
      console.error('Payments table error:', paymentsError);
    } else {
      console.log('Payments table OK. Records:', payments?.length || 0);
    }
    
    // Test users table
    console.log('\n3. Testing users table...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name')
      .limit(5);
    
    if (usersError) {
      console.error('Users table error:', usersError);
    } else {
      console.log('Users table OK. Records:', users?.length || 0);
      console.log('Sample users:', users);
    }
    
    // Test orders table
    console.log('\n4. Testing orders table...');
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, customer_name')
      .limit(5);
    
    if (ordersError) {
      console.error('Orders table error:', ordersError);
    } else {
      console.log('Orders table OK. Records:', orders?.length || 0);
    }
    
  } catch (error) {
    console.error('Connection test failed:', error);
  }
}

testConnection();
