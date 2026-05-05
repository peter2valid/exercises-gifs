'use client';

import { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui';

export default function ExplorePage() {
  const [search, setSearch] = useState('');

  const categories = [
    'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core',
    'Cardio', 'Flexibility', 'Strength', 'Endurance'
  ];

  const filteredCategories = search
    ? categories.filter(cat => cat.toLowerCase().includes(search.toLowerCase()))
    : categories;

  return (
    <div className="dashboard-bg min-h-screen pb-24 pt-8">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium mb-2">Explore</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Browse</h1>
        </div>

        {/* Search */}
        <div className="mb-8 relative">
          <Search size={16} className="absolute left-3 top-3.5 text-white/30" />
          <Input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filteredCategories.map((category) => (
            <button
              key={category}
              className="glass-panel p-4 text-left transition-all hover:bg-white/10 group animate-slide-up"
            >
              <p className="text-sm font-medium text-white group-hover:text-white/80 transition-colors flex items-center justify-between">
                {category}
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="text-xs text-white/30 mt-1">24 exercises</p>
            </button>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/40 text-sm">No categories found</p>
          </div>
        )}
      </div>
    </div>
  );
}
