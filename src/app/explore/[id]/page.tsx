'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { getExerciseById } from '@/lib/db/exerciseQueries';
import { seedExercises } from '@/lib/db/seed';
import { LoadingPage } from '@/components/ui';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { type Exercise } from '@/lib/db/schema';
import { bodyGroups } from '@/lib/explore/constants';

import { ExerciseThumbnail } from '@/components/ExerciseCard';

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
    // If we have history, use back() to preserve exact scroll/filter state
    if (window.history.length > 1) {
      router.back();
      return;
    }

    // Fallback: Smart redirect based on exercise category
    if (exercise) {
      const muscleKey = exercise.body_part || exercise.target;
      // Map body part to muscle group keys used in constants
      const validGroups = bodyGroups.map(g => g.key);
      const targetKey = validGroups.find(k => k === muscleKey) || 'all';
      router.push(`/explore/browse?muscle=${targetKey}`);
    } else {
      router.push('/explore');
    }
  };

  return (
    <div className="dashboard-bg min-h-screen pb-24 pt-8">
      <div className="max-w-md mx-auto px-4">
        <div className="mb-6">
          <button 
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-white/60 mb-4 hover:text-white transition-colors"
          >
            <ChevronLeft size={18} /> Back
          </button>
          
          {/* Hero Media Section */}
          <div className="relative aspect-square glass-panel overflow-hidden mb-6 bg-white/5 border border-white/10 rounded-2xl">
            <ExerciseThumbnail 
              alt={exercise.name} 
              exerciseId={String(exercise.id)} 
              priority={true} 
            />
          </div>

          <h1 className="text-3xl font-bold text-white tracking-tight">{exercise.name}</h1>
          <p className="text-sm text-white/30 mt-1 uppercase tracking-wider">{exercise.body_part} • {exercise.target}</p>
        </div>

        <div className="glass-panel p-5 mb-4 border border-white/10 rounded-2xl">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3">Instructions</p>
          {exercise.instructions && exercise.instructions.length > 0 ? (
            <ol className="space-y-4">
              {exercise.instructions.map((ins: string, i: number) => (
                <li key={i} className="flex gap-4 text-white/80 text-sm leading-relaxed">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/40 border border-white/5">
                    {i + 1}
                  </span>
                  <span>{ins}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-white/40 italic">No instructions available.</p>
          )}
        </div>

        <div className="glass-panel p-5 mb-8 border border-white/10 rounded-2xl">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3">Secondary muscles</p>
          <div className="flex flex-wrap gap-2">
            {(exercise.secondaryMuscles || []).length === 0 && (
              <span className="text-white/40 text-sm italic">None listed</span>
            )}
            {(exercise.secondaryMuscles || []).map((m: string, i: number) => (
              <span key={i} className="px-3 py-1.5 rounded-lg bg-white/5 text-xs font-medium text-white/70 border border-white/5">{m}</span>
            ))}
          </div>
        </div>

        <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-50">
          <Link
            href={`/workout?exerciseId=${encodeURIComponent(String(exercise.id))}`}
            className="flex items-center justify-center w-full rounded-2xl font-bold transition-all active:scale-[0.98] bg-white text-black py-4 shadow-2xl shadow-black/50 hover:bg-white/90"
          >
            Start Workout
          </Link>
        </div>
      </div>
    </div>
  );
}
