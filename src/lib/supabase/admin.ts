import { createClient } from '@supabase/supabase-js';

/**
 * Returns a Supabase client using the SERVICE ROLE KEY.
 * This client BYPASSES Row Level Security (RLS).
 * 
 * IMPORTANT: This should ONLY be used in Server Components, 
 * Route Handlers, or Server Actions.
 */
export function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
