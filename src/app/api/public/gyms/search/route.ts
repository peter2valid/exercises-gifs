import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json({ gyms: [] });
  }

  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from('gyms')
    .select('id, name, slug, type, location')
    .or(`name.ilike.%${q}%,slug.ilike.%${q}%,location.ilike.%${q}%`)
    .limit(10);

  if (error) {
    console.error('[gyms/search]', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }

  return NextResponse.json({ gyms: data ?? [] });
}
