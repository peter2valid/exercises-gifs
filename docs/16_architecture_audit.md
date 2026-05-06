# Architecture Audit & Stabilization Pass

## Overview
This document outlines the findings of the Phase 1 Architecture Audit, focusing on stability, predictability, and technical debt elimination.

## 1. Giant Files & Mixed Concerns
**Issues Found:**
- `src/app/workout/WorkoutPageClient.tsx` (400+ lines): Mixed store subscription, business logic orchestration, and heavy UI components (Restoring, Idle, Active, Resting, Finished views).
- `src/app/explore/browse/page.tsx` & `src/app/explore/page.tsx` (600+ and 400+ lines): Both contained duplicated arrays of `bodyGroups`, shared format utilities, and shared tile components.
**Severity:** HIGH. Increases risk of regression when modifying UI and causes unnecessary re-renders.
**Fixes Applied:**
- Extracted UI presentation layers from `WorkoutPageClient.tsx` into a dedicated `views.tsx` module.
- Extracted constants and types into `src/lib/explore/constants.ts`.
- Extracted generic React UI tiles into `src/components/ExploreTiles.tsx`.

## 2. Duplicated Logic & Dead Code
**Issues Found:**
- The in-memory search function (`searchExercises`) was defined in `src/lib/search.ts` and successfully utilized in the UI, but an overlapping, unused Dexie-based implementation existed in `src/lib/db/exerciseQueries.ts`.
- Duplicate UI definitions for explore grids.
**Severity:** MEDIUM. Causes confusion regarding the canonical source of truth for searching.
**Fixes Applied:**
- Deleted unused DB queries `searchExercises` and `getExercisesByBodyPart`.
- Centralized all explore-related data models.

## 3. Sync & Dexie Risks
**Issues Found:**
- Sync queue processing could potentially encounter double-execution without strict atomic state locks.
**Severity:** HIGH.
**Fixes Applied:**
- Validated `SyncWorker` implementation. The recent addition of the `syncing` state and `db.transaction('rw')` effectively mitigates race conditions. The idempotency keys ensure Postgres ignores duplicate pushes.

## 4. React Risks
**Issues Found:**
- Large objects defined inline inside render functions.
- Missing dependencies in `useEffect` and `useMemo` hooks.
**Severity:** MEDIUM.
**Fixes Applied:**
- All heavy React logic (especially the `FixedSizeList` data) is now properly memoized.
- Enforced strict ESLint adherence across the project.

## 5. Event System & Projection Risks
**Issues Found:**
- Direct dependency on local simulation parameters.
**Severity:** LOW.
**Fixes Applied:**
- Validated `projectFromEvents` and the SQL equivalent (`trg_project_event`). They are deterministic and handle edited/deleted sets identically.

## Remaining Risks & Future Recommendations
1. **Queue Pruning:** The current pruning strategy in `SyncWorker` deletes `completed` items after 24h. We should also implement a purge strategy for permanent `failed` items after a certain threshold (e.g., 7 days) to prevent local IndexedDB bloat.
2. **Offline Auth Staleness:** If a user's Supabase session expires while offline, the app currently redirects to `/auth`. We need a strategy to allow continued offline use even if the JWT expires, deferring re-authentication until the network returns.
3. **Optimistic UI Updates:** While the local Dexie DB is incredibly fast, very large workouts might cause a slight frame-drop during `projectFromEvents` execution. In the future, Web Workers could offload this.
