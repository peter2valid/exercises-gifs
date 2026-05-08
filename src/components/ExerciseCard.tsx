import { memo, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type ExerciseCardProps = {
  exercise: any;
  view?: 'list' | 'grid';
  thumbnailSrc?: string;
  muscleLabel?: string;
  detailLabel?: string;
  index?: number;
};

function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as any;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 2) return true;
  const conn = nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
  if (conn?.saveData) return true;
  if (conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') return true;
  return false;
}

export const ExerciseThumbnail = memo(function ExerciseThumbnail({
  alt,
  priority = false,
  exerciseId,
}: {
  alt: string;
  priority?: boolean;
  exerciseId: string;
}) {
  const [failed, setFailed] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [skipVideo, setSkipVideo] = useState(false);
  const [inView, setInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const posterSrc = `/exercise-posters/${exerciseId}.jpg`;
  const videoSrc = `/exercise-media/${exerciseId}.mp4`;

  // On mount: check device capability
  useEffect(() => {
    if (isLowEndDevice()) setSkipVideo(true);
  }, []);

  // IntersectionObserver: only play when card is on screen
  useEffect(() => {
    if (skipVideo) return;
    if (priority) { setInView(true); return; }
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, [priority, skipVideo]);

  // Play/pause on visibility change
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (inView) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [inView]);

  if (failed) {
    return <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5" />;
  }

  return (
    <div ref={containerRef} className="absolute inset-0">
      <Image
        src={posterSrc}
        alt={`${alt} poster`}
        fill
        className="object-contain p-2"
        sizes="(max-width: 768px) 50vw, 33vw"
        priority={priority}
        onError={() => setFailed(true)}
      />
      {!skipVideo && (
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          loop
          playsInline
          preload={priority ? 'auto' : 'none'}
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 w-full h-full object-contain p-2 transition-opacity duration-300 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {!skipVideo && !videoLoaded && !failed && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent animate-pulse" />
      )}
    </div>
  );
});

const ExerciseCard = memo(function ExerciseCard({
  exercise,
  view = 'list',
  muscleLabel,
  detailLabel,
  index = 999,
}: ExerciseCardProps) {
  const subtitle = detailLabel ?? muscleLabel ?? exercise.body_part ?? exercise.target ?? '';

  return (
    <Link href={`/explore/${exercise.id}`} className="block">
      <article className={view === 'grid' ? 'glass-panel overflow-hidden' : 'glass-panel p-3 flex items-center gap-3 hover:scale-[1.01] transition-transform'}>
        {view === 'grid' ? (
          <>
            <div className="relative h-[200px] bg-white/5 overflow-hidden">
              <ExerciseThumbnail alt={exercise.name} priority={index < 6} exerciseId={exercise.id} />
            </div>
            <div className="border-t border-white/10 p-3">
              <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2">{exercise.name}</h3>
              <p className="text-xs text-white/40 mt-1 truncate">{subtitle}</p>
            </div>
          </>
        ) : (
          <>
            <div className="relative h-14 w-14 shrink-0 rounded-xl bg-white/6 overflow-hidden border border-white/10">
              <ExerciseThumbnail alt={exercise.name} priority={index < 6} exerciseId={exercise.id} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="truncate text-sm font-medium text-white">{exercise.name}</h3>
                <ChevronRight size={16} className="text-white/30" />
              </div>
              <p className="mt-1 truncate text-xs text-white/30">{subtitle}</p>
            </div>
          </>
        )}
      </article>
    </Link>
  );
});

export default ExerciseCard;
