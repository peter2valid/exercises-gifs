'use client';

import { useEffect, useRef } from 'react';
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
  
  const currentUserIdRef = useRef<string | null>(null);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const setupForUser = async (userId: string) => {
      // Prevent duplicate setup if same user
      if (currentUserIdRef.current === userId) return;
      currentUserIdRef.current = userId;

      // Clean up previous channel if it exists
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }

      await initEntitlements(userId);

      // We need to know the gymId to filter gym_subscriptions and prevent fan-out storms.
      // fetchAndCacheEntitlements (called by initEntitlements) updates Dexie.
      const { data: membership } = await supabase
        .from('gym_memberships')
        .select('gym_id')
        .eq('user_id', userId)
        .maybeSingle();

      const channel = supabase.channel(`entitlements-${userId}`);
      
      // 1. Listen for personal subscription changes
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${userId}`,
        },
        () => refreshEntitlements(),
      );

      // 2. Listen for gym subscription changes (ONLY if member of a gym)
      if (membership?.gym_id) {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'gym_subscriptions',
            filter: `gym_id=eq.${membership.gym_id}`,
          },
          () => refreshEntitlements(),
        );
      }

      channel.subscribe();
      realtimeChannelRef.current = channel;
    };

    // Initialize for current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setupForUser(session.user.id);
    });

    // Re-init or clear on auth state change
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setupForUser(session.user.id);
      }

      if (event === 'SIGNED_OUT') {
        currentUserIdRef.current = null;
        clearEntitlements();
        if (realtimeChannelRef.current) {
          supabase.removeChannel(realtimeChannelRef.current);
          realtimeChannelRef.current = null;
        }
      }
    });

    return () => {
      if (realtimeChannelRef.current) supabase.removeChannel(realtimeChannelRef.current);
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
