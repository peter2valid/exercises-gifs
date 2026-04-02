'use client';

import { useSearchParams } from 'next/navigation';

export function useGymParam() {
  const searchParams = useSearchParams();
  const gymId = searchParams.get('gym');

  const buildGymUrl = (href: string) => {
    if (!gymId) return href;
    const separator = href.includes('?') ? '&' : '?';
    return `${href}${separator}gym=${encodeURIComponent(gymId)}`;
  };

  return { gymId, buildGymUrl };
}
