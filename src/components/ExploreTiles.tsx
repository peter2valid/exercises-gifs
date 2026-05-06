import Image from 'next/image';
import { type GroupTile } from '@/lib/explore/constants';
import { ExerciseThumbnail } from './ExerciseCard';

export function CompactTile({
  group,
  active,
  onClick,
}: {
  group: GroupTile;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-20 shrink-0 flex-col items-center gap-2 rounded-2xl border px-2 py-2 text-center transition-all ${
        active ? 'border-white/25 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]' : 'border-white/5 bg-white/[0.03]'
      }`}
    >
      <div className="relative h-12 w-full overflow-hidden rounded-xl bg-black/20">
        {group.iconSrc ? (
          <Image src={group.iconSrc} alt={group.label} fill unoptimized className="object-contain p-1.5" sizes="80px" />
        ) : (
          <ExerciseThumbnail alt={group.label} exerciseId={group.exerciseId} />
        )}
      </div>
      <span className="text-[11px] font-medium leading-tight text-white/80">{group.label}</span>
    </button>
  );
}

export function MuscleTile({
  group,
  active,
  count,
  onClick,
}: {
  group: GroupTile;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`glass-panel overflow-hidden text-left transition-transform hover:scale-[1.01] ${active ? 'ring-1 ring-white/30' : ''}`}
    >
      <div className={`relative aspect-[0.95] bg-gradient-to-br ${group.accent} overflow-hidden`}>
        <div className="absolute left-3 top-3 rounded-full bg-black/20 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/70 backdrop-blur-sm">
          {count}
        </div>
        {group.iconSrc ? (
          <Image src={group.iconSrc} alt={group.label} fill unoptimized className="object-contain p-2" sizes="33vw" />
        ) : (
          <ExerciseThumbnail alt={group.label} exerciseId={group.exerciseId} />
        )}
      </div>
      <div className="border-t border-white/10 px-3 py-3">
        <p className="text-center text-sm font-semibold text-white">{group.label}</p>
      </div>
    </button>
  );
}
