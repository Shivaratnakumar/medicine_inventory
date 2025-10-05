const { Pool } = require('pg');
const path = require('path');

// Load environment variables from server directory
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

console.log('Environment variables loaded:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing');

// Create direct PostgreSQL connection
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const connectionString = `postgresql://postgres:${serviceKey}@${supabaseUrl.replace('https://', '').replace('.supabase.co', '')}.supabase.co:5432/postgres`;

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting up database tables...');
    
    // Read and execute the recreate orders tables script
    const fs = require('fs');
    const path = require('path');
    
    const sqlScript = fs.readFileSync(path.join(__dirname, 'recreate-orders-tables.sql'), 'utf8');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          await client.query(statement);
        } catch (error) {
          console.log(`⚠️  Statement ${i + 1} failed (this might be expected):`, error.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('✅ Database setup completed!');
    
    // Test the orders table
    const testResult = await client.query('SELECT COUNT(*) as count FROM orders');
    console.log(`📊 Orders in database: ${testResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
