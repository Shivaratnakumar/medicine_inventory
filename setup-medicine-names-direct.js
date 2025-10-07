require('dotenv').config({ path: './server/.env' });
const { supabaseAdmin } = require('./server/config/supabase');

async function setupMedicineNames() {
  try {
    console.log('🚀 Setting up medicine names table...');
    
    // Create the medicine_names table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS medicine_names (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        generic_name VARCHAR(255),
        brand_name VARCHAR(255),
        common_names TEXT[],
        search_vector tsvector,
        popularity_score INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_medicine_name UNIQUE (name)
      );
    `;
    
    console.log('📝 Creating medicine_names table...');
    const { error: createError } = await supabaseAdmin
      .from('medicine_names')
      .select('id')
      .limit(1);
    
    if (createError && createError.code === 'PGRST116') {
      console.log('⚠️ Table does not exist, will need to create it manually in Supabase dashboard');
      console.log('📋 Please run this SQL in your Supabase SQL editor:');
      console.log(createTableSQL);
    } else {
      console.log('✅ Table already exists or created successfully');
    }
    
    // Test if we can insert data
    console.log('🧪 Testing data insertion...');
    const testData = {
      name: 'Test Medicine',
      generic_name: 'Test Generic',
      brand_name: 'Test Brand',
      common_names: ['Test', 'Sample'],
      popularity_score: 100
    };
    
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('medicine_names')
      .insert(testData)
      .select();
    
    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message);
      console.log('📋 Please create the table manually using the SQL provided above');
    } else {
      console.log('✅ Insert test successful!');
      console.log('📊 Inserted data:', insertData[0]);
      
      // Clean up test data
      await supabaseAdmin
        .from('medicine_names')
        .delete()
        .eq('name', 'Test Medicine');
      console.log('🧹 Cleaned up test data');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('📋 Please create the table manually in Supabase dashboard');
  }
}

// Run the setup
setupMedicineNames();

