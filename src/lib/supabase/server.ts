import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export function getServerSupabase() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `remove` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

/**
 * Resolve a user session from a request — tries cookie auth first,
 * then falls back to an Authorization: Bearer <token> header.
 * Returns the user object or null.
 */
export async function getUserFromRequest(req: Request) {
  // 1. Cookie-based auth (standard browser requests)
  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user;

  // 2. Bearer token auth (SyncWorker and non-cookie clients)
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (token) {
    const admin = getAdminSupabase();
    // Use getUser(token) to safely verify the JWT with the server
    const { data: { user: bearerUser } } = await admin.auth.getUser(token);
    if (bearerUser) return bearerUser;
  }

  return null;
}
