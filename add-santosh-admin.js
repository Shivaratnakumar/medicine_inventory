require('dotenv').config({ path: './server/.env' });
const { supabaseAdmin } = require('./server/config/supabase');
const fs = require('fs');

async function addSantoshAdmin() {
  try {
    console.log('🔧 Adding santoshbiradi@gmail.com as admin user...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('./add-santosh-admin.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.log(`⚠️  Statement ${i + 1} warning:`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`❌ Statement ${i + 1} error:`, err.message);
        }
      }
    }
    
    // Verify the user was added
    console.log('\n🧪 Verifying admin user was added...');
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role, created_at')
      .eq('email', 'santoshbiradi@gmail.com')
      .single();
    
    if (userError) {
      console.log('❌ Error verifying user:', userError.message);
    } else if (user) {
      console.log('✅ Admin user successfully added:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.created_at}`);
    } else {
      console.log('❌ User not found after insertion');
    }
    
    console.log('\n🎉 Admin user setup completed!');
    console.log('📋 Login credentials:');
    console.log('   Email: santoshbiradi@gmail.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error adding admin user:', error);
    process.exit(1);
  }
}

// Run the script
addSantoshAdmin();
















