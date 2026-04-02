'use client';

import { LucideBookmark, LucideInfo } from 'lucide-react';
import { Exercise } from '@/lib/db/dexie';
import { getExerciseBodyPart, getExerciseVideoSrc } from '@/lib/exercise-data';

interface ExerciseCardProps {
  exercise: Exercise;
  style?: React.CSSProperties;
}

export function ExerciseCard({ exercise, style }: ExerciseCardProps) {
  const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';
  const videoSrc = getExerciseVideoSrc(exercise, r2Url);

  return (
    <div style={style} className="p-2"> 
      <div className="bg-white rounded-[2.5rem] overflow-hidden border border-black/5 shadow-[0_14px_45px_rgba(15,23,42,0.08)] hover:shadow-[0_18px_60px_rgba(15,23,42,0.12)] transition-all h-full flex flex-col group relative">
        
        {/* Media Container - 4:5 Vertical Aspect */}
        <div className="relative aspect-[4/5] flex items-center justify-center p-4 bg-[#f5f5f7]">
          <video 
            src={videoSrc} 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
            onError={(e) => {
               // Silently hide video on error or show placeholder if needed
               e.currentTarget.style.display = 'none';
            }}
          />
          
          {/* Mockup-Match Overlays */}
          <div className="absolute top-5 left-5">
             <div className="text-gray-400 hover:text-blue-600 transition-colors">
                <LucideBookmark className="w-6 h-6 stroke-[1.25px]" />
             </div>
          </div>
          <div className="absolute top-5 right-5">
             <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-300 hover:text-gray-900 transition-colors">
                ?
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-6 pb-6 pt-3">
          <h3 className="font-black text-gray-900 leading-tight text-2xl capitalize mb-1">{exercise.name}</h3>
          <p className="text-xs font-black text-gray-500 uppercase tracking-[0.24em] leading-loose">
            {getExerciseBodyPart(exercise) || 'Body Only'}
          </p>
        </div>

      </div>
    </div>
  );
}
