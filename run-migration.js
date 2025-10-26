const { supabaseAdmin } = require('./server/config/supabase');
const fs = require('fs');

async function runMigration() {
  try {
    console.log('Running migration to add order_type column...');
    
    const sql = fs.readFileSync('./add-order-type-column.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim());
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: statement.trim() });
        
        if (error) {
          console.error('Error executing statement:', error);
        } else {
          console.log('Statement executed successfully:', data);
        }
      }
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigration();


