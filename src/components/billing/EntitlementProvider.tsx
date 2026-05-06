'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useEntitlementStore } from '@/store/entitlementStore';
import { UpgradeBottomSheet } from './UpgradeBottomSheet';

/**
 * Mounts at the root of the app (inside layout.tsx).
 *
 * Responsibilities:
 * 1. Bootstrap entitlements from Dexie cache on mount (instant, offline-safe)
 * 2. Refresh from Supabase in background
 * 3. Subscribe to Supabase Realtime for gym/user subscription changes
 * 4. Re-initialise on auth state changes
 * 5. Render UpgradeBottomSheet (global singleton)
 */
export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const initEntitlements = useEntitlementStore(s => s.initEntitlements);
  const refreshEntitlements = useEntitlementStore(s => s.refreshEntitlements);
  const clearEntitlements = useEntitlementStore(s => s.clearEntitlements);

  // Zustand actions are referentially stable — safe to include in deps
  useEffect(() => {
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupForUser = async (userId: string) => {
      await initEntitlements(userId);

      // Listen for subscription changes and refresh entitlements in realtime
      realtimeChannel = supabase
        .channel(`entitlements-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_subscriptions',
            filter: `user_id=eq.${userId}`,
          },
          () => refreshEntitlements(),
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'gym_subscriptions',
          },
          () => refreshEntitlements(),
        )
        .subscribe();
    };

    // Initialise for current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setupForUser(session.user.id);
    });

    // Re-init or clear on auth state change
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setupForUser(session.user.id);
      }

      if (event === 'SIGNED_OUT') {
        clearEntitlements();
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
          realtimeChannel = null;
        }
      }
    });

    return () => {
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
      authListener.subscription.unsubscribe();
    };
  }, [initEntitlements, refreshEntitlements, clearEntitlements]);

  return (
    <>
      {children}
      <UpgradeBottomSheet />
    </>
  );
}
