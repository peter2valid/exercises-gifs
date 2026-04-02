import { createClient } from '@supabase/supabase-js';

let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials in environment variables');
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

// For backward compatibility, export a lazy getter
export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    try {
      return getSupabaseClient()[prop as keyof typeof supabaseClient];
    } catch (e) {
      console.error('Supabase client not available during build:', e);
      return undefined;
    }
  },
});