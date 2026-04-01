'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { LucideHistory, LucideCalendar, LucideTrophy, LucideClock } from 'lucide-react';
import { format } from 'date-fns';

export default function HistoryPage() {
  const results = useLiveQuery(() => 
    db.workoutResults.orderBy('completedAt').reverse().toArray()
  ) || [];

  const workouts = useLiveQuery(() => db.workouts.toArray()) || [];
  const workoutMap = new Map(workouts.map(w => [w.id, w.name]));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 pb-32">
      <header className="flex justify-between items-center bg-white pt-4 pb-2 sticky top-0 z-10 -mx-6 px-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Activity</h1>
          <p className="text-gray-400 font-medium">Your progress history</p>
        </div>
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
          <LucideHistory className="w-6 h-6" />
        </div>
      </header>

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
           <LucideHistory className="w-12 h-12 text-gray-200 mb-4" />
           <p className="font-bold text-gray-400">No sessions recorded yet</p>
           <p className="text-sm text-gray-400">Complete a workout to see your results here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <Card key={result.id} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all rounded-3xl">
              <CardHeader className="bg-gray-50/50 pb-2">
                <div className="flex justify-between items-start">
                   <div>
                      <CardTitle className="text-xl capitalize">{workoutMap.get(result.workoutId) || 'Deleted Workout'}</CardTitle>
                      <div className="flex items-center text-gray-400 gap-1.5 mt-1">
                         <LucideCalendar className="w-3 h-3" />
                         <span className="text-xs font-bold uppercase tracking-wider">{format(new Date(result.completedAt), 'PPP')}</span>
                      </div>
                   </div>
                   <Badge className="bg-green-100 text-green-700 border-none px-3 py-1 rounded-full">Completed</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50/50 p-4 rounded-2xl flex items-center gap-3">
                       <LucideTrophy className="w-5 h-5 text-blue-600" />
                       <div>
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Volume</p>
                          <p className="text-lg font-black text-blue-900">{result.totalVolume.toLocaleString()} <small className="text-[10px]">kg</small></p>
                       </div>
                    </div>
                    <div className="bg-orange-50/50 p-4 rounded-2xl flex items-center gap-3">
                       <LucideClock className="w-5 h-5 text-orange-600" />
                       <div>
                          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Duration</p>
                          <p className="text-lg font-black text-orange-900">{Math.floor(result.totalDurationSeconds / 60)} <small className="text-[10px]">min</small></p>
                       </div>
                    </div>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
