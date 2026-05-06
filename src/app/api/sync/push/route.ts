import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    const supabase = getServerSupabase();
    
    // 1. Authenticate the user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { events } = await req.json();
    
    if (!Array.isArray(events)) {
      return NextResponse.json({ error: 'Events must be an array' }, { status: 400 });
    }

    // 2. High-privilege client for batch upsert
    // We still use service role for batching, but we enforce the user_id from the session
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const eventsToInsert = events.map(e => ({
      id: e.id,
      type: e.type,
      payload: e.payload,
      session_id: e.session_id,
      tenant_id: e.tenant_id || 'default',
      device_id: e.device_id,
      user_id: userId, // FORCE session user_id
      idempotency_key: e.idempotency_key,
      created_at: e.created_at,
      version: e.version || 1
    }));

    const { error } = await adminClient
      .from('events')
      .upsert(eventsToInsert, { 
        onConflict: 'idempotency_key',
        ignoreDuplicates: true 
      });

    if (error) {
      console.error('Supabase Sync Push Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      synced_ids: events.map(e => e.id),
      failed_ids: [] 
    });

  } catch (err) {
    console.error('API Push Fatal Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
