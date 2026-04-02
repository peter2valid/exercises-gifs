'use client';

import { useParams, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { useGym } from '@/context/GymContext';
import { useGymParam } from '@/hooks/useGymParam';
import { LucideArrowLeft, LucideDumbbell, LucideTarget, LucideCheckCircle2, LucidePlayCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getExerciseBodyPart, getExerciseInstructions, getExerciseVideoSrc } from '@/lib/exercise-data';

export default function ExerciseViewer() {
  const { id } = useParams();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const { gymId, gymName } = useGym();
  const { buildGymUrl } = useGymParam();
  
  const exercise = useLiveQuery(
    () => db.exercises.get(id as string),
    [id]
  );

  // Auto-play reliability
  useEffect(() => {
    if (videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setIsPlaying(false); // Show play button if browser blocks autoplay
        });
      }
    }
  }, [exercise]);

  if (exercise === undefined) {
    return (
      <div className="min-h-screen bg-white">
        <div className="aspect-square w-full bg-gray-100 animate-pulse" />
        <div className="px-8 py-10 space-y-6">
           <div className="h-10 w-3/4 bg-gray-100 animate-pulse rounded-xl" />
           <div className="flex gap-4">
              <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-lg" />
              <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-lg" />
           </div>
           <div className="space-y-4 pt-4">
              <div className="h-4 w-full bg-gray-50 animate-pulse rounded" />
              <div className="h-4 w-full bg-gray-50 animate-pulse rounded" />
              <div className="h-4 w-2/3 bg-gray-50 animate-pulse rounded" />
           </div>
        </div>
      </div>
    );
  }

  if (exercise === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4">
        <h1 className="text-2xl font-black text-gray-900">Exercise Not Found</h1>
          <p className="text-gray-500">We couldn&apos;t find the exercise you&apos;re looking for.</p>
        <Link href={buildGymUrl('/scan')} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold">
          Go Back to Scan
        </Link>
      </div>
    );
  }

  const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';
  const videoSrc = getExerciseVideoSrc(exercise, r2Url);
  const instructionSteps = getExerciseInstructions(exercise.instructions);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Navigation */}
      <nav className="fixed top-6 left-6 z-50">
        <button 
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push(buildGymUrl('/scan'));
            }
          }}
          className="p-3 bg-white/90 backdrop-blur shadow-xl rounded-2xl active:scale-90 transition-all border border-gray-100"
        >
          <LucideArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
      </nav>

      {/* Gym Badge (if set) */}
      {gymId && (
        <div className="sticky top-6 right-6 z-40 float-right">
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
            🏋️ {gymName}
          </div>
        </div>
      )}

      {/* Video Section */}
      <div 
        className="relative aspect-square w-full bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => {
           if (videoRef.current) {
              if (videoRef.current.paused) {
                 videoRef.current.play();
                 setIsPlaying(true);
              } else {
                 videoRef.current.pause();
                 setIsPlaying(false);
              }
           }
        }}
      >
        <video 
          ref={videoRef}
          src={videoSrc}
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-contain"
          onError={(e) => {
             e.currentTarget.style.display = 'none';
          }}
        />
        
        {/* Play Fallback Overlay */}
        {!isPlaying && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[2px]">
              <LucidePlayCircle className="w-20 h-20 text-blue-600 drop-shadow-lg" />
           </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </div>

      {/* Content Section */}
      <main className="px-8 -mt-8 relative z-10 space-y-10">
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-gray-900 leading-tight capitalize tracking-tight">
            {exercise.name}
          </h1>
          <div className="flex flex-wrap gap-3">
             <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs uppercase tracking-wider">
                <LucideTarget className="w-4 h-4" />
                 {getExerciseBodyPart(exercise) || 'Unknown'}
             </div>
             <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl font-bold text-xs uppercase tracking-wider">
                <LucideDumbbell className="w-4 h-4" />
                {exercise.equipment || 'No Equipment'}
             </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-6">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <LucideCheckCircle2 className="w-4 h-4" />
            Instructions
          </h2>
          <div className="space-y-8">
            {instructionSteps.length > 0 ? instructionSteps.map((step, i) => (
              <div key={i} className="flex gap-6">
                <span className="shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-black text-sm text-gray-400">
                  {i + 1}
                </span>
                <p className="text-gray-700 font-medium leading-relaxed">
                  {step.replace(/^\d+\.\s*/, '').trim()}
                </p>
              </div>
            )) : (
              <p className="text-gray-500 font-medium">No instructions available for this exercise yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
