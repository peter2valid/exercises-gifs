'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { getExerciseById } from '@/lib/db/exerciseQueries';
import { seedExercises } from '@/lib/db/seed';
import { LoadingPage } from '@/components/ui';
import { 
  ChevronLeft, 
  Dumbbell, 
  Activity, 
  Zap, 
  Info, 
  CircleDot,
  CheckCircle2,
  TrendingUp,
  BrainCircuit,
  Share2,
  Heart
} from 'lucide-react';
import Link from 'next/link';
import { type Exercise } from '@/lib/db/schema';
import { bodyGroups } from '@/lib/explore/constants';
import { ExerciseHero } from '@/components/ExerciseHero';
import { PremiumGate } from '@/components/billing/PremiumGate';

export default function ExerciseDetail({ params }: any) {
  const id = params?.id;
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      await seedExercises();
      const data = await getExerciseById(String(id));
      setExercise(data || null);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <LoadingPage />;
  if (!exercise) return notFound();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    const muscleKey = exercise.body_part || exercise.target;
    const validGroups = bodyGroups.map(g => g.key);
    const targetKey = validGroups.find(k => k === muscleKey) || 'all';
    router.push(`/explore/browse?muscle=${targetKey}`);
  };

  return (
    <div className="dashboard-bg min-h-screen pb-32">
      {/* 1. HERO MEDIA SECTION (~35vh) */}
      <div className="relative h-[38vh] w-full overflow-hidden">
        <ExerciseHero alt={exercise.name} exerciseId={String(exercise.id)} />
        
        {/* Top Navigation Overlay */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
          <button 
            onClick={handleBack}
            className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 active:scale-95 transition-all"
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 active:scale-95 transition-all">
              <Heart size={18} />
            </button>
            <button className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 active:scale-95 transition-all">
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 -mt-8 relative z-30">
        {/* 2. IDENTITY BLOCK */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.15em]">Live Demo</span>
          </div>
          
          <h1 className="text-4xl font-bold text-white tracking-tight leading-[1.1] mb-4">
            {exercise.name}
          </h1>

          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Activity size={14} className="text-emerald-500" />
              <span className="text-xs font-medium text-white/70">{exercise.target}</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Dumbbell size={14} className="text-white/40" />
              <span className="text-xs font-medium text-white/70">{exercise.equipment}</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Info size={14} className="text-white/40" />
              <span className="text-xs font-medium text-white/70">Intermediate</span>
            </div>
          </div>
        </div>

        {/* 3. EXECUTION PANEL (Instructions) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em] opacity-30">Execution Steps</h2>
            <div className="h-px flex-1 bg-white/10 ml-4" />
          </div>
          
          <div className="relative space-y-6">
            {/* Timeline Line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald-500/50 via-white/10 to-transparent" />
            
            {exercise.instructions?.map((ins: string, i: number) => (
              <div key={i} className="flex gap-5 group">
                <div className="relative z-10">
                  <div className="w-6 h-6 rounded-full bg-[#0a0a0b] border-2 border-white/10 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 group-hover:bg-emerald-500 transition-colors" />
                  </div>
                </div>
                <div className="flex-1 pb-1">
                  <p className="text-[15px] leading-relaxed text-white/70 group-hover:text-white transition-colors">
                    <span className="font-bold text-white/20 mr-2">{(i + 1).toString().padStart(2, '0')}</span>
                    {ins}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. PREMIUM TEASE SECTION */}
        <div className="space-y-4 mb-10">
          <PremiumGate 
            feature="ai_recommendations"
            title="AI Technique Analysis"
            description="Unlock real-time AI feedback and professional form insights for this exercise."
          >
            <div className="glass-panel p-5 border-emerald-500/20 bg-emerald-500/[0.02]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <BrainCircuit size={20} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Technique Tips</h3>
                  <p className="text-[11px] text-white/40">Personalised for your anatomy</p>
                </div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-xs text-white/70">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  Keep elbows tucked to maximize pectoral activation.
                </li>
                <li className="flex items-start gap-3 text-xs text-white/70">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  Maintain a slight arch in your lower back.
                </li>
              </ul>
            </div>
          </PremiumGate>

          <PremiumGate 
            feature="advanced_analytics"
            title="Advanced Analytics"
            description="Track your performance trends and strength projections for {exercise.name}."
          >
            <div className="glass-panel p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <TrendingUp size={20} className="text-white/60" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Strength Projection</h3>
                  <p className="text-[11px] text-white/40">Based on your recent 4 sessions</p>
                </div>
              </div>
              <div className="h-20 flex items-end gap-1 px-2">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} className="flex-1 bg-white/10 rounded-t-sm" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </PremiumGate>
        </div>

        {/* Secondary Info Section */}
        <div className="glass-panel p-5 mb-8">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Muscle Focus</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-[11px] font-bold border border-emerald-500/20">
              {exercise.target.toUpperCase()}
            </span>
            {(exercise.secondaryMuscles || []).map((m: string, i: number) => (
              <span key={i} className="px-3 py-1.5 rounded-xl bg-white/5 text-white/50 text-[11px] font-bold border border-white/5 uppercase">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 5. CTA ZONE - Floating Glass Button */}
      <div className="fixed bottom-8 left-0 right-0 z-50 px-6 flex justify-center pointer-events-none">
        <div className="w-full max-w-sm pointer-events-auto">
          <Link
            href={`/workout?exerciseId=${encodeURIComponent(String(exercise.id))}`}
            className="flex items-center justify-center w-full h-16 rounded-2xl font-black text-lg transition-all active:scale-[0.97] bg-white text-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:bg-white/90 relative overflow-hidden group glow-emerald"
          >
            {/* Subtle emerald highlight inside white button */}
            <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors" />
            
            <Zap size={20} className="mr-3 fill-emerald-500 text-emerald-500" />
            START SESSION
          </Link>
        </div>
      </div>
    </div>
  );
}
