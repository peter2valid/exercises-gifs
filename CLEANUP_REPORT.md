# Cleanup Report

Date: 2026-04-23
Scope: Controlled repository cleanup and stabilization for offline-first, event-driven transition readiness.

## What Was Removed

### 1) Broken or conflicting routes
- Removed program route surface from scan UI and deleted program route folder:
  - Removed Program section and links in src/app/scan/page.tsx
  - Removed folder: src/app/scan/program
- Removed outdated dashboard route and all dashboard-specific components:
  - Removed folder: src/app/dashboard

Result:
- No in-app path now points to missing pages.
- Current app routes are now:
  - / (redirects to /workout)
  - /workout (canonical entry point)
  - /scan (legacy temporary browsing surface)
  - /scan/exercise/[id] (kept temporarily as legacy viewer route)

### 2) Legacy or duplicate scripts
Deleted conflicting and duplicate setup/import/media scripts:
- scripts/import-exercises.ts
- scripts/setup.js
- scripts/setup-simple.ts
- scripts/setup-database.ts
- scripts/setup-schema.js
- scripts/setup-schema.py
- scripts/repair-urls.ts
- scripts/convert-gifs.sh
- scripts/upload-gifs.sh
- scripts/upload-gifs-to-r2.sh

Kept scripts:
- scripts/supabase-schema.sql
- scripts/import-exercises-normalized.ts
- scripts/upload-r2-media.mjs

Updated package scripts to remove deleted script references and keep one import strategy.

### 3) Unused components
Removed dead UI/component surfaces that were not part of the stabilized product path:
- src/components/exercises (removed)
- src/components/ui/BottomNav.tsx
- src/components/ui/badge.tsx
- src/components/ui/card.tsx
- Removed stale exports from src/components/ui/index.tsx

## What Was Kept

### Core runtime
- src/app/page.tsx
- src/app/workout/page.tsx
- src/app/scan/page.tsx
- src/app/scan/exercise/[id]/page.tsx

### Core local-first data flow
- src/hooks/useExercises.ts
- src/lib/db/dexie.ts
- src/lib/exercise-data.ts
- src/lib/supabase/client.ts

### Canonical docs direction
- docs/01_product.md to docs/09_tasks.md

## Consistency Fixes Applied

### 1) Data model naming normalization
- Standardized on video_url.
- Removed gif_url from shared TypeScript exercise model.
- Removed gif_url fallback usage from exercise data helper.

### 2) Supabase client usage hardening
- Removed Proxy-based supabase export.
- Kept explicit getSupabaseClient() initialization path only.

### 3) Sync behavior stabilization
In useExercises:
- Enforced active record filtering at query level (.eq("is_active", true)).
- Preserved is_active in Dexie cache model.
- Added stale local record reconciliation (bulk delete for IDs missing from remote snapshot).
- Added clear behavior when remote returns zero active rows.

### 4) Dexie schema alignment
- Added is_active to local Exercise model.
- Bumped Dexie version to 9 with updated index definition.

## Canonical Structure After Cleanup

### Routes
- src/app/page.tsx
- src/app/scan/page.tsx
- src/app/scan/exercise/[id]/page.tsx

### Scripts
- scripts/supabase-schema.sql
- scripts/import-exercises-normalized.ts
- scripts/upload-r2-media.mjs

### Data contracts
- Canonical media field: video_url
- Local cache includes is_active

### Supabase access
- Explicit client access via getSupabaseClient()

## Final Post-Cleanup Checks

### Route reality check
- Root entry is now unambiguous: `/` -> `/workout`.
- `src/app/scan/page.tsx` is explicitly marked as legacy and temporary.
- `src/app/scan/exercise/[id]/page.tsx` is retained for short-term legacy viewer continuity and should be removed when the workout flow no longer depends on it.

### Data-layer neutrality check
- No UI component/page directly calls Supabase.
- Supabase usage is confined to data hook/repository layer (`src/hooks/useExercises.ts`).
- Exercise viewer page now consumes a hook (`src/hooks/useExerciseById.ts`) instead of querying Dexie directly in the page.

## Validation Results

- Lint: PASS
- Build: PASS
- Next.js routes generated:
  - /
  - /scan
  - /scan/exercise/[id]

## Remaining Risks / Notes

1. This phase intentionally did not introduce new architecture or features.
2. scan page remains large; it was simplified by removing unimplemented Program surface, but no redesign was performed.
3. Some dependencies may now be candidates for future pruning (for example virtualization-related packages), but dependency cleanup was intentionally deferred to avoid unnecessary lockfile churn during stabilization.
4. A non-markdown asset appeared in public/ and was not modified as part of this controlled cleanup scope.

## Post-Cleanup Outcome

The repository is now stabilized for pre-foundation work:
- No broken navigation to missing routes.
- No duplicate setup/import script pathways.
- One consistent media naming convention.
- Clearer script and route surface area.
- Clean lint/build baseline for next implementation phase.
