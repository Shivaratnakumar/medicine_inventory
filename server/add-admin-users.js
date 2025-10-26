const bcrypt = require('bcryptjs');

// Generate password hashes for the new admin users
async function generatePasswordHashes() {
  const users = [
    {
      email: 'santoshbhiradi22@gmail.com',
      password: 'santu@123',
      firstName: 'Santosh',
      lastName: 'Bhiradi'
    },
    {
      email: 'sanjubhagoji@gmail.com',
      password: 'Sanju@123',
      firstName: 'Sanju',
      lastName: 'Bhagoji'
    },
    {
      email: 'somnathnandi@gmail.com',
      password: 'Somu@123',
      firstName: 'Somnath',
      lastName: 'Nandi'
    }
  ];

  console.log('-- SQL Script to add new admin users\n');
  console.log('-- Generated on:', new Date().toISOString());
  console.log('-- Note: These users will be inserted only if they don\'t already exist\n');

  for (const user of users) {
    try {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(user.password, saltRounds);
      
      console.log(`-- Insert admin user: ${user.email}`);
      console.log(`INSERT INTO users (email, password_hash, first_name, last_name, role) `);
      console.log(`SELECT '${user.email}', '${passwordHash}', '${user.firstName}', '${user.lastName}', 'admin'::user_role `);
      console.log(`WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = '${user.email}');`);
      console.log('');
    } catch (error) {
      console.error(`Error hashing password for ${user.email}:`, error.message);
    }
  }

  console.log('-- Verify the inserted users');
  console.log('SELECT id, email, first_name, last_name, role, created_at FROM users WHERE email IN (');
  console.log("  'santoshbhiradi22@gmail.com',");
  console.log("  'sanjubhagoji@gmail.com',");
  console.log("  'somnathnandi@gmail.com'");
  console.log(');');
}

// Run the function
generatePasswordHashes().catch(console.error);
