import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export function getServerSupabase() {
  return createRouteHandlerClient({ cookies });
}

export function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session.user;

  // 2. Bearer token auth (SyncWorker and non-cookie clients)
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (token) {
    const admin = getAdminSupabase();
    const { data: { user } } = await admin.auth.getUser(token);
    if (user) return user;
  }

  return null;
}
