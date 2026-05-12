// Global app-level constants.
// Single source of truth — import from here, never hardcode these strings.

// TENANT_ID is the fallback used only in tests and simulations.
// In production, tenant_id is always resolved dynamically:
//   - gym member  → gymId from entitlement store
//   - standalone  → userId
// Never pass this constant to createEvent() in real user flows.
export const TENANT_ID  = 'default';
export const DEVICE_ID  = 'local-browser';

/**
 * Resolve the correct tenant_id for a user at session creation time.
 * gymId is non-null when the user belongs to a gym (from entitlement store).
 */
export function resolveTenantId(userId: string, gymId: string | null): string {
  return gymId ?? userId;
}
