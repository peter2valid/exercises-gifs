import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const supabase = getAdminSupabase();
    const { searchParams } = new URL(req.url);
    // since_date: ISO timestamp cursor — pull events created after this point.
    // Default to epoch so the first pull on a fresh device gets everything.
    const sinceDate = searchParams.get('since_date') || '1970-01-01T00:00:00.000Z';
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .gt('created_at', sinceDate)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Supabase Sync Pull Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: events || [] });
  } catch (err) {
    console.error('API Pull Fatal Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
