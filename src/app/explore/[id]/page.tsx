import { useMemo } from 'react';
import { notFound } from 'next/navigation';
import exercisesData from '../../../../data/exercises.json';
import { Button } from '@/components/ui';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function ExerciseDetail({ params }: any) {
  const id = params?.id;

  const exercise = useMemo(() => {
    return (exercisesData as any[]).find((e) => String(e.id) === String(id));
  }, [id]);

  if (!exercise) return notFound();

  return (
    <div className="dashboard-bg min-h-screen pb-24 pt-8">
      <div className="max-w-md mx-auto px-4">
        <div className="mb-4">
          <Link href="/explore" className="inline-flex items-center gap-2 text-white/60 mb-4">
            <ChevronLeft size={18} /> Back
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight">{exercise.name}</h1>
          <p className="text-sm text-white/30 mt-1">{exercise.bodyPart} • {exercise.target}</p>
        </div>

        <div className="glass-panel p-4 mb-4">
          <p className="text-xs text-white/40 uppercase tracking-[0.08em] mb-2">Instructions</p>
          {exercise.instructions && exercise.instructions.length > 0 ? (
            <ol className="list-decimal list-inside space-y-2 text-white/80 text-sm">
              {exercise.instructions.map((ins: string, i: number) => (
                <li key={i}>{ins}</li>
              ))}
            </ol>
          ) : (
            <p className="text-white/40">No instructions available.</p>
          )}
        </div>

        <div className="glass-panel p-4">
          <p className="text-xs text-white/40 uppercase tracking-[0.08em] mb-2">Secondary muscles</p>
          <div className="flex flex-wrap gap-2">
            {(exercise.secondaryMuscles || []).length === 0 && (
              <span className="text-white/40 text-sm">None listed</span>
            )}
            {(exercise.secondaryMuscles || []).map((m: string, i: number) => (
              <span key={i} className="px-2 py-1 rounded-md bg-white/5 text-sm text-white/80">{m}</span>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <Link
            href={`/workout?exerciseId=${encodeURIComponent(String(exercise.id))}`}
            className="inline-flex items-center justify-center rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 bg-white text-black px-4 py-2.5 text-sm"
          >
            Start This Exercise
          </Link>
        </div>
      </div>
    </div>
  );
}
