'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, LoadingPage } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      setUser(session.user);
      setLoading(false);
    }
    checkUser();
  }, [router]);

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="dashboard-bg min-h-screen pb-24 pt-8">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium mb-2">Supafast</p>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
            Hey, {user?.email?.split('@')[0]}
          </h1>
          <p className="text-sm text-white/40">Ready for today&apos;s session?</p>
        </div>

        {/* Quick Stats */}
        <div className="space-y-3 mb-12 animate-slide-up">
          <div className="glass-panel p-4">
            <p className="text-xs text-white/40 tracking-[0.1em] uppercase mb-1">This Week</p>
            <p className="text-2xl font-semibold text-white">0 Workouts</p>
          </div>
          <div className="glass-panel p-4">
            <p className="text-xs text-white/40 tracking-[0.1em] uppercase mb-1">Total Volume</p>
            <p className="text-2xl font-semibold text-white">0 kg</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push('/workout')}
            className="w-full h-12 text-base font-semibold"
            variant="primary"
          >
            Start Workout
          </Button>
          <Button
            onClick={() => router.push('/explore')}
            className="w-full h-12 text-base"
            variant="secondary"
          >
            Browse Exercises
          </Button>
        </div>

      </div>
    </div>
  );
}
