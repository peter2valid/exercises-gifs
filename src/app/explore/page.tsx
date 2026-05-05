'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui';
import ExerciseCard from '@/components/ExerciseCard';
import exercisesData from '../../../data/exercises.json';

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const [filterPart, setFilterPart] = useState<string | null>(null);

  const exercises = exercisesData as any[];

  const bodyParts = useMemo(() => {
    const s = new Set<string>();
    for (const e of exercises) s.add(e.bodyPart || 'other');
    return Array.from(s).sort();
  }, [exercises]);

  const filtered = exercises.filter((ex) => {
    const q = search.trim().toLowerCase();
    if (filterPart && (ex.bodyPart || '').toLowerCase() !== filterPart.toLowerCase()) return false;
    if (!q) return true;
    return (ex.name || '').toLowerCase().includes(q) || (ex.target || '').toLowerCase().includes(q);
  });

  return (
    <div className="dashboard-bg min-h-screen pb-24 pt-6">
      <div className="max-w-md mx-auto px-4">
        <div className="mb-4">
          <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium mb-1">Explore</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Browse Exercises</h1>
        </div>

        <div className="mb-4 relative">
          <Search size={16} className="absolute left-3 top-3.5 text-white/30" />
          <Input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>

        <div className="mb-4 overflow-x-auto flex gap-2 pb-2">
          <button
            onClick={() => setFilterPart(null)}
            className={`px-3 py-2 rounded-lg text-sm ${filterPart === null ? 'bg-white/10' : 'bg-white/5'} text-white`}
          >
            All
          </button>
          {bodyParts.map((p) => (
            <button
              key={p}
              onClick={() => setFilterPart(p)}
              className={`px-3 py-2 rounded-lg text-sm ${filterPart === p ? 'bg-white/10' : 'bg-white/5'} text-white`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="grid gap-3">
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/40 text-sm">No exercises found</p>
            </div>
          )}

          {filtered.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} />
          ))}
        </div>
      </div>
    </div>
  );
}
