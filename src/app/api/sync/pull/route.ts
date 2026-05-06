import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = getServerSupabase();
    
    // 1. Authenticate the user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const since = parseInt(searchParams.get('since') || '0', 10);
    const excludeDeviceId = searchParams.get('exclude_device_id') || '';

    // 2. Pull events from the global log
    // We enforce user_id = userId to ensure strict isolation
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .gt('server_sequence', since)
      .neq('device_id', excludeDeviceId)
      .order('server_sequence', { ascending: true })
      .limit(100);

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
