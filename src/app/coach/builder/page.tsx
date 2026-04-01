'use client';

import { useState, useMemo, useEffect } from 'react';
import { db, type Exercise } from '@/lib/db/dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { Input, Button } from '@/components/ui';
import { 
  LucideSearch, LucidePlus, LucideTrash2, LucideSave, 
  LucideGripVertical, LucideUserPlus, LucideCopy, LucideLink2, LucideEye, LucideEyeOff
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useBuilderStore, type DraftExercise } from '@/store/builder-store';

// DnD Kit imports
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent, DragStartEvent
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function triggerVibration() {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(50);
  }
}

// Ensure native scrolling/inputs aren't stolen by DnD kit's pointer sensor
const pointerSensorOptions = { activationConstraint: { distance: 5 } };

function SortableExerciseRow({ item, index, stackLength, isPreviewMode }: { item: DraftExercise, index: number, stackLength: number, isPreviewMode: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.draftId });
  const { updateExercise, removeExercise, duplicateExercise, toggleSuperset } = useBuilderStore();

  const isSuperset = !!item.supersetId;
  const isDraggingStyle = isDragging ? 'border-blue-500 opacity-90 scale-[1.02] shadow-xl z-50' : 'border-gray-100 shadow-sm z-1';
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  if (isPreviewMode) {
     if (item.isSection) {
        return (
           <div className="bg-gray-900 rounded-2xl p-4 text-white font-black tracking-widest uppercase flex items-center justify-between">
              {item.name}
           </div>
        );
     }
     return (
        <div className={`bg-white rounded-2xl p-4 border ${isSuperset ? 'border-l-4 border-l-orange-500 border-t-0 border-b-0 border-r-0 rounded-none' : 'border-gray-100'} flex justify-between`}>
           <div>
              <p className="font-bold text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{item.body_part}</p>
           </div>
           <div className="text-right">
              <p className="font-black text-blue-600">{item.sets} x {item.targetReps}</p>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{item.restTime}s rest</p>
           </div>
        </div>
     );
  }

  if (item.isSection) {
     return (
       <div ref={setNodeRef} style={style} className={`bg-gray-900 rounded-2xl p-4 flex gap-3 group relative transition-all ${isDraggingStyle} z-20`}>
         {/* Drag Handle */}
         <div {...attributes} {...listeners} className="flex flex-col items-center justify-center p-2 cursor-grab active:cursor-grabbing text-gray-500 hover:text-white rounded-xl transition-colors shrink-0">
            <LucideGripVertical className="w-6 h-6 outline-none" />
         </div>

         <div className="flex-1 flex justify-between items-center pr-2">
           <div className="relative group/input flex-1">
             <Input 
               value={item.name} 
               onChange={(e) => updateExercise(item.draftId, 'name', e.target.value)} 
               className="h-10 text-white font-black uppercase tracking-widest bg-transparent border-none focus:ring-0 px-0 outline-none w-full text-lg" 
             />
           </div>
           <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-500 hover:text-white h-8 w-8 p-0 rounded-full shrink-0" onClick={() => removeExercise(item.draftId)}>
             <LucideTrash2 className="w-4 h-4" />
           </Button>
         </div>
       </div>
     );
  }

  return (
    <div ref={setNodeRef} style={style} className={`bg-white rounded-2xl p-4 flex gap-3 group relative transition-all ${isDraggingStyle} ${isSuperset ? 'border-l-4 border-l-orange-500 shadow-[inset_0_4px_10px_rgb(249,115,22,0.05)]' : ''}`}>
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="flex flex-col items-center justify-center p-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-blue-500 hover:bg-gray-50 rounded-xl transition-colors shrink-0">
         <LucideGripVertical className="w-6 h-6 outline-none" />
      </div>

      <div className="flex-1 flex flex-col justify-center gap-3">
        <div className="flex justify-between items-start">
          <div className="select-none cursor-default pr-2 flex items-center gap-2">
            <h3 className="font-bold text-md text-gray-900 leading-tight capitalize items-center">{item.name}</h3>
            {isSuperset && <span className="text-[9px] bg-orange-100 text-orange-600 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Superset</span>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {index > 0 && (
               <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 rounded-full transition-colors ${isSuperset ? 'text-orange-500 bg-orange-50' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`} onClick={() => toggleSuperset(item.draftId)}>
                 <LucideLink2 className="w-4 h-4" />
               </Button>
            )}
            <Button variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-50 hover:text-blue-600 h-8 w-8 p-0 rounded-full" onClick={() => { triggerVibration(); duplicateExercise(item.draftId); }}>
              <LucideCopy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-50 hover:text-red-500 h-8 w-8 p-0 rounded-full" onClick={() => removeExercise(item.draftId)}>
              <LucideTrash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Inline Editors - Designed for Keyboard Speed */}
        <div className="grid grid-cols-3 gap-2">
          <div className="relative group/input">
            <label className="absolute -top-2 left-2 px-1 bg-white text-[9px] font-extrabold text-gray-400 uppercase tracking-wider z-10 transition-colors group-focus-within/input:text-blue-600">Sets</label>
            <Input 
              type="number" 
              value={item.sets || ''} 
              onChange={(e) => updateExercise(item.draftId, 'sets', parseInt(e.target.value) || 0)} 
              onFocus={(e) => e.target.select()}
              className="h-10 text-center font-bold bg-white border-gray-200 focus:border-blue-500 outline-none hover:border-gray-300 w-full" 
            />
          </div>
          <div className="relative group/input">
            <label className="absolute -top-2 left-2 px-1 bg-white text-[9px] font-extrabold text-gray-400 uppercase tracking-wider z-10 transition-colors group-focus-within/input:text-blue-600">Reps</label>
            <Input 
              type="number" 
              value={item.targetReps || ''} 
              onChange={(e) => updateExercise(item.draftId, 'targetReps', parseInt(e.target.value) || 0)} 
              onFocus={(e) => e.target.select()}
              className="h-10 text-center font-bold bg-white border-gray-200 focus:border-blue-500 outline-none hover:border-gray-300 w-full" 
            />
          </div>
          <div className="relative group/input">
            <label className="absolute -top-2 left-2 px-1 bg-white text-[9px] font-extrabold text-gray-400 uppercase tracking-wider z-10 transition-colors group-focus-within/input:text-blue-600">Rest (s)</label>
            <Input 
              type="number" 
              step="15" 
              value={item.restTime || ''} 
              onChange={(e) => updateExercise(item.draftId, 'restTime', parseInt(e.target.value) || 0)} 
              onFocus={(e) => e.target.select()}
              className="h-10 text-center font-bold bg-white border-gray-200 focus:border-blue-500 outline-none hover:border-gray-300 w-full" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoachBuilderPage() {
  const router = useRouter();
  const { 
     workoutName, setWorkoutName, 
     exercises: stack, addExercise, addSection,
     reorderExercises, clearDraft, overwriteState 
  } = useBuilderStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Keyboard shortcut + Native interactions
  useEffect(() => {
     setIsClient(true);
     // Auto-Load Draft
     const draft = localStorage.getItem('supafast_draft');
     if (draft) {
        try {
           const parsed = JSON.parse(draft);
           if (parsed && typeof parsed === 'object' && Array.isArray(parsed.exercises)) {
              overwriteState(parsed);
           }
        } catch(e) {}
     }
  }, []);

  // Auto-Save Draft watcher
  useEffect(() => {
     if (isClient && (workoutName || stack.length > 0)) {
        localStorage.setItem('supafast_draft', JSON.stringify({ workoutName, exercises: stack }));
     }
  }, [workoutName, stack, isClient]);

  // Global Keyboard listener for extreme speed (Shift+Enter brings focus to search, etc)
  useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && e.shiftKey) {
           e.preventDefault();
           document.getElementById('search-exercise-input')?.focus();
        }
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, pointerSensorOptions),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const allExercises = useLiveQuery(() => db.exercises.toArray()) || [];
  
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return allExercises
      .filter(ex => (ex.name || '').toLowerCase().includes(term) || (ex.body_part || '').toLowerCase().includes(term))
      .slice(0, 15);
  }, [allExercises, searchTerm]);

  const { totalSets, estimatedMins } = useMemo(() => {
    let setsCount = 0;
    let seconds = 0;
    stack.forEach(e => {
        setsCount += e.sets;
        seconds += (Number(e.sets) || 0) * 40 + (Number(e.sets) || 0) * (Number(e.restTime) || 0); // 40s per set execution time estimation
    });
    return {
       totalSets: Number(setsCount) || 0,
       estimatedMins: Math.round((seconds || 0) / 60)
    };
  }, [stack]);

  const handleDragStart = () => { triggerVibration(); };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      triggerVibration();
      const activeIndex = stack.findIndex(i => i.draftId === active.id);
      const overIndex = stack.findIndex(i => i.draftId === over.id);
      reorderExercises(activeIndex, overIndex);
    }
  };

  const saveWorkout = async (assignedDate?: string) => {
    if (!workoutName.trim() || stack.length === 0) {
      alert('Name the template and add exercises first.');
      return;
    }

    try {
      const workoutId = await db.workouts.add({
        name: workoutName.trim(),
        type: 'custom'
      });

      const exercisesToSave = stack.map((item, index) => ({
        workoutId: workoutId as number,
        exerciseId: item.exerciseId,
        sets: item.sets,
        targetReps: item.targetReps,
        restTime: item.restTime,
        order: index + 1
      }));
      await db.workoutExercises.bulkAdd(exercisesToSave);
      
      if (assignedDate) {
         // Advanced Assignment UI integration point
         await db.assignedWorkouts.add({
             userId: 'test_user',
             workoutId: workoutId as number,
             assignedBy: 'Coach JD',
             dateScheduled: assignedDate,
             status: 'pending',
             syncStatus: 'local',
             priority: 1
         });
      }

      clearDraft();
      localStorage.removeItem('supafast_draft');
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('Save failed.');
    }
  };

  if (!isClient) return null; // Prevent hydration errors

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      
      {/* Top Header & Coach HUD */}
      <header className="bg-white border-b border-gray-100 items-center justify-between sticky top-0 z-40 shadow-sm shrink-0 flex flex-col pt-2 transition-all">
        <div className="w-full max-w-3xl flex justify-between px-4 pb-2 items-center">
           <h2 className="text-sm font-black text-gray-400 tracking-wider uppercase">Coach Builder</h2>
           <Button variant="ghost" size="sm" onClick={() => setIsPreviewMode(!isPreviewMode)} className={isPreviewMode ? 'bg-orange-100 text-orange-600' : 'text-gray-400'}>
              {isPreviewMode ? <LucideEyeOff className="w-4 h-4 mr-2" /> : <LucideEye className="w-4 h-4 mr-2" />}
              {isPreviewMode ? 'Exit Preview' : 'Preview'}
           </Button>
        </div>

        <div className="w-full max-w-3xl p-4 pt-0 flex flex-col gap-3">
           {!isPreviewMode ? (
              <Input 
                 placeholder="Name this Template (e.g., Elite Chest Day)" 
                 value={workoutName}
                 onChange={e => setWorkoutName(e.target.value)}
                 className="font-black text-xl h-14 bg-gray-50/50 border-gray-100 focus:border-blue-500 focus:bg-white transition-all shadow-inner"
              />
           ) : (
              <h1 className="text-3xl font-black">{workoutName || 'Unnamed Workout'}</h1>
           )}
           
           {/* Live Preview Bar */}
           {stack.length > 0 && (
             <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-gray-400 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 shrink-0">
               <div>
                  <span className="text-blue-600 block text-lg font-black tracking-tighter leading-none">{stack.length}</span> Exercises
               </div>
               <div>
                  <span className="text-gray-900 block text-lg font-black tracking-tighter leading-none">{totalSets}</span> Total Sets
               </div>
               <div>
                  <span className="text-orange-500 block text-lg font-black tracking-tighter leading-none">~{estimatedMins}m</span> Duration
               </div>
             </div>
           )}
        </div>
      </header>

      <main className="flex-1 overflow-visible relative">
         <div className="max-w-3xl mx-auto w-full p-4 flex flex-col gap-6">

            {/* Instant Search Bar */}
            {!isPreviewMode && (
               <section className="relative z-30 flex gap-2">
                  <div className="relative shadow-lg shadow-gray-200/50 rounded-2xl group flex-1">
                    <LucideSearch className="w-5 h-5 absolute left-4 top-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
                    <Input 
                      id="search-exercise-input"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Search 1,300+ exercises instantly... (Shift+Enter)"
                      className="pl-12 h-14 font-semibold border-none text-md bg-white w-full rounded-2xl text-gray-900"
                    />
                  </div>
                  <Button variant="outline" className="h-14 bg-white border-transparent shadow-lg shadow-gray-200/50 rounded-2xl text-gray-600 font-bold px-4 shrink-0 transition-all hover:border-gray-200 hover:text-blue-600" onClick={() => addSection('New Block')}>
                     + Section
                  </Button>

                  {/* Absolute Floating Results */}
                  {searchResults.length > 0 && (
                    <div className="absolute top-16 left-0 right-0 bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/10 z-50 divide-y divide-gray-50 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                      {searchResults.map(ex => (
                        <div key={ex.id} className="flex justify-between items-center p-3 hover:bg-blue-50 group cursor-pointer" 
                             onClick={() => { triggerVibration(); addExercise(ex); setSearchTerm(''); }}>
                          <div className="pl-2">
                            <p className="font-bold text-gray-900 capitalize group-hover:text-blue-700 transition-colors">{ex.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{ex.body_part}</p>
                          </div>
                          <Button variant="ghost" className="h-10 w-10 p-0 text-blue-600 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                            <LucidePlus className="w-5 h-5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
               </section>
            )}

            {/* Sortable Workflow Area */}
            <section className="relative z-0">
               {stack.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center mt-4">
                     <LucideSearch className="w-10 h-10 text-gray-200 mb-4" />
                     <p className="font-bold text-gray-400">Your template is empty</p>
                     <p className="text-sm text-gray-400 mt-1">Search an exercise to deploy Smart Defaults automatically.</p>
                  </div>
               ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                     <SortableContext items={stack.map(i => i.draftId)} strategy={verticalListSortingStrategy}>
                        <div className={`flex flex-col gap-3 ${isPreviewMode ? 'gap-0 border border-gray-100 rounded-2xl overflow-hidden shadow-sm' : ''}`}>
                           {stack.map((item, index) => (
                              <SortableExerciseRow key={item.draftId} item={item} index={index} stackLength={stack.length} isPreviewMode={isPreviewMode} />
                           ))}
                        </div>
                     </SortableContext>
                  </DndContext>
               )}
            </section>
            
            <div className="h-40"></div>
         </div>
      </main>

      {/* Instant Action Dock */}
      {stack.length > 0 && !isPreviewMode && (
         <div className="fixed bottom-20 left-0 right-0 p-4 z-40 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-12">
            <div className="max-w-3xl mx-auto flex flex-col gap-2">
               <div className="flex justify-between items-center px-2">
                  <span className="text-xs font-bold text-gray-400 flex items-center gap-1 uppercase tracking-wider">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Auto-Saving
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearDraft} className="text-red-400 hover:bg-red-50 text-xs font-bold">Clear Draft</Button>
               </div>
               <div className="flex gap-3 shadow-2xl shadow-blue-900/10 rounded-2xl bg-white p-2 border border-gray-100">
                  <Button variant="outline" className="flex-1 h-14 rounded-xl font-bold bg-gray-50 border-gray-100 hover:border-gray-300 hover:bg-white text-gray-600" onClick={() => saveWorkout()}>
                     <LucideSave className="w-5 h-5 mr-2" />
                     Save Only
                  </Button>
                  <Button className="flex-1 h-14 rounded-xl font-black bg-blue-600 hover:bg-blue-700 tracking-wider text-md uppercase" onClick={() => setShowAssignModal(true)}>
                     <LucideUserPlus className="w-5 h-5 mr-2" />
                     Assign ...
                  </Button>
               </div>
            </div>
         </div>
      )}

      {/* Advanced Assignment Overlay */}
      {showAssignModal && (
         <div className="fixed inset-0 z-50 bg-gray-900/60 flex items-end justify-center sm:items-center p-4" onClick={() => setShowAssignModal(false)}>
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center bg-blue-50 -mx-6 -mt-6 p-6 pb-6 mb-2 border-b border-blue-100">
                 <div>
                    <h3 className="font-black text-2xl tracking-tighter text-blue-900">Schedule Block</h3>
                    <p className="text-sm text-blue-600 font-bold">{workoutName || 'Draft Workout'}</p>
                 </div>
               </div>
               
               <p className="font-bold text-gray-500 uppercase tracking-widest text-xs mt-2">Quick Select</p>
               <div className="grid grid-cols-2 gap-3">
                  <Button className="h-16 rounded-xl font-bold text-md bg-blue-600 hover:bg-blue-700" onClick={() => { triggerVibration(); saveWorkout(new Date().toISOString().split('T')[0]); }}>Today</Button>
                  <Button className="h-16 rounded-xl font-bold text-md bg-white border border-gray-200 text-gray-900 hover:bg-gray-50" onClick={() => { 
                     triggerVibration(); 
                     const d = new Date(); d.setDate(d.getDate() + 1); 
                     saveWorkout(d.toISOString().split('T')[0]); 
                  }}>Tomorrow</Button>
               </div>
               
               <div className="flex flex-col gap-2 mt-4">
                  <label className="font-bold text-gray-500 uppercase tracking-widest text-xs">Custom Date</label>
                  <Input type="date" className="h-14 font-black tracking-widest border-gray-200 rounded-xl ui-date-picker" onChange={(e) => {
                     if (e.target.value) { triggerVibration(); saveWorkout(e.target.value); }
                  }} />
               </div>

               <Button variant="ghost" className="mt-4 font-bold text-gray-400 uppercase tracking-wider h-12" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            </div>
         </div>
      )}
    </div>
  );
}
