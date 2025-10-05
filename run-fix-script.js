const { supabaseAdmin } = require('./server/config/supabase');
const fs = require('fs');

async function runFixScript() {
  try {
    console.log('🔧 Running fix script for billing, feedback, and support tables...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('./fix-billing-feedback-support.sql', 'utf8');
    
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
    
    // Test the tables
    console.log('\n🧪 Testing table access...');
    
    // Test billing
    const { data: billing, error: billingError } = await supabaseAdmin
      .from('billing')
      .select('*')
      .limit(5);
    
    if (billingError) {
      console.log('❌ Billing table error:', billingError.message);
    } else {
      console.log(`✅ Billing table: ${billing?.length || 0} records`);
    }
    
    // Test feedback
    const { data: feedback, error: feedbackError } = await supabaseAdmin
      .from('feedback')
      .select('*')
      .limit(5);
    
    if (feedbackError) {
      console.log('❌ Feedback table error:', feedbackError.message);
    } else {
      console.log(`✅ Feedback table: ${feedback?.length || 0} records`);
    }
    
    // Test support_tickets
    const { data: support, error: supportError } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .limit(5);
    
    if (supportError) {
      console.log('❌ Support tickets table error:', supportError.message);
    } else {
      console.log(`✅ Support tickets table: ${support?.length || 0} records`);
    }
    
    console.log('\n🎉 Fix script completed!');
    
  } catch (error) {
    console.error('💥 Fix script failed:', error);
  }
}

runFixScript().then(() => process.exit(0)).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
