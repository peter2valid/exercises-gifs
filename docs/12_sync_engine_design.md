# Distributed Sync Engine Architecture

This document defines **Phase 2: The Distributed System**. It leverages our existing local-first, event-driven foundation to safely synchronize data across devices (Local → Server → Other Devices) without compromising the offline experience or data integrity.

## 1. Core Principles
- **Local-First, Sync-Behind:** The UI only ever talks to IndexedDB (Dexie). The Sync Engine runs silently in the background.
- **Event Sourcing as CRDT:** We do not sync derived data (e.g., `WorkoutSession` or `SetLog`). We **only** sync `GymEvent` payloads. State is deterministically projected on every device.
- **Exactly-Once Delivery:** Network failures are inevitable. The engine relies on idempotency keys and exponential backoff to ensure safety.
- **No UI Blocking:** Sync failures never prevent a user from starting a workout or logging a set.

---

## 2. Sync Topology

### A. Upstream Sync (Local → Server)
*Responsible for pushing local actions to the cloud.*

1. **Trigger:** Network reconnect, periodic interval (e.g., 10s), or manual push.
2. **Batching:** The engine queries `sync_queue` for items with `status === 'pending'` and `next_retry_at <= now()`. It batches up to 50 events.
3. **Transport:** Sends a `POST /api/sync/push` containing an array of `GymEvent` objects.
4. **Idempotency:** The server checks the `idempotency_key` of each event. If it already exists, the server acknowledges it without duplicating work.
5. **Resolution:**
   - **Success:** Local `sync_queue` status marked `completed`. `events.sync_state` marked `synced`.
   - **Failure:** Local `sync_queue` increments `attempts`, updates `last_error`, and calculates `next_retry_at` using exponential backoff (e.g., `2^attempts * 1000ms`).

### B. Downstream Sync (Server → Local)
*Responsible for pulling external actions (other devices, coach updates) to this device.*

1. **Trigger:** App startup, push notification, or periodic polling.
2. **Cursor-based Fetch:** Sends a `GET /api/sync/pull?tenant_id={id}&since={last_synced_timestamp}`.
3. **Ingestion:** 
   - Server returns events not originating from the current `device_id`.
   - Local DB inserts new events into the `events` table (ignoring duplicates via primary key).
4. **Projection Regeneration:** For every distinct `session_id` affected by the incoming events, the engine calls `projectFromEvents(session_id)` to transparently rebuild the local Dexie projections (`workout_sessions`, `set_logs`).
5. **UI Reactivity:** Because the UI hooks (like `useWorkoutStore`) listen to the projection state, they will automatically update.

---

## 3. Handling Edge Cases

### Offline Mode
- Events are appended to `events` and `sync_queue` locally.
- The UI continues to function perfectly.
- When `navigator.onLine` becomes true, the upstream trigger fires automatically to drain the queue.

### Conflict Resolution (The Magic of Events)
- **Problem:** Device A logs a set. Device B edits the session before Device A syncs.
- **Solution:** We don't resolve row-level locks. Both events are synced. The projection engine (`projectFromEvents`) sorts them chronologically by `created_at` and applies them deterministically. The last chronological action naturally wins.

### Queue Poisoning (Bad Data)
- If an event is rejected by the server due to a permanent validation error (400 Bad Request), the queue item is marked `failed` rather than retried infinitely, preventing pipeline clogs.

---

## 4. Next Implementation Steps

1. **Build `SyncWorker`:** Create a background utility that manages the `sync_queue` lifecycle (poll, batch, backoff).
2. **Mock Backend Endpoints:** Create Next.js API routes (`/api/sync/push` and `/api/sync/pull`) using Supabase to store the centralized events.
3. **Wire Downstream Re-projection:** Ensure that when a pull finishes, `projectFromEvents` is called safely and the UI is notified.
