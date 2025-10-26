const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase credentials');
  console.log('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testExpiryTracker() {
  console.log('Testing Expiry Tracker functionality...');
  
  const today = new Date().toISOString().split('T')[0];
  console.log('Today:', today);
  
  // Test 1: Get all medicines to see what we have
  const { data: allMedicines, error: allError } = await supabase
    .from('medicines')
    .select('id, name, expiry_date, quantity_in_stock, is_active')
    .eq('is_active', true)
    .order('expiry_date', { ascending: true });
    
  if (allError) {
    console.log('Error fetching all medicines:', allError);
    return;
  }
  
  console.log(`\nTotal active medicines: ${allMedicines.length}`);
  console.log('Sample medicines with expiry dates:');
  allMedicines.slice(0, 5).forEach(med => {
    console.log(`- ${med.name}: ${med.expiry_date} (Stock: ${med.quantity_in_stock})`);
  });
  
  // Test 2: Get expired medicines (expiry date before today)
  const { data: expiredMedicines, error: expiredError } = await supabase
    .from('medicines')
    .select('id, name, expiry_date, quantity_in_stock')
    .eq('is_active', true)
    .lt('expiry_date', today);
    
  if (expiredError) {
    console.log('Error fetching expired medicines:', expiredError);
    return;
  }
  
  console.log(`\nExpired medicines (${expiredMedicines.length}):`);
  expiredMedicines.forEach(med => {
    const daysAgo = Math.ceil((new Date(today) - new Date(med.expiry_date)) / (1000 * 60 * 60 * 24));
    console.log(`- ${med.name}: ${med.expiry_date} (${daysAgo} days ago, Stock: ${med.quantity_in_stock})`);
  });
  
  // Test 3: Get expiring medicines (next 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const { data: expiringMedicines, error: expiringError } = await supabase
    .from('medicines')
    .select('id, name, expiry_date, quantity_in_stock')
    .eq('is_active', true)
    .gte('expiry_date', today)
    .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0]);
    
  if (expiringError) {
    console.log('Error fetching expiring medicines:', expiringError);
    return;
  }
  
  console.log(`\nExpiring medicines in next 30 days (${expiringMedicines.length}):`);
  expiringMedicines.forEach(med => {
    const daysUntil = Math.ceil((new Date(med.expiry_date) - new Date(today)) / (1000 * 60 * 60 * 24));
    console.log(`- ${med.name}: ${med.expiry_date} (${daysUntil} days, Stock: ${med.quantity_in_stock})`);
  });
  
  // Test 4: Test the date comparison logic used in the frontend
  console.log('\nTesting frontend date comparison logic:');
  const testDates = [
    '2023-12-01', // Expired
    '2024-01-01', // Expired
    today, // Today
    '2024-12-31', // Future
    '2025-01-15'  // Future
  ];
  
  testDates.forEach(date => {
    const todayDate = new Date(today);
    const expiryDateObj = new Date(date);
    const diffTime = expiryDateObj - todayDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let status = 'good';
    if (diffDays < 0) status = 'expired';
    else if (diffDays <= 7) status = 'critical';
    else if (diffDays <= 30) status = 'warning';
    
    console.log(`- ${date}: ${diffDays} days, status: ${status}`);
  });
}

testExpiryTracker().catch(console.error);
