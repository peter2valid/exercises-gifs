import { db } from '@/lib/db/dexie';
import { type GymEvent, type SyncQueue } from '@/lib/db/schema';
import { projectFromEvents } from '@/lib/reducer/projectState';
import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

const BATCH_SIZE = 50;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 60000; // 1 minute
const MAX_ATTEMPTS = 10;      // permanently fail after 10 retries
const QUEUE_PRUNE_DELAY = 1000 * 60 * 60 * 24; // 24 hours

export interface SyncPushResponse {
  success: boolean;
  synced_ids: string[];
  failed_ids?: { id: string; error: string; retryable: boolean }[];
}

export class SyncWorker {
  private isProcessing = false;
  private timer: NodeJS.Timeout | null = null;
  private lastPullSequence = 0;
  private channel: RealtimeChannel | null = null;

  /**
   * Start the worker loop.
   */
  start(intervalMs = 15000) {
    if (this.timer) return;
    
    // 1. Regular Polling (Fallback/Safety)
    this.timer = setInterval(() => this.cycle(), intervalMs);
    this.cycle();
    
    // 2. Real-time Triggers
    this.setupRealtime();

    // 3. Environment Triggers
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.cycle());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') this.cycle();
      });
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  private async setupRealtime() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Listen for new events inserted by OTHER devices
    this.channel = supabase
      .channel('gym-events')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'events',
          filter: `user_id=eq.${session.user.id}` 
        },
        () => this.cycle()
      )
      .subscribe();
  }

  /**
   * One full sync cycle: Upstream then Downstream.
   */
  async cycle() {
    if (this.isProcessing) return;

    // Skip sync if not logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    this.isProcessing = true;

    try {
      await this.processUpstream(session.access_token);
      await this.processDownstream(session.access_token);
      await this.pruneQueue();
    } catch (err) {
      console.error('[SyncWorker] cycle error:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processUpstream(accessToken: string) {
    const now = new Date().toISOString();
    
    const readyToSync = await db.sync_queue
      .where('status')
      .equals('pending')
      .filter(item => !item.next_retry_at || item.next_retry_at <= now)
      .limit(BATCH_SIZE)
      .toArray();

    if (readyToSync.length === 0) return;

    const queueIds = readyToSync.map(i => i.id);
    const eventIds = readyToSync.map(i => i.event_id);

    // Mark as 'syncing'
    await db.transaction('rw', [db.sync_queue, db.events], async () => {
      await db.sync_queue.where('id').anyOf(queueIds).modify({ status: 'syncing', updated_at: now });
      await db.events.where('id').anyOf(eventIds).modify({ sync_state: 'syncing' });
    });

    const events = await db.events.where('id').anyOf(eventIds).toArray();
    const eventMap = new Map(events.map(e => [e.id, e]));
    const batch = readyToSync
      .map(item => eventMap.get(item.event_id))
      .filter((e): e is GymEvent => !!e);

    if (batch.length === 0) {
      await db.sync_queue.bulkDelete(queueIds);
      return;
    }

    try {
      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ events: batch }),
      });

      if (!res.ok) {
        // Auth and client errors are permanent — stop retrying immediately
        const permanent = res.status === 401 || res.status === 403 || res.status === 400;
        console.warn(`[SyncWorker] push HTTP ${res.status}${permanent ? ' (permanent)' : ''}`);
        await this.resolveBatch(readyToSync, {
          success: false,
          synced_ids: [],
          failed_ids: batch.map(e => ({ id: e.id, error: `HTTP ${res.status}`, retryable: !permanent })),
        });
        return;
      }

      const response: SyncPushResponse = await res.json();
      await this.resolveBatch(readyToSync, response);
    } catch (err) {
      console.warn('[SyncWorker] upstream push network error:', err);
      await this.resolveBatch(readyToSync, {
        success: false,
        synced_ids: [],
        failed_ids: batch.map(e => ({ id: e.id, error: String(err), retryable: true }))
      });
    }
  }

  private async processDownstream(accessToken: string) {
    try {
      const deviceId = 'local-browser';

      const res = await fetch(`/api/sync/pull?since=${this.lastPullSequence}&exclude_device_id=${deviceId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!res.ok) return;

      const { events }: { events: any[] } = await res.json();
      if (events.length === 0) return;

      const affectedSessions = new Set<string>();

      await db.transaction('rw', [db.events], async () => {
        for (const event of events) {
          // Primary key 'id' prevents duplicates
          await db.events.put({ ...event, sync_state: 'synced' });
          affectedSessions.add(event.session_id);
          this.lastPullSequence = Math.max(this.lastPullSequence, event.server_sequence || 0);
        }
      });

      // Re-project affected sessions
      for (const sessionId of affectedSessions) {
        await projectFromEvents(sessionId);
      }
    } catch (err) {
      console.error('[SyncWorker] downstream pull failed:', err);
    }
  }

  /**
   * Cleanup completed queue items older than 24h.
   */
  private async pruneQueue() {
    const cutoff = new Date(Date.now() - QUEUE_PRUNE_DELAY).toISOString();
    await db.sync_queue
      .where('status')
      .equals('completed')
      .filter(item => item.updated_at < cutoff)
      .delete();
  }

  private async resolveBatch(queueItems: SyncQueue[], response: SyncPushResponse) {
    const now = new Date().toISOString();
    const syncedIds = new Set(response.synced_ids);
    const failedMap = new Map((response.failed_ids || []).map(f => [f.id, f]));

    await db.transaction('rw', [db.sync_queue, db.events], async () => {
      for (const item of queueItems) {
        const eventId = item.event_id;

        if (syncedIds.has(eventId)) {
          await db.sync_queue.update(item.id, { status: 'completed', updated_at: now });
          await db.events.update(eventId, { sync_state: 'synced' });
        } else {
          const failure = failedMap.get(eventId);
          const isRetryable = failure ? failure.retryable : true;
          const error = failure ? failure.error : 'Batch push failed';

          const nextAttempts = item.attempts + 1;
          const exceeded = nextAttempts >= MAX_ATTEMPTS;

          if (!isRetryable || exceeded) {
            if (exceeded) console.warn(`[SyncWorker] Max attempts reached for event ${eventId}`);
            await db.sync_queue.update(item.id, { status: 'failed', attempts: nextAttempts, last_error: error, updated_at: now });
            await db.events.update(eventId, { sync_state: 'failed' });
          } else {
            const delay = Math.min(MAX_BACKOFF_MS, INITIAL_BACKOFF_MS * Math.pow(2, nextAttempts - 1));
            const nextRetry = new Date(Date.now() + delay).toISOString();

            await db.sync_queue.update(item.id, {
              status: 'pending',
              attempts: nextAttempts,
              last_error: error,
              next_retry_at: nextRetry,
              updated_at: now,
            });
            await db.events.update(eventId, { sync_state: 'pending' });
          }
        }
      }
    });
  }
}

export const syncWorker = new SyncWorker();
