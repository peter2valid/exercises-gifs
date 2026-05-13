import { getAdminSupabase } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Dumbbell, Clock, Repeat, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PublicProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = getAdminSupabase();

  const { data: program } = await admin
    .from('templates')
    .select(`
      id, 
      name, 
      description, 
      gym_id,
      gyms(name),
      template_exercises(
        id, 
        exercise_id, 
        exercise_name, 
        sets, 
        reps, 
        rest_seconds, 
        ord
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (!program) notFound();

  const exercises = (program.template_exercises || []).sort((a: any, b: any) => a.ord - b.ord);

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32">
      {/* Header */}
      <div className="relative h-64 w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-[#050505]" />
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <Link href="/explore" className="mb-4 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Explore
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 mb-1">Workout Program</p>
          <h1 className="text-3xl font-black tracking-tight leading-tight">{program.name}</h1>
          <p className="text-sm text-white/50 mt-2 font-medium">
            By {(program.gyms as any)?.name || 'GymApp'}
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 mt-6 space-y-8">
        {program.description && (
          <p className="text-white/60 text-sm leading-relaxed">
            {program.description}
          </p>
        )}

        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Exercises</h2>
          <div className="space-y-3">
            {exercises.map((ex: any, i: number) => (
              <div key={ex.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#111] shrink-0 border border-white/10">
                  <Image 
                    src={`/exercise-posters/${ex.exercise_id}.jpg`} 
                    alt="" 
                    fill 
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-0.5">Step {i + 1}</p>
                  <p className="font-bold text-lg truncate leading-tight">{ex.exercise_name}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-white/50">
                      <Repeat size={12} className="text-blue-400" />
                      <span className="text-[13px] font-medium">{ex.sets} × {ex.reps}</span>
                    </div>
                    {ex.rest_seconds > 0 && (
                      <div className="flex items-center gap-1 text-white/50 border-l border-white/10 pl-3">
                        <Clock size={12} className="text-blue-400" />
                        <span className="text-[13px] font-medium">{ex.rest_seconds}s rest</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6">
          <Link
            href={`/auth?next=${encodeURIComponent(`/p/${program.id}`)}`}
            className="block w-full bg-white text-black py-4 rounded-2xl font-black text-center tracking-tight hover:bg-white/90 active:scale-[0.98] transition-all shadow-xl shadow-white/5"
          >
            JOIN GYM TO START WORKOUT
          </Link>
          <p className="text-[11px] text-center text-white/20 mt-4 uppercase tracking-[0.1em] font-medium">
            Save this program and track your progress
          </p>
        </div>
      </div>
    </div>
  );
}
