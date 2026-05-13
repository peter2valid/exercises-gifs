'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Building2, UserPlus, AlertCircle, Loader2, Check } from 'lucide-react';

const ROLE_LABEL: Record<string, string> = {
  gym_admin: 'Gym Admin',
  trainer:   'Trainer',
  member:    'Member',
};

interface Props {
  token: string;
  gymName?: string;
  email?: string;
  role?: string;
  isLoggedIn: boolean;
  error?: string;
}

export function JoinClient({ token, gymName, email, role, isLoggedIn, error }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleAccept = async () => {
    if (loading) return;
    setLoading(true);
    setApiError(null);

    try {
      const res = await fetch(`/api/invite/${token}/accept`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to accept invitation');
      setDone(true);
      setTimeout(() => router.push(data.redirectTo ?? '/home'), 1200);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-bg min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-[22px] bg-white text-black flex items-center justify-center shadow-[0_20px_50px_rgba(255,255,255,0.15)] mb-4">
            <Zap size={32} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">GymApp</h1>
        </div>

        <div className="glass-panel p-6 shadow-2xl border-white/10">
          {error ? (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                <AlertCircle size={22} className="text-red-400" />
              </div>
              <p className="text-sm text-white/60">{error}</p>
              <button
                onClick={() => router.push('/home')}
                className="w-full h-11 bg-white/5 border border-white/10 text-white font-medium rounded-xl"
              >
                Go to app
              </button>
            </div>
          ) : done ? (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Check size={22} className="text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-white">You&apos;ve joined {gymName}!</p>
              <p className="text-xs text-white/40">Redirecting…</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Building2 size={18} className="text-white/70" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{gymName}</p>
                  <p className="text-xs text-white/40">Gym invitation</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/8 rounded-xl p-4 mb-5 space-y-2">
                <Row label="Role" value={ROLE_LABEL[role ?? ''] ?? role ?? '—'} />
                <Row label="Invited email" value={email ?? '—'} />
              </div>

              {apiError && <p className="text-rose-400 text-xs px-1 mb-3">{apiError}</p>}

              {isLoggedIn ? (
                <button
                  onClick={handleAccept}
                  disabled={loading}
                  className="w-full h-12 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <><UserPlus size={16} /> Accept invitation</>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-white/40 text-center mb-3">
                    Sign in to accept this invitation
                  </p>
                  <button
                    onClick={() => router.push(`/auth?next=/join/${token}`)}
                    className="w-full h-12 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2"
                  >
                    Sign in or create account
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-xs font-medium text-white/80">{value}</span>
    </div>
  );
}
