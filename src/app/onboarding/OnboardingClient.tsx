'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Building2, ArrowRight, Loader2, Check, Users, QrCode } from 'lucide-react';

export function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'done'>('form');
  const [gymName, setGymName] = useState('');
  const [gymType, setGymType] = useState('');
  const [gymLocation, setGymLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdGymId, setCreatedGymId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/gyms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: gymName.trim(),
          type: gymType.trim() || null,
          location: gymLocation.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create gym');
      setCreatedGymId(data.gym.id);
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
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
          <h1 className="text-3xl font-bold text-white tracking-tight">Supafast</h1>
          <p className="text-white/40 text-sm mt-1">Gym Management Platform</p>
        </div>

        {step === 'form' && (
          <div className="glass-panel p-6 shadow-2xl border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <Building2 size={18} className="text-white/70" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Register your gym</p>
                <p className="text-xs text-white/40">Takes less than a minute</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">
                  Gym Name
                </label>
                <input
                  type="text"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  placeholder="e.g. Iron Paradise Gym"
                  maxLength={80}
                  className="w-full h-12 bg-white/5 border border-white/5 rounded-xl px-4 text-white text-sm outline-none focus:border-white/20 transition-all"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">
                    Type
                  </label>
                  <select
                    value={gymType}
                    onChange={(e) => setGymType(e.target.value)}
                    className="w-full h-12 bg-white/5 border border-white/5 rounded-xl px-4 text-white text-sm outline-none focus:border-white/20 transition-all appearance-none"
                  >
                    <option value="" className="bg-black text-white/40">Select type...</option>
                    <option value="bodybuilding" className="bg-black text-white">Bodybuilding</option>
                    <option value="crossfit" className="bg-black text-white">CrossFit</option>
                    <option value="powerlifting" className="bg-black text-white">Powerlifting</option>
                    <option value="yoga" className="bg-black text-white">Yoga / Pilates</option>
                    <option value="general" className="bg-black text-white">General Fitness</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={gymLocation}
                    onChange={(e) => setGymLocation(e.target.value)}
                    placeholder="e.g. Nairobi"
                    className="w-full h-12 bg-white/5 border border-white/5 rounded-xl px-4 text-white text-sm outline-none focus:border-white/20 transition-all"
                  />
                </div>
              </div>

              {error && <p className="text-rose-400 text-xs px-1">{error}</p>}

              <button
                type="submit"
                disabled={loading || gymName.trim().length < 2}
                className="w-full h-12 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>Create my gym <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-white/30 mt-5">
              Already have a gym?{' '}
              <button
                onClick={() => router.push('/admin')}
                className="text-white/50 hover:text-white underline transition-colors"
              >
                Go to admin
              </button>
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="glass-panel p-6 shadow-2xl border-white/10">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-4">
                <Check size={22} className="text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white">
                {gymName} is live!
              </h2>
              <p className="text-sm text-white/40 mt-1">Your gym dashboard is ready.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/admin')}
                className="w-full h-12 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                Go to dashboard <ArrowRight size={16} />
              </button>
              <button
                onClick={() => router.push('/admin/staff')}
                className="w-full h-12 bg-white/5 border border-white/10 text-white font-medium rounded-xl flex items-center justify-center gap-2"
              >
                <Users size={16} className="text-white/50" /> Invite your team
              </button>
              <button
                onClick={() => router.push('/admin/packages')}
                className="w-full h-12 bg-white/5 border border-white/10 text-white font-medium rounded-xl flex items-center justify-center gap-2"
              >
                <QrCode size={16} className="text-white/50" /> Choose a plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
