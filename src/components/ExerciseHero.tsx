'use client';

import { memo, useState } from 'react';
import Image from 'next/image';

interface ExerciseHeroProps {
  alt: string;
  exerciseId: string;
}

export const ExerciseHero = memo(function ExerciseHero({ 
  alt, 
  exerciseId 
}: ExerciseHeroProps) {
  const [failed, setFailed] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const posterSrc = `/exercise-posters/${exerciseId}.jpg`;
  const videoSrc = `/exercise-media/${exerciseId}.mp4`;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Grayscale Media with subtle grain */}
      <div className="absolute inset-0 z-0">
        <Image
          src={posterSrc}
          alt={`${alt} poster`}
          fill
          className="object-cover grayscale"
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
            className={`absolute inset-0 w-full h-full object-cover grayscale transition-opacity duration-700 ease-in-out ${
              videoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>

      {/* Ambient Vignette */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0b] via-transparent to-transparent opacity-80" />
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
      
      {/* Subtle Depth / Glass Reflection Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />
        <div className="absolute inset-0 bg-white/[0.01]" />
      </div>
    </div>
  );
});
