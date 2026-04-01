'use client';

import { Button } from '@/components/ui';
import { LucidePlay, LucideHistory, LucideTrendingUp, LucideCalendarCheck2, LucideCheckCircle2, LucideDumbbell, LucideRotateCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { db, type Workout, type AssignedWorkout } from '@/lib/db/dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { useWorkoutStore } from '@/store/workout-store';

export default function Dashboard() {
  const router = useRouter();
  const startSession = useWorkoutStore(state => state.startSession);
  
  const today = new Date().toISOString().split('T')[0];
  const customWorkouts = useLiveQuery(() => db.workouts.toArray()) || [];

  // Unified Assignment Engine - SINGLE point of truth
  const context = useLiveQuery(async () => {
     const all = await db.assignedWorkouts.toArray();
     
     let active = null;
     let pending = null;
     let completed = null;

     for (const a of all) {
        if (a.status === 'active') active = a;
        else if (a.status === 'pending' && a.dateScheduled <= today) {
           if (!pending || a.priority > pending.priority || a.dateScheduled < pending.dateScheduled) {
              pending = a;
           }
        }
        else if (a.status === 'completed' && a.dateScheduled === today) completed = a;
     }

     const target = active || pending || completed;
     if (!target) return { active, pending, completed, details: null };

     // Resolve details in the same query context to keep state atomic
     const workout = await db.workouts.get(target.workoutId);
     if (!workout) return { active, pending, completed, details: null };

     const exercises = await db.workoutExercises.where('workoutId').equals(target.workoutId).toArray();
     
     let totalSeconds = 0;
     exercises.forEach(ex => { totalSeconds += (ex.sets * 45) + (ex.sets * (ex.restTime || 60)); });

     return {
        active, pending, completed,
        details: {
           workout,
           exerciseCount: exercises.length,
           durationMins: Math.round(totalSeconds / 60),
           exercises
        }
     };
  }, [today]);

  const activeAssignment = context?.active;
  const pendingAssignment = context?.pending;
  const completedAssignment = context?.completed;
  const assignmentDetails = context?.details;

  // Stable Prefetching
  useEffect(() => {
     if (assignmentDetails && (pendingAssignment || activeAssignment)) {
        router.prefetch('/workout/active');
     }
  }, [assignmentDetails, pendingAssignment, activeAssignment, router]);

  const handleStartWorkout = async (workoutId: number, assignmentId?: number) => {
      const exercises = await db.workoutExercises.where('workoutId').equals(workoutId).sortBy('order');
      if (!assignmentId) {
          // It's a manual template launch
          const session = await db.sessions.add({ workoutId, currentExerciseIndex: 0, startTime: Date.now(), status: 'active' });
          startSession(session as number, workoutId, exercises);
          router.push('/workout/active');
      } else {
          // Starting a brand new assigned session
          const session = await db.sessions.add({ workoutId, currentExerciseIndex: 0, startTime: Date.now(), status: 'active' });
          await startSession(session as number, workoutId, exercises, assignmentId);
          router.push('/workout/active');
      }
  };

  const handleResumeWorkout = () => {
      router.push('/workout/active');
  };

  // Hidden testing hook
  const injectTestAssignment = async () => {
     let wId = customWorkouts[0]?.id || 1;
     await db.assignedWorkouts.add({
       userId: 'test_user',
       workoutId: Number(wId),
       dateScheduled: today,
       status: 'pending',
       syncStatus: 'local',
       priority: 1
     });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">SupaFast</h1>
          <p className="text-gray-400 font-medium">Ready for your session?</p>
        </div>
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold cursor-pointer" onClick={injectTestAssignment}>
          JD
        </div>
      </header>

      {/* Dynamic ALIVE Dashboard Engine */}
      {activeAssignment && assignmentDetails ? (
         <div className="bg-orange-500 rounded-3xl p-8 text-white shadow-xl shadow-orange-200 overflow-hidden relative border border-orange-400 transform transition-all hover:scale-[1.02]">
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-2">
                 <LucideRotateCw className="w-5 h-5 text-orange-200 animate-spin-slow" />
                 <p className="text-orange-100 font-bold uppercase tracking-wider text-xs">Session in Progress</p>
             </div>
             <h2 className="text-3xl font-black capitalize">{assignmentDetails.workout.name}</h2>
             <p className="text-orange-100 mt-2 font-medium">You left this workout active. Let's finish it up.</p>
             <Button 
                className="mt-8 bg-white text-orange-600 hover:bg-orange-50 w-full md:w-auto h-14 text-lg font-black uppercase tracking-widest shadow-lg"
                onClick={handleResumeWorkout}
             >
                <LucidePlay className="w-5 h-5 mr-2 fill-current" />
                Resume Workout
             </Button>
           </div>
           <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-orange-400 rounded-full opacity-50 blur-3xl"></div>
         </div>
      ) : pendingAssignment && assignmentDetails ? (
         <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 overflow-hidden relative border border-blue-500 transform transition-all hover:scale-[1.02]">
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-2">
                 <LucideCalendarCheck2 className="w-5 h-5 text-blue-200" />
                 <p className="text-blue-100 font-bold uppercase tracking-wider text-xs">Today's Workout</p>
             </div>
             <h2 className="text-3xl font-black capitalize">{assignmentDetails.workout.name}</h2>
             <p className="text-blue-100 mt-2 font-medium">Your coach assigned this session for you.</p>
             
             <div className="flex gap-4 mt-6 bg-black/10 rounded-2xl p-4 w-fit border border-white/10">
                <div>
                   <p className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">Duration</p>
                   <p className="text-lg font-black tracking-tight">{assignmentDetails.durationMins} mins</p>
                </div>
                <div className="w-px bg-white/10 mx-2"></div>
                <div>
                   <p className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">Volume</p>
                   <p className="text-lg font-black tracking-tight">{assignmentDetails.exerciseCount} exercises</p>
                </div>
             </div>

             <Button 
                className="mt-8 bg-white text-blue-600 hover:bg-blue-50 w-full md:w-auto h-14 text-lg font-black uppercase tracking-widest shadow-lg"
                onClick={() => handleStartWorkout(assignmentDetails.workout.id!, pendingAssignment.id!)}
             >
                <LucidePlay className="w-5 h-5 mr-2 fill-current" />
                START WORKOUT
             </Button>
           </div>
           <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500 rounded-full opacity-50 blur-3xl"></div>
         </div>
      ) : completedAssignment && assignmentDetails ? (
         <div className="bg-green-500 rounded-3xl p-8 text-white shadow-xl shadow-green-200 overflow-hidden relative border border-green-400">
           <div className="relative z-10 flex flex-col items-center justify-center text-center">
             <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mb-4 shadow-inner border border-green-400">
                <LucideCheckCircle2 className="w-10 h-10 text-white" />
             </div>
             <p className="text-green-100 font-bold uppercase tracking-wider text-xs mb-1">Session Complete</p>
             <h2 className="text-3xl font-black capitalize">{assignmentDetails.workout.name}</h2>
             <p className="text-green-100 mt-2 font-medium">You smashed your assignment today. Recover up.</p>
           </div>
           <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-green-400 rounded-full opacity-50 blur-3xl"></div>
         </div>
      ) : (
         <div className="bg-gray-100 rounded-3xl p-8 text-center border-2 border-dashed border-gray-200">
            <h2 className="text-2xl font-black text-gray-800">Rest Day</h2>
            <p className="text-gray-500 mt-2 font-medium">No workout assigned for today. Take it easy or pick a custom template below!</p>
            <Button variant="outline" className="mt-6 font-bold" onClick={injectTestAssignment}>Force Test Assignment</Button>
         </div>
      )}

      {/* Manual Templates Gallery */}
      <section>
        <div className="flex justify-between items-center mb-4 mt-6">
          <h3 className="font-bold text-lg text-gray-900">Your Templates</h3>
        </div>
        
        {customWorkouts.length === 0 ? (
           <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 text-center text-blue-800">
              <LucideDumbbell className="w-8 h-8 opacity-20 mx-auto mb-2" />
              <p className="font-bold">No Custom Templates</p>
              <p className="text-sm opacity-80 mb-4">Go to the Builder tab to create your first workout!</p>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {customWorkouts.map((template: Workout) => (
                 <div key={template.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-transform hover:-translate-y-1 hover:shadow-md cursor-pointer" onClick={() => handleStartWorkout(template.id!)}>
                   <div>
                     <h4 className="font-bold text-md text-gray-900 capitalize">{template.name}</h4>
                     <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wider">Custom Template</p>
                   </div>
                   <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                      <LucidePlay className="w-3 h-3 fill-current" />
                   </div>
                 </div>
              ))}
           </div>
        )}
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 pb-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <LucideHistory className="w-6 h-6 text-orange-500 mb-4" />
          <p className="text-3xl font-black tabular-nums">12</p>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Workouts / mo</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <LucideTrendingUp className="w-6 h-6 text-green-500 mb-4" />
          <p className="text-3xl font-black text-green-600 tabular-nums">↑ 14%</p>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Volume Up</p>
        </div>
      </div>
    </div>
  );
}