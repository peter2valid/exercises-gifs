import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Returns a Supabase client for use in Server Components,
 * Route Handlers, or Server Actions. Handles cookies automatically.
 */
export async function getServerSupabase() {
  const cookieStore = await cookies();

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
            // Can be ignored if handled by middleware
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Can be ignored if handled by middleware
          }
        },
      },
    }
  );
}

/**
 * Resolve a user session from a request — tries cookie auth first,
 * then falls back to an Authorization: Bearer <token> header.
 */
export async function getUserFromRequest(req: Request) {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user;

  // Header fallback (SyncWorker)
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (token) {
    // Note: We'd need an admin client to verify the token without cookies
    // This is handled in individual routes as needed.
  }

  return null;
}
