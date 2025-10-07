require('dotenv').config({ path: './server/.env' });
const { supabaseAdmin } = require('./server/config/supabase');
const fs = require('fs');

async function setupMedicineNames() {
  try {
    console.log('🚀 Setting up medicine names table...');
    
    // Read the schema file
    const schema = fs.readFileSync('./medicine-names-schema.sql', 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
            sql: statement + ';' 
          });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message);
          // Continue with other statements
        }
      }
    }
    
    // Test the setup by querying the table
    console.log('🧪 Testing the setup...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('medicine_names')
      .select('*')
      .limit(5);
    
    if (testError) {
      console.error('❌ Test query failed:', testError.message);
    } else {
      console.log('✅ Medicine names table setup completed successfully!');
      console.log(`📊 Found ${testData.length} sample records`);
      if (testData.length > 0) {
        console.log('📋 Sample data:', testData[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupMedicineNames();

