'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface GymContextType {
  gymId: string | null;
  gymName: string;
  isLoading: boolean;
}

const GymContext = createContext<GymContextType | undefined>(undefined);

export function GymProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [gymId, setGymId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const gym = searchParams.get('gym');
    setGymId(gym);
    setIsLoading(false);
  }, [searchParams]);

  const gymName = gymId
    ? gymId
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'All Locations';

  return (
    <GymContext.Provider value={{ gymId, gymName, isLoading }}>
      {children}
    </GymContext.Provider>
  );
}

export function useGym() {
  const context = useContext(GymContext);
  if (context === undefined) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
}
