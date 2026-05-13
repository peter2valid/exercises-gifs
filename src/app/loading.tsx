'use client';

export default function Loading() {
  return (
    <div className="dashboard-bg min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-white/10 border-t-white/80 rounded-full animate-spin" />
        <p className="text-xs font-medium text-white/30 uppercase tracking-[0.2em]">GymApp</p>
      </div>
    </div>
  );
}
