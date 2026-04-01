'use client';

import React, { useState, useEffect } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { ExerciseCard } from './ExerciseCard';
import { type Exercise } from '@/lib/db/dexie';

interface ExerciseGridProps {
  exercises: Exercise[];
}

export function ExerciseGrid({ exercises }: ExerciseGridProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getColumnCount = (width: number) => {
    if (width < 500) return 2;
    if (width < 800) return 3;
    if (width < 1100) return 4;
    if (width < 1400) return 5;
    return 6;
  };

  if (!mounted || !exercises || exercises.length === 0) {
     return (
        <div className="flex justify-center items-center h-40">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
     );
  }

  // Fallback for AutoSizer potentially return null in some builds
  const AutoSizerComponent: any = AutoSizer;

  return (
    <div className="h-full w-full px-4 overflow-hidden" style={{ minHeight: '500px' }}>
      <AutoSizerComponent>
        {({ height, width }: { height: number; width: number }) => {
          // Safety check: if AutoSizer fails to find height, provide a fallback to avoid blank screen
          const safeHeight = height || 800; 
          const safeWidth = width || 400;

          const cols = getColumnCount(safeWidth);
          const columnWidth = safeWidth / cols;
          const rowCount = Math.ceil(exercises.length / cols);

          return (
            <Grid
              columnCount={cols}
              columnWidth={columnWidth}
              height={safeHeight}
              rowCount={rowCount}
              rowHeight={380}
              width={safeWidth}
              className="scrollbar-hide"
            >
              {({ columnIndex, rowIndex, style }: any) => {
                const index = rowIndex * cols + columnIndex;
                const exercise = exercises[index];

                if (!exercise) return null;

                return (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    style={style}
                  />
                );
              }}
            </Grid>
          );
        }}
      </AutoSizerComponent>
    </div>
  );
}
