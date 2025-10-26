const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  console.log('🔧 Creating test user...');
  
  try {
    // First, check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, phone')
      .eq('phone', '+1234567890')
      .single();

    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser);
      return existingUser;
    }

    // Create test user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: 'test@example.com',
        password_hash: '$2a$10$dummy.hash.for.testing',
        first_name: 'Test',
        last_name: 'User',
        phone: '+1234567890',
        role: 'user',
        is_active: true,
        email_verified: true
      })
      .select()
      .single();

    if (error) {
      console.log('❌ Error creating user:', error);
      return null;
    }

    console.log('✅ Test user created:', user);
    return user;

  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function main() {
  console.log('🧪 Creating Test User for OTP Testing');
  console.log('=' .repeat(40));
  
  const user = await createTestUser();
  
  if (user) {
    console.log('\n✅ Test user ready!');
    console.log('📱 Phone: +1234567890');
    console.log('📧 Email: test@example.com');
    console.log('\n🎯 Now test the OTP functionality!');
  } else {
    console.log('\n❌ Failed to create test user');
  }
}

main().catch(console.error);