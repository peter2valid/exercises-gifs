'use client';

import { useParams, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { useGym } from '@/context/GymContext';
import { useGymParam } from '@/hooks/useGymParam';
import { LucideArrowLeft, LucideDumbbell, LucideArrowRightLeft } from 'lucide-react';
import Link from 'next/link';
import { getExerciseBodyPart } from '@/lib/exercise-data';

const PROGRAMS = {
  'starter-strength': { 
    name: 'Starter Strength', 
    description: 'Master fundamental movements with this introductory program.', 
    exerciseIds: ['0001', '0002', '0003'] 
  },
  'core-blast': { 
    name: 'Core Blast', 
    description: 'Build a strong and stable midsection with these movements.', 
    exerciseIds: ['0001', '0006', '0007'] 
  },
};

export default function ProgramViewer() {
  const { id } = useParams();
  const router = useRouter();
  const { gymId, gymName } = useGym();
  const { buildGymUrl } = useGymParam();
  const program = PROGRAMS[id as keyof typeof PROGRAMS];
  const workoutTabs = Object.entries(PROGRAMS).map(([key, value]) => ({ id: key, ...value }));

  const exercises = useLiveQuery(
    async () => {
      if (!program) return [];
      return Promise.all(program.exerciseIds.map(exId => db.exercises.get(exId)));
    },
    [id]
  );

  if (!program) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-black text-gray-900 mb-4">Program not found</h2>
        <Link href="/scan" className="text-blue-600 font-bold hover:underline">
          Return to Scan
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7fb] pb-28">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f7f7fb]/90 px-6 pt-6 pb-5 backdrop-blur-xl">
        <button 
          onClick={() => router.push(buildGymUrl('/scan'))}
          className="p-3 bg-white rounded-full shadow-[0_8px_30px_rgba(15,23,42,0.08)] hover:bg-white active:scale-95 transition-all"
        >
          <LucideArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        {gymId && (
          <div className="mt-3 inline-block bg-gradient-to-r from-orange-400 to-orange-500 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            🏋️ {gymName}
          </div>
        )}
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-400">Workout</p>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">{program.name}</h1>
            <p className="max-w-xl text-gray-500 font-medium text-base leading-relaxed">{program.description}</p>
          </div>
          <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
            <LucideDumbbell className="h-7 w-7 text-blue-600" />
          </div>
        </div>
      </header>

      {/* Movement List */}
      <main className="px-6 pt-6 space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.24em]">Workout moves</h2>
          <span className="text-xs font-bold uppercase tracking-[0.24em] text-gray-400">select any move</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {exercises === undefined ? (
             Array(program.exerciseIds.length).fill(0).map((_, i) => (
                <div key={i} className="h-[28rem] bg-white rounded-[2rem] animate-pulse shadow-sm" />
             ))
          ) : exercises.map((ex, i) => {
            if (!ex) return null;
            return (
              <Link 
                key={ex.id} 
                href={buildGymUrl(`/scan/exercise/${ex.id}`)}
                className="block rounded-[2rem] bg-white shadow-[0_16px_50px_rgba(15,23,42,0.08)] border border-black/5 overflow-hidden hover:-translate-y-1 transition-all group active:scale-[0.98]"
              >
                <div className="p-4 pb-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 font-black text-gray-900">
                      <span className="text-sm">{i + 1}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">Tap to open</span>
                  </div>
                  <div className="relative overflow-hidden rounded-[1.75rem] bg-[#f5f5f7] aspect-[4/5] flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/60" />
                    <div className="relative z-10 flex h-full w-full items-center justify-center px-4 text-center">
                      <div className="space-y-4">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                          <LucideDumbbell className="h-7 w-7 text-blue-600" />
                        </div>
                        <div className="text-3xl font-black text-gray-900 uppercase tracking-tight leading-none capitalize">
                          {getExerciseBodyPart(ex) || 'Workout'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <h3 className="text-2xl font-black text-gray-900 capitalize leading-tight group-hover:text-blue-600 transition-colors">
                    {ex.name}
                  </h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.24em]">
                    {getExerciseBodyPart(ex) || 'Unknown'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/95 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {workoutTabs.map((tab) => {
            const active = tab.id === id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => router.push(buildGymUrl(`/scan/program/${tab.id}`))}
                className={`shrink-0 rounded-full px-4 py-3 text-left transition-all active:scale-95 ${
                  active
                    ? 'bg-gray-900 text-white shadow-[0_12px_30px_rgba(15,23,42,0.22)]'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span className="block text-[10px] font-black uppercase tracking-[0.24em] opacity-60">Workout</span>
                <span className="block text-sm font-black leading-none mt-1">{tab.name}</span>
              </button>
            );
          })}
          <button className="shrink-0 rounded-full bg-blue-600 px-4 py-3 text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)]">
            <span className="flex items-center gap-2 text-sm font-black">
              <LucideArrowRightLeft className="h-4 w-4" />
              Change workout
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
