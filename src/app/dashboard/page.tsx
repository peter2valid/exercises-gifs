'use client';

import { BottomNav } from '@/components/ui/BottomNav';
import { useGym } from '@/context/GymContext';
import { MetricCard } from './components/MetricCard';
import { ActiveUsersBar } from './components/ActiveUsersBar';
import { LatestSalesCard } from './components/LatestSalesCard';
import { TopVideos } from './components/TopVideos';
import { AddLinkInput } from './components/AddLinkInput';
import { ChartPlaceholder } from './components/ChartPlaceholder';
import { LikedSection } from './components/LikedSection';
import { LucideBell, LucideMenu } from 'lucide-react';

export default function DashboardPage() {
  const { gymId, gymName } = useGym();

  return (
   <div className="min-h-screen dashboard-bg text-[var(--text-primary)] pb-12">
      {/* Header */}
    <header className="pl-28 pr-8 pt-10 pb-6 flex justify-between items-center">
        <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">Channel Analytics</h1>
          {gymId && (
            <div className="inline-block bg-gradient-to-r from-orange-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              🏋️ {gymName}
            </div>
          )}
        </div>
        <p className="text-[var(--text-secondary)] text-sm font-semibold uppercase tracking-[0.22em] mt-1">Optimize Your Metrics</p>
        </div>
        <div className="flex gap-4">
        <button className="glass-panel p-3 rounded-2xl hover:bg-white/20 transition-all active:scale-95">
          <LucideBell className="w-5 h-5 text-[var(--text-secondary)]" />
           </button>
        <button className="glass-panel p-3 rounded-2xl hover:bg-white/20 transition-all active:scale-95">
          <LucideMenu className="w-5 h-5 text-[var(--text-secondary)]" />
           </button>
        </div>
      </header>

      {/* Main Content */}
    <main className="pl-28 pr-8 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard 
            label="Spam Issue" 
            value="76k" 
            trend="+12%" 
            isPositive={true} 
          />
          <MetricCard 
            label="Impressions" 
            value="1.5m" 
            trend="+8%" 
            isPositive={true} 
          />
          <MetricCard 
            label="Revenue" 
            value="$3.6k" 
            trend="+5%" 
            isPositive={true} 
          />
          <MetricCard 
            label="Engagement" 
            value="47" 
            trend="-2%" 
            isPositive={false} 
          />
        </div>

        {/* Dynamic Row */}
        <div className="grid md:grid-cols-2 gap-6">
           <ActiveUsersBar />
           <LatestSalesCard />
        </div>

        {/* Top Videos Showcase */}
        <TopVideos />

        {/* Utility Grid */}
        <div className="grid md:grid-cols-2 gap-6">
           <div className="space-y-6">
              <AddLinkInput />
              <LikedSection />
           </div>
           <ChartPlaceholder />
        </div>
      </main>

      {/* Navigation */}
      <BottomNav />
    </div>
  );
}
