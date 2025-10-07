require('dotenv').config({ path: './server/.env' });
const { supabaseAdmin } = require('./server/config/supabase');

async function createMedicineNamesTable() {
  try {
    console.log('🚀 Creating medicine_names table...');
    
    // First, let's try to create the table using a simple approach
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS medicine_names (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        generic_name VARCHAR(255),
        brand_name VARCHAR(255),
        common_names TEXT[],
        popularity_score INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_medicine_name UNIQUE (name)
      );
    `;
    
    console.log('📝 Executing table creation...');
    
    // Try to execute the SQL directly
    const { data, error } = await supabaseAdmin
      .from('medicine_names')
      .select('id')
      .limit(1);
    
    if (error && error.code === 'PGRST205') {
      console.log('❌ Table does not exist. You need to create it manually in Supabase.');
      console.log('📋 Please follow these steps:');
      console.log('1. Go to your Supabase project dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the SQL from create-medicine-names-table.sql');
      console.log('4. Execute the script');
      console.log('\n📄 SQL to copy:');
      console.log('='.repeat(50));
      console.log(createTableSQL);
      console.log('='.repeat(50));
      return false;
    } else if (error) {
      console.error('❌ Error checking table:', error);
      return false;
    } else {
      console.log('✅ Table already exists!');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
    return false;
  }
}

// Run the function
createMedicineNamesTable().then(success => {
  if (success) {
    console.log('✅ Table setup complete!');
  } else {
    console.log('❌ Table setup failed - manual intervention required');
  }
  process.exit(success ? 0 : 1);
});

