const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Load environment variables from server/.env
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase credentials');
  console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testExpiryDirect() {
  console.log('Testing Expiry Tracker - Direct Database Query...');
  
  const today = new Date().toISOString().split('T')[0];
  console.log('Today:', today);
  
  try {
    // Test 1: Get all active medicines
    console.log('\n1. Fetching all active medicines...');
    const { data: allMedicines, error: allError } = await supabase
      .from('medicines')
      .select('id, name, expiry_date, quantity_in_stock, is_active')
      .eq('is_active', true)
      .order('expiry_date', { ascending: true });
      
    if (allError) {
      console.log('Error fetching all medicines:', allError);
      return;
    }
    
    console.log(`Total active medicines: ${allMedicines.length}`);
    
    if (allMedicines.length > 0) {
      console.log('Sample medicines:');
      allMedicines.slice(0, 3).forEach(med => {
        console.log(`- ${med.name}: ${med.expiry_date} (Stock: ${med.quantity_in_stock})`);
      });
    }
    
    // Test 2: Get expired medicines (expiry date before today)
    console.log('\n2. Fetching expired medicines...');
    const { data: expiredMedicines, error: expiredError } = await supabase
      .from('medicines')
      .select('id, name, expiry_date, quantity_in_stock')
      .eq('is_active', true)
      .lt('expiry_date', today);
      
    if (expiredError) {
      console.log('Error fetching expired medicines:', expiredError);
      return;
    }
    
    console.log(`Expired medicines: ${expiredMedicines.length}`);
    if (expiredMedicines.length > 0) {
      console.log('Expired medicines:');
      expiredMedicines.forEach(med => {
        const daysAgo = Math.ceil((new Date(today) - new Date(med.expiry_date)) / (1000 * 60 * 60 * 24));
        console.log(`- ${med.name}: ${med.expiry_date} (${daysAgo} days ago, Stock: ${med.quantity_in_stock})`);
      });
    } else {
      console.log('No expired medicines found.');
    }
    
    // Test 3: Get expiring medicines (next 30 days)
    console.log('\n3. Fetching expiring medicines (next 30 days)...');
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
    
    console.log(`Expiring medicines (next 30 days): ${expiringMedicines.length}`);
    if (expiringMedicines.length > 0) {
      console.log('Expiring medicines:');
      expiringMedicines.forEach(med => {
        const daysUntil = Math.ceil((new Date(med.expiry_date) - new Date(today)) / (1000 * 60 * 60 * 24));
        console.log(`- ${med.name}: ${med.expiry_date} (${daysUntil} days, Stock: ${med.quantity_in_stock})`);
      });
    } else {
      console.log('No expiring medicines found.');
    }
    
    // Test 4: Check if we have any medicines with past expiry dates
    console.log('\n4. Checking for medicines with past expiry dates...');
    const pastExpiryMedicines = allMedicines.filter(med => 
      med.expiry_date && med.expiry_date < today
    );
    
    console.log(`Medicines with past expiry dates: ${pastExpiryMedicines.length}`);
    if (pastExpiryMedicines.length > 0) {
      console.log('Past expiry medicines:');
      pastExpiryMedicines.forEach(med => {
        const daysAgo = Math.ceil((new Date(today) - new Date(med.expiry_date)) / (1000 * 60 * 60 * 24));
        console.log(`- ${med.name}: ${med.expiry_date} (${daysAgo} days ago, Stock: ${med.quantity_in_stock})`);
      });
    }
    
    // Test 5: Test the frontend date comparison logic
    console.log('\n5. Testing frontend date comparison logic...');
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
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testExpiryDirect().catch(console.error);
