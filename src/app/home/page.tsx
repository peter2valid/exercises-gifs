'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { runSyncSimulation } from '@/lib/simulation/syncSimulation';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

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
    return (
      <div className="dashboard-bg min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-white/20" size={32} />
      </div>
    );
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

        {/* Diagnostics (Debug only) */}
        <div className="mt-12 pt-8 border-t border-white/5">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-medium mb-4 text-center">Diagnostics</p>
          <Button
            onClick={async () => {
              const ok = await runSyncSimulation();
              alert(ok ? 'Sync Simulation Passed!' : 'Sync Simulation Failed! Check console.');
            }}
            className="w-full h-10 text-xs opacity-50 hover:opacity-100 transition-opacity"
            variant="ghost"
          >
            Run Sync Simulation
          </Button>
        </div>
      </div>
    </div>
  );
}
