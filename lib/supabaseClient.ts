import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { storage } from './storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY, assertSupabaseEnv } from './env';

assertSupabaseEnv();

export const supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: {
      getItem: (key) => storage.getItem(key),
      setItem: (key, value) => storage.setItem(key, value),
      removeItem: (key) => storage.removeItem(key),
    },
  },
});

// Listen to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    // Store the session
    if (session && session.access_token && session.refresh_token) {
      storage.setItem('supabase.auth.token', session.access_token);
      storage.setItem('supabase.auth.refreshToken', session.refresh_token);
    }
  } else if (event === 'SIGNED_OUT') {
    // Clear the session
    storage.removeItem('supabase.auth.token');
    storage.removeItem('supabase.auth.refreshToken');
  }
}); 