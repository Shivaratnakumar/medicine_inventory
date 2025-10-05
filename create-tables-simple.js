const { supabaseAdmin } = require('./server/config/supabase');

async function createMissingTables() {
  try {
    console.log('🔧 Creating missing database tables...');
    
    // Create billing table
    console.log('📝 Creating billing table...');
    const { error: billingError } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS billing (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          invoice_number VARCHAR(50) UNIQUE NOT NULL,
          order_id UUID REFERENCES orders(id),
          customer_name VARCHAR(255) NOT NULL,
          customer_email VARCHAR(255),
          customer_address TEXT,
          subtotal DECIMAL(10,2) NOT NULL,
          tax_amount DECIMAL(10,2) DEFAULT 0,
          discount_amount DECIMAL(10,2) DEFAULT 0,
          total_amount DECIMAL(10,2) NOT NULL,
          payment_status VARCHAR(20) DEFAULT 'pending',
          payment_method VARCHAR(50),
          payment_reference VARCHAR(100),
          due_date DATE,
          paid_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (billingError) {
      console.log('⚠️  Billing table creation warning:', billingError.message);
    } else {
      console.log('✅ Billing table created successfully');
    }
    
    // Create feedback table
    console.log('📝 Creating feedback table...');
    const { error: feedbackError } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS feedback (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          order_id UUID REFERENCES orders(id),
          rating INTEGER CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          is_public BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (feedbackError) {
      console.log('⚠️  Feedback table creation warning:', feedbackError.message);
    } else {
      console.log('✅ Feedback table created successfully');
    }
    
    // Create support_tickets table
    console.log('📝 Creating support_tickets table...');
    const { error: supportError } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS support_tickets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          ticket_number VARCHAR(50) UNIQUE NOT NULL,
          user_id UUID REFERENCES users(id),
          subject VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          status VARCHAR(20) DEFAULT 'open',
          priority VARCHAR(20) DEFAULT 'medium',
          assigned_to UUID REFERENCES users(id),
          resolution TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (supportError) {
      console.log('⚠️  Support tickets table creation warning:', supportError.message);
    } else {
      console.log('✅ Support tickets table created successfully');
    }
    
    // Insert sample data
    console.log('📊 Inserting sample data...');
    
    // Insert sample billing records
    const { error: billingInsertError } = await supabaseAdmin
      .from('billing')
      .insert([
        {
          invoice_number: 'INV001',
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          total_amount: 45.97,
          tax_amount: 3.68,
          discount_amount: 0.00,
          payment_status: 'paid',
          due_date: '2025-01-31'
        },
        {
          invoice_number: 'INV002',
          customer_name: 'Jane Smith',
          customer_email: 'jane@example.com',
          total_amount: 28.98,
          tax_amount: 2.32,
          discount_amount: 5.00,
          payment_status: 'pending',
          due_date: '2025-02-15'
        }
      ]);
    
    if (billingInsertError) {
      console.log('⚠️  Billing data insertion warning:', billingInsertError.message);
    } else {
      console.log('✅ Sample billing data inserted');
    }
    
    // Insert sample feedback records
    const { error: feedbackInsertError } = await supabaseAdmin
      .from('feedback')
      .insert([
        {
          user_id: (await supabaseAdmin.from('users').select('id').eq('email', 'admin@pharmacy.com').single()).data?.id,
          rating: 5,
          comment: 'Excellent service! Fast delivery and great quality medicines.',
          is_public: true
        },
        {
          user_id: (await supabaseAdmin.from('users').select('id').eq('email', 'user@example.com').single()).data?.id,
          rating: 4,
          comment: 'Good experience overall. Could improve on packaging.',
          is_public: true
        }
      ]);
    
    if (feedbackInsertError) {
      console.log('⚠️  Feedback data insertion warning:', feedbackInsertError.message);
    } else {
      console.log('✅ Sample feedback data inserted');
    }
    
    // Insert sample support tickets
    const { error: supportInsertError } = await supabaseAdmin
      .from('support_tickets')
      .insert([
        {
          ticket_number: 'TKT001',
          user_id: (await supabaseAdmin.from('users').select('id').eq('email', 'user@example.com').single()).data?.id,
          subject: 'Order not delivered',
          description: 'My order was supposed to be delivered yesterday but I haven\'t received it yet.',
          status: 'open',
          priority: 'high'
        },
        {
          ticket_number: 'TKT002',
          user_id: (await supabaseAdmin.from('users').select('id').eq('email', 'admin@pharmacy.com').single()).data?.id,
          subject: 'Payment issue',
          description: 'I\'m having trouble processing payment for my recent order.',
          status: 'in_progress',
          priority: 'medium'
        }
      ]);
    
    if (supportInsertError) {
      console.log('⚠️  Support tickets data insertion warning:', supportInsertError.message);
    } else {
      console.log('✅ Sample support tickets data inserted');
    }
    
    // Test the tables
    console.log('\n🧪 Testing table access...');
    
    const { data: billing, error: billingTestError } = await supabaseAdmin
      .from('billing')
      .select('*')
      .limit(5);
    
    if (billingTestError) {
      console.log('❌ Billing table test error:', billingTestError.message);
    } else {
      console.log(`✅ Billing table: ${billing?.length || 0} records`);
    }
    
    const { data: feedback, error: feedbackTestError } = await supabaseAdmin
      .from('feedback')
      .select('*')
      .limit(5);
    
    if (feedbackTestError) {
      console.log('❌ Feedback table test error:', feedbackTestError.message);
    } else {
      console.log(`✅ Feedback table: ${feedback?.length || 0} records`);
    }
    
    const { data: support, error: supportTestError } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .limit(5);
    
    if (supportTestError) {
      console.log('❌ Support tickets table test error:', supportTestError.message);
    } else {
      console.log(`✅ Support tickets table: ${support?.length || 0} records`);
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('💥 Database setup failed:', error);
  }
}

createMissingTables().then(() => process.exit(0)).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
