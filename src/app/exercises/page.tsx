'use client';

import { useState } from 'react';
import { useExercises } from '@/hooks/useExercises';
import { ExerciseGrid } from '@/components/exercises/ExerciseGrid';
import { Input } from '@/components/ui';
import { LucideSearch, LucideSlidersHorizontal, LucidePlus } from 'lucide-react';

export default function ExercisesPage() {
  const [search, setSearch] = useState('');
  const [bodyPart, setBodyPart] = useState('all');
  const { exercises, isLoading } = useExercises(search, bodyPart);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Premium Header - Aligning with Mobile-First Mockup */}
      <header className="px-6 pt-8 pb-4 space-y-6">
        <div className="flex justify-between items-center">
           <div className="w-10 h-10 flex items-center justify-center">
              <span className="text-2xl">✕</span>
           </div>
           <h1 className="text-2xl font-black tracking-tight text-gray-900">Exercises</h1>
           <div className="flex gap-4 items-center">
              <LucideSearch className="w-6 h-6 text-gray-400" />
              <LucideSlidersHorizontal className="w-6 h-6 text-gray-400" />
              <LucidePlus className="w-6 h-6 text-gray-900" />
           </div>
        </div>

        <div className="flex flex-col">
           <span className="text-sm font-bold text-gray-400 mb-4">{exercises.length} movements available</span>
           <div className="relative">
              <Input 
                placeholder="Search 1300+ exercises..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 bg-gray-50 border-none rounded-xl pl-4 text-gray-600 focus:ring-2 focus:ring-blue-100"
              />
           </div>
        </div>
      </header>

      {/* Muscle Group Filter Placeholder (from mockup) */}
      <div className="px-6 flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
         {[1,2,3,4,5,6].map(i => (
            <div key={i} className="shrink-0 w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center opacity-40 grayscale">
               <div className="w-10 h-10 bg-gray-200 rounded-full" />
            </div>
         ))}
      </div>

      <main className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <p className="animate-pulse text-xl text-gray-400 font-black uppercase tracking-widest">Hydrating Library...</p>
          </div>
        ) : (
          <ExerciseGrid exercises={exercises} />
        )}
      </main>
    </div>
  );
}
