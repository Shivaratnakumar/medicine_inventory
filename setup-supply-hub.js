const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupSupplyHubSchema() {
  console.log('🚀 Setting up Supply Hub database schema...');

  try {
    // Read the schema file
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'supply-relationships-schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      process.exit(1);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    
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
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.warn(`⚠️  Warning on statement ${i + 1}:`, error.message);
            // Continue with other statements even if one fails
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.warn(`⚠️  Error executing statement ${i + 1}:`, err.message);
          // Continue with other statements
        }
      }
    }

    console.log('✅ Supply Hub schema setup completed!');
    
    // Test the setup by checking if tables exist
    console.log('🔍 Verifying table creation...');
    
    const tables = [
      'supply_relationships',
      'supply_orders', 
      'supply_order_items',
      'supply_payments'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`❌ Table ${table} not accessible:`, error.message);
        } else {
          console.log(`✅ Table ${table} is accessible`);
        }
      } catch (err) {
        console.error(`❌ Error checking table ${table}:`, err.message);
      }
    }

    console.log('🎉 Supply Hub setup complete!');
    console.log('📋 Next steps:');
    console.log('1. Start your server: npm run dev');
    console.log('2. Navigate to the Supply Hub in your application');
    console.log('3. Create supply relationships with other medical stores');
    console.log('4. Start managing supply orders and payments');

  } catch (error) {
    console.error('❌ Error setting up Supply Hub schema:', error);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function setupSupplyHubSchemaDirect() {
  console.log('🚀 Setting up Supply Hub database schema (direct method)...');

  try {
    // Create supply_relationships table
    console.log('📝 Creating supply_relationships table...');
    const { error: relError } = await supabase
      .from('supply_relationships')
      .select('*')
      .limit(1);

    if (relError && relError.code === 'PGRST116') {
      // Table doesn't exist, create it
      console.log('Creating supply_relationships table...');
      // Note: This would require direct SQL execution which might not be available
      // In a real scenario, you'd run the SQL directly in your database
      console.log('⚠️  Please run the supply-relationships-schema.sql file directly in your Supabase SQL editor');
    } else {
      console.log('✅ supply_relationships table already exists');
    }

    console.log('🎉 Setup instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of supply-relationships-schema.sql');
    console.log('4. Execute the SQL script');
    console.log('5. Verify tables are created in the Table Editor');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the setup
if (require.main === module) {
  setupSupplyHubSchemaDirect();
}

module.exports = { setupSupplyHubSchema, setupSupplyHubSchemaDirect };


