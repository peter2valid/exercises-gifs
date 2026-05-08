'use client';

import { useEffect, useState } from 'react';
import { User as UserIcon, LogOut, Settings, Loader2, X, Scale, Bell } from 'lucide-react';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type WeightUnit = 'kg' | 'lbs';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const savedUnit = localStorage.getItem('weightUnit') as WeightUnit | null;
    if (savedUnit === 'kg' || savedUnit === 'lbs') setWeightUnit(savedUnit);
    setSoundEnabled(localStorage.getItem('restTimerSound') !== 'off');
  }, []);

  useEffect(() => {
    async function getProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      setUser(session.user);
      setLoading(false);
    }
    getProfile();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  };

  const handleWeightUnit = (unit: WeightUnit) => {
    setWeightUnit(unit);
    localStorage.setItem('weightUnit', unit);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('restTimerSound', next ? 'on' : 'off');
  };

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
        <div className="mb-8 animate-fade-in">
          <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium mb-2">Profile</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">You</h1>
        </div>

        <div className="text-center mb-10 animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4">
            <UserIcon size={32} className="text-white/40" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-1">{user?.email?.split('@')[0]}</h2>
          <p className="text-sm text-white/30">{user?.email}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full glass-panel p-4 flex items-center gap-3 hover:bg-white/10 transition-all active:scale-[0.98]"
          >
            <Settings size={20} className="text-white/40" />
            <span className="text-sm font-medium text-white">Settings</span>
          </button>
          <button
            onClick={handleSignOut}
            className="w-full glass-panel p-4 flex items-center gap-3 hover:bg-rose-500/10 transition-all group active:scale-[0.98]"
          >
            <LogOut size={20} className="text-white/40 group-hover:text-rose-400 transition-colors" />
            <span className="text-sm font-medium text-white group-hover:text-rose-400 transition-colors">Sign Out</span>
          </button>
        </div>

        <div className="mt-10 text-center">
          <p className="text-xs text-white/20 mb-4">Version 1.0.0</p>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="relative bg-[#111] rounded-t-3xl px-6 pt-6 pb-10 space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-colors"
                aria-label="Close settings"
              >
                <X size={18} />
              </button>
            </div>

            <div className="glass-panel p-5 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Scale size={16} className="text-white/40" />
                <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] font-bold">Weight Unit</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['kg', 'lbs'] as WeightUnit[]).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => handleWeightUnit(unit)}
                    className={`py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.97] ${
                      weightUnit === unit
                        ? 'bg-white text-black shadow-lg'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {unit.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={toggleSound}
              className="w-full glass-panel p-5 flex items-center gap-3 text-left transition-colors hover:bg-white/5 active:scale-[0.98]"
            >
              <Bell size={16} className={soundEnabled ? 'text-emerald-400' : 'text-white/25'} />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Rest Timer Sound</p>
                <p className="text-xs text-white/30 mt-0.5">
                  {soundEnabled ? 'Beep plays when rest ends' : 'Sound is off'}
                </p>
              </div>
              <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${soundEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${soundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
