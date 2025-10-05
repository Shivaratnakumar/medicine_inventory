const { supabaseAdmin } = require('./server/config/supabase');

async function testPaymentsTable() {
  try {
    console.log('Testing payments table...');
    
    // Test if payments table exists and is accessible
    const { data, error, count } = await supabaseAdmin
      .from('payments')
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.error('Error accessing payments table:', error);
      return;
    }
    
    console.log('Payments table is accessible');
    console.log('Total payments count:', count);
    console.log('Sample data:', data);
    
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

testPaymentsTable();
