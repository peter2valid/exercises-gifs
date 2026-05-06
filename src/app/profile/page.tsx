'use client';

import { useEffect, useState } from 'react';
import { User as UserIcon, LogOut, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        <div className="mb-8 animate-fade-in">
          <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium mb-2">Profile</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">You</h1>
        </div>

        {/* Avatar & Name */}
        <div className="text-center mb-10 animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4">
            <UserIcon size={32} className="text-white/40" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-1">{user?.email?.split('@')[0]}</h2>
          <p className="text-sm text-white/30">{user?.email}</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button className="w-full glass-panel p-4 flex items-center gap-3 hover:bg-white/10 transition-all">
            <Settings size={20} className="text-white/40" />
            <span className="text-sm font-medium text-white">Settings</span>
          </button>
          <button 
            onClick={handleSignOut}
            className="w-full glass-panel p-4 flex items-center gap-3 hover:bg-rose-500/10 transition-all group"
          >
            <LogOut size={20} className="text-white/40 group-hover:text-rose-400 transition-colors" />
            <span className="text-sm font-medium text-white group-hover:text-rose-400 transition-colors">Sign Out</span>
          </button>
        </div>

        {/* Info */}
        <div className="mt-10 text-center">
          <p className="text-xs text-white/20 mb-4">Version 1.0.0</p>
          <p className="text-xs text-white/30">Secure Cloud Sync Active</p>
        </div>
      </div>
    </div>
  );
}
