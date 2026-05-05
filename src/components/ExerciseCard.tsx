import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function ExerciseCard({ exercise }: { exercise: any }) {
  return (
    <Link href={`/explore/${exercise.id}`} className="block">
      <article className="glass-panel p-3 flex items-center gap-3 hover:scale-[1.01] transition-transform">
        <div className="w-14 h-14 rounded-md bg-white/6 flex items-center justify-center text-sm font-semibold text-white/70">
          {exercise.id}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white truncate">{exercise.name}</h3>
            <ChevronRight size={16} className="text-white/30" />
          </div>
          <p className="text-xs text-white/30 mt-1 truncate">{exercise.bodyPart} • {exercise.target}</p>
        </div>
      </article>
    </Link>
  );
}
