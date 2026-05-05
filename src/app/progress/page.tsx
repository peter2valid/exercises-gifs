'use client';

import { BarChart3, TrendingUp, Calendar } from 'lucide-react';

export default function ProgressPage() {
  return (
    <div className="dashboard-bg min-h-screen pb-24 pt-8">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium mb-2">Progress</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Your Stats</h1>
        </div>

        {/* Main Metric */}
        <div className="glass-panel p-6 mb-6 animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-white/40 tracking-[0.1em] uppercase mb-1">Total Volume</p>
              <p className="text-4xl font-bold text-white">0 kg</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
              <BarChart3 size={24} className="text-white/40" />
            </div>
          </div>
          <p className="text-xs text-white/30">Since you started</p>
        </div>

        {/* Stats Grid */}
        <div className="space-y-3 mb-8">
          <div className="glass-panel p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40 tracking-[0.1em] uppercase">Workouts</p>
              <p className="text-2xl font-semibold text-white mt-1">0</p>
            </div>
            <TrendingUp size={20} className="text-white/20" />
          </div>
          <div className="glass-panel p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40 tracking-[0.1em] uppercase">Last Session</p>
              <p className="text-lg font-semibold text-white/40 mt-1">—</p>
            </div>
            <Calendar size={20} className="text-white/20" />
          </div>
          <div className="glass-panel p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40 tracking-[0.1em] uppercase">Avg Sets</p>
              <p className="text-2xl font-semibold text-white mt-1">0</p>
            </div>
            <BarChart3 size={20} className="text-white/20" />
          </div>
        </div>

        {/* Coming Soon */}
        <div className="text-center py-8">
          <p className="text-white/30 text-sm">More detailed analytics coming soon</p>
        </div>
      </div>
    </div>
  );
}
