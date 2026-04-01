'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { LucideActivity, LucideCheckCircle, LucideClock, LucideDumbbell, LucideArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CoachResultsPage() {
   const results = useLiveQuery(() => db.workoutResults.orderBy('completedAt').reverse().toArray()) || [];
   const assignedWorkouts = useLiveQuery(() => db.assignedWorkouts.toArray()) || [];
   const workouts = useLiveQuery(() => db.workouts.toArray()) || [];

   return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 pb-20">
         <div className="w-full max-w-3xl flex flex-col gap-6 pt-4">
            
            <header className="flex flex-col gap-2">
               <Link href="/" className="inline-flex items-center text-sm font-bold tracking-wider uppercase text-blue-600 mb-2">
                  <LucideArrowLeft className="w-4 h-4 mr-1" /> Back to Base
               </Link>
               <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Activity Feed</h1>
               <p className="text-gray-500 font-medium">Verify client compliance and track execution data in real-time.</p>
            </header>

            {results.length === 0 ? (
               <div className="border border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center mt-4">
                  <LucideActivity className="w-10 h-10 text-gray-300 mb-4" />
                  <p className="font-bold text-gray-500">No sessions executed yet.</p>
                  <p className="text-sm text-gray-400 mt-1">When users complete an assigned block, stats will appear here natively.</p>
               </div>
            ) : (
               <div className="flex flex-col gap-4">
                  {results.map(r => {
                     const workout = workouts.find(w => w.id === r.workoutId);
                     const assignment = assignedWorkouts.find(a => a.id === r.assignedWorkoutId);
                     const date = new Date(r.completedAt);
                     const isValidDate = !isNaN(date.getTime());
                     const volume = Number(r.totalVolume) || 0;
                     const duration = Number(r.totalDurationSeconds) || 0;

                     return (
                        <div key={r.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xl shadow-blue-900/5 group transition-all hover:scale-[1.01]">
                           <div className="flex justify-between items-start mb-4">
                              <div>
                                 <h3 className="font-black text-xl text-gray-900 leading-tight mb-1">{workout?.name || 'Custom Workout'}</h3>
                                 <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center">
                                       <LucideCheckCircle className="w-3 h-3 mr-1" /> Completed
                                    </span>
                                    {assignment && <span className="text-xs text-gray-400 font-bold">via {assignment.assignedBy}</span>}
                                 </div>
                              </div>
                              <p className="text-xs text-gray-400 font-black tracking-widest uppercase">
                                 {isValidDate ? date.toLocaleDateString() : 'Recent'}
                              </p>
                           </div>

                           <div className="grid grid-cols-2 gap-3">
                              <div className="bg-blue-50/50 rounded-2xl p-4 flex items-center gap-3">
                                 <div className="bg-white p-2 rounded-xl text-blue-500 shadow-sm"><LucideDumbbell className="w-5 h-5" /></div>
                                 <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Volume</span>
                                    <span className="font-black text-blue-900 text-lg">{volume.toLocaleString()} <span className="text-sm font-bold text-blue-400">lbs</span></span>
                                 </div>
                              </div>
                              <div className="bg-orange-50/50 rounded-2xl p-4 flex items-center gap-3">
                                 <div className="bg-white p-2 rounded-xl text-orange-400 shadow-sm"><LucideClock className="w-5 h-5" /></div>
                                 <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Duration</span>
                                    <span className="font-black text-orange-900 text-lg">{Math.round(duration / 60)} <span className="text-sm font-bold text-orange-400">min</span></span>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center px-1">
                              <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                 <LucideActivity className={`w-3 h-3 ${r.syncStatus === 'synced' ? 'text-green-500' : 'text-blue-500 animate-pulse'}`} />
                                 {r.syncStatus === 'synced' ? 'Synced to Cloud' : 'Queued Offline'}
                              </span>
                              <span className="font-black text-gray-300 text-xs lowercase">@{r.userId}</span>
                           </div>
                        </div>
                     )
                  })}
               </div>
            )}
         </div>
      </div>
   );
}
