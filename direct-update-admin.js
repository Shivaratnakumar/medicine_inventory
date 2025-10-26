require('dotenv').config({ path: './server/.env' });
const { supabaseAdmin } = require('./server/config/supabase');

async function updateToAdmin() {
  try {
    console.log('🔧 Directly updating santoshbiradi@gmail.com to admin role...');
    
    // Update the user role directly using Supabase client
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('email', 'santoshbiradi@gmail.com')
      .select();
    
    if (error) {
      console.error('❌ Error updating user role:', error);
    } else {
      console.log('✅ User role updated successfully');
      console.log('Updated data:', data);
    }
    
    // Verify the update
    console.log('\n🧪 Verifying admin role...');
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role, created_at, updated_at')
      .eq('email', 'santoshbiradi@gmail.com')
      .single();
    
    if (userError) {
      console.log('❌ Error verifying user:', userError.message);
    } else if (user) {
      console.log('✅ User verification successful:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Updated: ${user.updated_at}`);
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
updateToAdmin();















