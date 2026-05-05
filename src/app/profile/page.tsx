'use client';

import { User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui';

export default function ProfilePage() {
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
            <User size={32} className="text-white/40" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-1">User</h2>
          <p className="text-sm text-white/30">Local device sync</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button className="w-full glass-panel p-4 flex items-center gap-3 hover:bg-white/10 transition-all">
            <Settings size={20} className="text-white/40" />
            <span className="text-sm font-medium text-white">Settings</span>
          </button>
          <button className="w-full glass-panel p-4 flex items-center gap-3 hover:bg-white/10 transition-all">
            <LogOut size={20} className="text-white/40" />
            <span className="text-sm font-medium text-white">Sign Out</span>
          </button>
        </div>

        {/* Info */}
        <div className="mt-10 text-center">
          <p className="text-xs text-white/20 mb-4">Version 1.0.0</p>
          <p className="text-xs text-white/30">All data stored locally</p>
        </div>
      </div>
    </div>
  );
}
