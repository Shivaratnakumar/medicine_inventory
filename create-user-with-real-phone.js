const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUserWithRealPhone() {
  console.log('🔧 Creating user with real phone number...');
  
  const phoneNumber = '+918050372422';
  const email = 'user8050372422@example.com';
  
  try {
    // First, check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, phone')
      .eq('phone', phoneNumber)
      .single();

    if (existingUser) {
      console.log('✅ User already exists:', existingUser);
      return existingUser;
    }

    // Create user with real phone number
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: email,
        password_hash: '$2a$10$dummy.hash.for.testing',
        first_name: 'Test',
        last_name: 'User',
        phone: phoneNumber,
        role: 'user',
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.log('❌ Error creating user:', error);
      return null;
    }

    console.log('✅ User created successfully:', user);
    return user;

  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function main() {
  console.log('🧪 Creating User with Real Phone Number');
  console.log('=' .repeat(40));
  
  const user = await createUserWithRealPhone();
  
  if (user) {
    console.log('\n✅ User ready for OTP testing!');
    console.log('📱 Phone: +918050372422');
    console.log('📧 Email: user8050372422@example.com');
    console.log('\n🎯 Now test the OTP functionality with your real phone!');
    console.log('📱 You should receive the OTP in the server console');
  } else {
    console.log('\n❌ Failed to create user');
  }
}

main().catch(console.error);
