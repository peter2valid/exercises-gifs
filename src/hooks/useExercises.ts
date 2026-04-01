import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { db } from '@/lib/db/dexie';
import { useLiveQuery } from 'dexie-react-hooks';

export function useExercises(search: string = '', bodyPart: string = 'all') {
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 1. Read from IndexedDB instantly (Local-First)
  const localExercises = useLiveQuery(() => db.exercises.toArray()) || [];

  // 2. Sync in background
  useEffect(() => {
    async function syncExercises() {
      const count = await db.exercises.count();
      // Sync if local DB is empty
      if (count === 0) {
        setIsSyncing(true);
        try {
          // Silent background fetch
          const { data: remoteData, error } = await supabase
            .from('exercises')
            .select('*');
            
          if (error) throw error;
          
          if (remoteData && remoteData.length > 0) {
            // Update local DB. useLiveQuery will instantly update the UI.
            await db.exercises.bulkPut(remoteData);
          }
        } catch (error) {
          console.error('Failed to sync exercises in background:', error);
        } finally {
          setIsSyncing(false);
        }
      }
    }
    
    syncExercises();
  }, []);

  // Filter logic (Runs instantly on local data without lag)
  const filtered = localExercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesBodyPart = bodyPart === 'all' || ex.body_part === bodyPart;
    return matchesSearch && matchesBodyPart;
  });

  return { 
    exercises: filtered, 
    // Only block UI if we literally have no data to show
    isLoading: isSyncing && localExercises.length === 0,
    isSyncing
  };
}