'use client';

import { memo, useState } from 'react';
import Image from 'next/image';

interface ExerciseHeroProps {
  alt: string;
  exerciseId: string;
}

/**
 * ExerciseHero Component
 * 
 * Design Constraints:
 * - Edge-to-edge cinematic media
 * - Grayscale aesthetic with subtle ambient vignette
 * - Material depth via minimal glass reflection
 */
export const ExerciseHero = memo(function ExerciseHero({ 
  alt, 
  exerciseId 
}: ExerciseHeroProps) {
  const [failed, setFailed] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const posterSrc = `/exercise-posters/${exerciseId}.jpg`;
  const videoSrc = `/exercise-media/${exerciseId}.mp4`;

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* ── Grayscale Media Layer ────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <Image
          src={posterSrc}
          alt={`${alt} poster`}
          fill
          className="object-cover grayscale brightness-90"
          sizes="100vw"
          priority={true}
          onError={() => setFailed(true)}
        />
        
        {!failed && (
          <video
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setFailed(true)}
            className={`absolute inset-0 w-full h-full object-cover grayscale brightness-90 transition-opacity duration-1000 ease-in-out ${
              videoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>

      {/* ── Cinematic Lighting Layers ────────────────────────────────────── */}
      {/* Heavy bottom vignette to ground the identity block */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent" />
      
      {/* Material Depth: Minimal top glass reflection */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />
      </div>
    </div>
  );
});
