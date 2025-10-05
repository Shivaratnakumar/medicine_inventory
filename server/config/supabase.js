const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
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
const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

// Admin client for server-side operations with retry logic
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  ...supabaseOptions,
  auth: {
    ...supabaseOptions.auth,
    persistSession: false
  }
});

// Connection health check function
const checkConnection = async () => {
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
