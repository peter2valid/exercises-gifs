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
  
  // If it looks like a UUID, attempt an exact ID match first
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
  
  let queryBuilder = admin
    .from('gyms')
    .select('id, name, slug, type, location');

  if (isUuid) {
    queryBuilder = queryBuilder.or(`id.eq.${q},name.ilike.%${q}%,slug.ilike.%${q}%,location.ilike.%${q}%`);
  } else {
    queryBuilder = queryBuilder.or(`name.ilike.%${q}%,slug.ilike.%${q}%,location.ilike.%${q}%`);
  }

  const { data, error } = await queryBuilder.limit(10);

  if (error) {
    console.error('[gyms/search]', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }

  return NextResponse.json({ gyms: data ?? [] });
}
