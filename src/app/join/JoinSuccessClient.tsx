'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Dumbbell, Clock } from 'lucide-react';

const PENDING_GYM_KEY = 'gymapp:pendingGymJoin';

interface Props {
  gymName: string;
  alreadyMember: boolean;
}

export function JoinSuccessClient({ gymName, alreadyMember }: Props) {
  const router = useRouter();

  useEffect(() => {
    try { localStorage.removeItem(PENDING_GYM_KEY); } catch {}
    const t = setTimeout(() => router.replace('/home'), 3000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="dashboard-bg min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[340px]">

        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-[0_8px_32px_rgba(255,255,255,0.12)] mb-3">
            <Dumbbell size={22} />
          </div>
          <p className="text-white/35 text-xs">GymApp</p>
        </div>

        <div
          className="rounded-2xl p-6 text-center space-y-5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.07) inset, 0 12px 40px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(24px)',
          }}
        >
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto">
            <Check size={26} className="text-emerald-400" strokeWidth={2.5} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              {alreadyMember ? 'Welcome back!' : 'You\'re in!'}
            </h2>
            <p className="text-[13px] text-white/50 mt-1.5 leading-relaxed">
              {alreadyMember
                ? `You're already a member of ${gymName}.`
                : `You've joined ${gymName}. The gym admin will confirm your membership shortly.`}
            </p>
          </div>

          {!alreadyMember && (
            <div
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <Clock size={13} className="text-white/30 shrink-0" />
              <p className="text-[11px] text-white/30 leading-snug">
                Pending approval — you&apos;ll get access once the gym confirms you.
              </p>
            </div>
          )}

          <p className="text-[11px] text-white/20">Taking you home…</p>
        </div>

      </div>
    </div>
  );
}
