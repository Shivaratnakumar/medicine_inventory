const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_url_here' &&
  supabaseAnonKey !== 'your_supabase_anon_key_here' &&
  supabaseUrl.startsWith('https://');

if (!hasValidCredentials) {
  console.warn('⚠️ Missing or invalid Supabase environment variables. Server will start but database features will be disabled.');
  console.warn('   Please set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in your .env file');
}

// Connection options for better stability
const supabaseOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'medicine-inventory-server'
    }
  }
};

// Client for general operations
const supabase = hasValidCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey, supabaseOptions)
  : null;

// Admin client for server-side operations with retry logic
const supabaseAdmin = hasValidCredentials 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      ...supabaseOptions,
      auth: {
        ...supabaseOptions.auth,
        persistSession: false
      }
    })
  : null;

// Connection health check function
const checkConnection = async () => {
  if (!hasValidCredentials) {
    console.warn('⚠️ Skipping database connection check - no valid credentials');
    return false;
  }
  
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection check failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection healthy');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
};

// Test connection on startup
checkConnection().then(isHealthy => {
  if (!isHealthy) {
    console.warn('⚠️ Database connection issues detected on startup');
  }
});

module.exports = {
  supabase,
  supabaseAdmin,
  checkConnection
};
