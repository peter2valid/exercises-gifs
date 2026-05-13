import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const admin = getAdminSupabase();
  const { data: gym, error } = await admin
    .from('gyms')
    .select('id, name, type, location')
    .eq('id', id)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !gym) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ gym });
}
