'use client';

import { useWorkoutStore } from '@/store/workout-store';
import { Button, Input } from '@/components/ui';
import { useState, useEffect } from 'react';
import { LucideCheck, LucideTimer, LucideChevronRight, LucideRepeat, LucidePlus } from 'lucide-react';
import { db, type Exercise } from '@/lib/db/dexie';
import { useRouter } from 'next/navigation';

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const { 
    activeWorkoutId, 
    activeSessionId,
    flatSessionPlan, 
    currentStepIndex, 
    workoutState,
    restTimeRemaining,
    recoverSession,
    startSession,
    completeSet,
    skipRest,
    extendRest,
    tickRest,
    endSession,
    logs
  } = useWorkoutStore();

  const [currentExDetails, setCurrentExDetails] = useState<Exercise | null>(null);
  const [nextExDetails, setNextExDetails] = useState<Exercise | null>(null);
  
  const [weightInput, setWeightInput] = useState('');
  const [repsInput, setRepsInput] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  // 1. Session Recovery / Init
  useEffect(() => {
    async function init() {
       const cached = await db.sessionStateCache.toCollection().first();
       if (cached) {
          recoverSession(cached);
       } else if (!activeWorkoutId) {
          // Fallback mock start
          const workout = await db.workouts.toCollection().first();
          if (workout && workout.id) {
             const exercises = await db.workoutExercises.where('workoutId').equals(workout.id).sortBy('order');
             const session = await db.sessions.add({
               workoutId: workout.id,
               currentExerciseIndex: 0,
               startTime: Date.now(),
               status: 'active'
             });
             startSession(session as number, workout.id, exercises);
          }
       }
    }
    init();
  }, [activeWorkoutId, recoverSession, startSession]);

  const currentStep = flatSessionPlan[currentStepIndex];
  const nextStep = flatSessionPlan[currentStepIndex + 1];

  // 2. Predictive Data Loading & DOM Preloading
  useEffect(() => {
    if (currentStep) {
      db.exercises.get(currentStep.exerciseId).then(ex => {
        if(ex) {
           setCurrentExDetails(ex);
           setRepsInput(currentStep.targetReps.toString());
           if (weightInput === '') setWeightInput('0');
        }
      });
    }
    if (nextStep) {
      db.exercises.get(nextStep.exerciseId).then(ex => {
        if(ex) {
           setNextExDetails(ex);
           // Silent HTML preload
           const link = document.createElement('link');
           link.rel = 'preload';
           link.as = 'video';
           link.href = ex.video_url;
           document.head.appendChild(link);
        }
      });
    }
  }, [currentStep, nextStep]);

  // 3. Central Tick Loop for Rest
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (workoutState === 'resting' && restTimeRemaining > 0) {
      interval = setInterval(() => tickRest(), 1000);
    }
    return () => clearInterval(interval);
  }, [workoutState, restTimeRemaining, tickRest]);

  // Animation trigger for smooth transitions
  useEffect(() => {
     setIsAnimating(true);
     const t = setTimeout(() => setIsAnimating(false), 300);
     return () => clearTimeout(t);
  }, [currentStepIndex, workoutState]);

  if (!activeWorkoutId || !currentStep || !currentExDetails) {
    return <div className="flex justify-center items-center h-screen bg-gray-50"><div className="animate-pulse w-12 h-12 bg-blue-200 rounded-full" /></div>;
  }

  const handleCompleteSet = async () => {
    const w = parseFloat(weightInput) || 0;
    const r = parseInt(repsInput, 10) || 0;
    await completeSet(w, r);
  };
  
  const handleRepeatLast = () => {
     // rudimentary previous logic - gets last logged set regardless of exercise
     if (logs.length > 0) {
        setWeightInput(logs[logs.length-1].weight.toString());
        setRepsInput(logs[logs.length-1].reps.toString());
     }
  };

  const isCompleted = workoutState === 'completed';

  if (isCompleted) {
     return (
        <div className="flex flex-col h-screen bg-green-50 justify-center items-center p-6 text-center">
           <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl">
             <LucideCheck className="w-12 h-12 text-white" />
           </div>
           <h1 className="text-4xl font-black text-green-900 mb-2">Session Complete!</h1>
           <p className="text-gray-600 mb-12">You absolutely crushed it.</p>
           <Button size="lg" className="w-full text-lg h-14" onClick={() => { endSession(); router.push('/'); }}>Finish & Return Home</Button>
        </div>
     );
  }

  const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';
  const currentVideoSrc = currentExDetails.video_url?.includes('undefined/') 
    ? currentExDetails.video_url.replace(/.*undefined\//, `${r2Url}/`)
    : currentExDetails.video_url;

  const nextVideoSrc = nextExDetails?.video_url?.includes('undefined/') 
    ? nextExDetails.video_url.replace(/.*undefined\//, `${r2Url}/`)
    : nextExDetails?.video_url;

  return (
    <div className={`flex flex-col h-screen overflow-hidden bg-gray-50 pb-20 transition-opacity duration-300 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
      
      {/* Header */}
      <header className="px-4 py-3 bg-white border-b border-gray-100 flex justify-between items-center shrink-0">
        <div>
          <h1 className="font-bold">Step {currentStepIndex + 1} of {flatSessionPlan.length}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { endSession(); router.push('/'); }}>Quit</Button>
      </header>

      {/* Video Area */}
      <div className="relative aspect-square w-full bg-black shrink-0 overflow-hidden shadow-sm">
        <video 
          key={currentVideoSrc} 
          src={currentVideoSrc} 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover opacity-90 transition-all duration-500"
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-12">
           <h2 className="text-white font-black text-3xl capitalize">{currentExDetails.name}</h2>
           <p className="text-blue-300 font-bold mt-1 text-sm tracking-wide uppercase">
             Target: Set {currentStep.setIndex} - {currentStep.targetReps} reps
           </p>
        </div>
      </div>

      {/* Instant Input Logger */}
      {workoutState === 'active_set' && (
        <main className="flex-1 overflow-y-auto p-4 flex flex-col justify-end gap-4">
           <div className="bg-white rounded-3xl p-5 border-2 border-blue-100 shadow-xl shadow-blue-50">
             
             {/* Quick Actions */}
             <div className="flex gap-2 mb-4">
               <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setWeightInput(prev => Math.max(0, parseFloat(prev||'0') - 5).toString())}>-5kg</Button>
               <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setWeightInput(prev => (parseFloat(prev||'0') + 5).toString())}>+5kg</Button>
               <Button variant="outline" size="sm" className="flex-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-none" onClick={handleRepeatLast}>
                  <LucideRepeat className="w-3 h-3 mr-1"/> Prev
               </Button>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-2">Weight (kg)</label>
                   <Input 
                      type="number" 
                      value={weightInput} 
                      onChange={e => setWeightInput(e.target.value)} 
                      className="text-3xl font-black bg-gray-50 border-none text-center h-20 mt-1 focus:ring-blue-500"
                   />
                </div>
                <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-2">Reps</label>
                   <Input 
                      type="number" 
                      value={repsInput} 
                      onChange={e => setRepsInput(e.target.value)}
                      className="text-3xl font-black bg-gray-50 border-none text-center h-20 mt-1 focus:ring-blue-500"
                   />
                </div>
             </div>
             <Button className="w-full text-lg h-16 font-black tracking-widest uppercase bg-blue-600 hover:bg-blue-700" onClick={handleCompleteSet}>
               <LucideCheck className="w-6 h-6 mr-2 stroke-[3]" />
               MARK DONE
             </Button>
          </div>
        </main>
      )}

      {/* Full-Screen Rest Overlay */}
      {workoutState === 'resting' && (
        <div className="absolute inset-0 z-50 bg-blue-600/95 backdrop-blur-sm flex flex-col items-center p-6 text-white text-center transition-all animate-in fade-in duration-300 pb-32">
          
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <LucideTimer className="w-12 h-12 opacity-30 mb-6" />
            <h2 className="text-xl font-bold opacity-80 mb-2 tracking-widest uppercase text-blue-200">Rest Remaining</h2>
            <div className="text-9xl font-black mb-12 tabular-nums tracking-tighter shadow-blue-900/50 drop-shadow-xl">
              {Math.floor(restTimeRemaining / 60)}:{(restTimeRemaining % 60).toString().padStart(2, '0')}
            </div>
            
            <div className="flex gap-4 w-full max-w-xs mb-12">
               <Button className="flex-1 bg-white/10 hover:bg-white/20 text-white border-0 py-6" onClick={() => extendRest(10)}>
                  <LucidePlus className="w-4 h-4 mr-1"/> 10s
               </Button>
               <Button className="flex-1 bg-white/10 hover:bg-white/20 text-white border-0 py-6" onClick={skipRest}>
                  Skip Rest
               </Button>
            </div>
          </div>

          {/* Next Exercise Preview */}
          {nextStep ? (
             <div className="w-full max-w-sm bg-black/30 rounded-3xl p-4 backdrop-blur-md flex items-center gap-4 border border-white/10 shadow-2xl">
               {nextExDetails && (
                 <video src={nextVideoSrc} className="w-20 h-20 rounded-xl object-cover bg-black" muted playsInline />
               )}
               <div className="text-left flex-1">
                 <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1">Up Next</p>
                 <p className="font-bold text-lg leading-tight capitalize truncate break-words w-40">{nextExDetails?.name || 'Loading...'}</p>
                 <p className="text-xs text-white/50 font-medium mt-1">Set {nextStep.setIndex} • {nextStep.targetReps} reps</p>
               </div>
             </div>
          ) : (
             <p className="text-white/50 font-bold tracking-widest uppercase">Last exercise! Finish strong.</p>
          )}
        </div>
      )}
    </div>
  );
}