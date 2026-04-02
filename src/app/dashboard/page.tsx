'use client';

import { BottomNav } from '@/components/ui/BottomNav';
import { MetricCard } from './components/MetricCard';
import { ActiveUsersBar } from './components/ActiveUsersBar';
import { LatestSalesCard } from './components/LatestSalesCard';
import { TopVideos } from './components/TopVideos';
import { AddLinkInput } from './components/AddLinkInput';
import { ChartPlaceholder } from './components/ChartPlaceholder';
import { LikedSection } from './components/LikedSection';
import { LucideBell, LucideMenu } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pb-32">
      {/* Header */}
      <header className="px-6 pt-10 pb-6 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-black tracking-tighter uppercase italic">Channel Analytics</h1>
           <p className="text-white/40 text-sm font-bold uppercase tracking-widest mt-1">Optimize Your Metrics</p>
        </div>
        <div className="flex gap-4">
           <button className="p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95">
              <LucideBell className="w-6 h-6 text-white/60" />
           </button>
           <button className="p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95">
              <LucideMenu className="w-6 h-6 text-white/60" />
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 space-y-6">
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
