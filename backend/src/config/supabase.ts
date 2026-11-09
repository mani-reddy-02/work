import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xwljwbkmxzcprgmvcsym.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabaseClient: SupabaseClient | null = null;

if (SUPABASE_KEY) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log('[Supabase Storage] Supabase client initialized successfully with project:', SUPABASE_URL);
  } catch (error) {
    console.error('[Supabase Storage] Failed to initialize Supabase client:', error);
    supabaseClient = null;
  }
} else {
  console.warn('[Supabase Storage] No SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY found in environment. Local resilient storage fallback enabled.');
}

export { supabaseClient, SUPABASE_URL };
