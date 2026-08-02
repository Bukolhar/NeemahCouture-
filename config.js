// ============================================
// NEEMAHCOUTURE — Supabase Configuration
// ============================================

const SUPABASE_URL = 'https://bganzhvikvmjxgjevoz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9kLKqZ5-sb5X20g_i5yAgQ_buu5MeJI';

// Initialize Supabase client
let supabaseClient;
try {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('Supabase connected successfully');
} catch (err) {
  console.error('Failed to initialize Supabase:', err);
}
