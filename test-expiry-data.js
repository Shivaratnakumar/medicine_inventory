const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testExpiryData() {
  console.log('Testing expiry data...');
  
  // Test 1: Check if medicines table exists and has data
  const { data: medicines, error: medicinesError } = await supabase
    .from('medicines')
    .select('id, name, expiry_date, quantity_in_stock, is_active')
    .limit(5);
    
  if (medicinesError) {
    console.log('Error fetching medicines:', medicinesError);
    return;
  }
  
  console.log('Sample medicines data:');
  console.log(JSON.stringify(medicines, null, 2));
  
  // Test 2: Check expiring medicines (next 30 days)
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  const { data: expiring, error: expiringError } = await supabase
    .from('medicines')
    .select('id, name, expiry_date, quantity_in_stock')
    .eq('is_active', true)
    .gte('expiry_date', today.toISOString().split('T')[0])
    .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
    .order('expiry_date', { ascending: true });
    
  if (expiringError) {
    console.log('Error fetching expiring medicines:', expiringError);
    return;
  }
  
  console.log('Expiring medicines (next 30 days):');
  console.log(JSON.stringify(expiring, null, 2));
  
  // Test 3: Check expired medicines
  const { data: expired, error: expiredError } = await supabase
    .from('medicines')
    .select('id, name, expiry_date, quantity_in_stock')
    .eq('is_active', true)
    .lt('expiry_date', today.toISOString().split('T')[0]);
    
  if (expiredError) {
    console.log('Error fetching expired medicines:', expiredError);
    return;
  }
  
  console.log('Expired medicines:');
  console.log(JSON.stringify(expired, null, 2));
}

testExpiryData().catch(console.error);
