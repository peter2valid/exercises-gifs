'use client';

import { LucideBookmark, LucideInfo } from 'lucide-react';
import { Exercise } from '@/lib/db/dexie';

interface ExerciseCardProps {
  exercise: Exercise;
  style?: React.CSSProperties;
}

export function ExerciseCard({ exercise, style }: ExerciseCardProps) {
  const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';
  
  // High-Robustness URL Builder: Prioritize working R2 paths over broken legacy DB strings
  let videoSrc = exercise.video_url;
  if (!videoSrc || videoSrc.includes('undefined')) {
    // If we have an ID like '0001', the path should be exercises/0001.mp4
    const cleanId = exercise.id.toString().padStart(4, '0');
    videoSrc = `${r2Url}/exercises/${cleanId}.mp4`;
  }

  return (
    <div style={style} className="p-2"> 
      <div className="bg-[#F8F9FB] rounded-[2.5rem] overflow-hidden border border-gray-100 hover:shadow-2xl transition-all h-full flex flex-col group relative">
        
        {/* Media Container - 4:5 Vertical Aspect */}
        <div className="relative aspect-[4/5] flex items-center justify-center p-4">
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
        <div className="px-6 pb-6 pt-2">
          <h3 className="font-black text-gray-900 leading-tight text-xl capitalize mb-1">{exercise.name}</h3>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-loose">
            {exercise.body_part || 'Body Only'}
          </p>
        </div>

      </div>
    </div>
  );
}
