'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building2, MapPin, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface Gym {
  id: string;
  name: string;
  slug: string;
  type: string | null;
  location: string | null;
}

export function JoinSearchClient() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Gym[]>([]);
  const [searching, setSearching] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(`/api/public/gyms/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.gyms || []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleJoin = async (gym: Gym) => {
    if (joiningId) return;
    setJoiningId(gym.id);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/gym/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId: gym.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to join');
      
      setSuccess(gym.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="dashboard-bg min-h-screen pt-12 pb-24">
      <div className="max-w-md mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Join a Gym</h1>
          <p className="text-sm text-white/40 mt-1">Search for your gym to request membership</p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or location..."
            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white outline-none focus:border-white/20 transition-all"
            autoFocus
          />
        </div>

        {success ? (
          <div className="glass-panel p-6 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={24} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Request Sent!</h3>
            <p className="text-sm text-white/60 mb-6">
              Your request to join <strong>{success}</strong> has been sent to the gym admins for approval.
            </p>
            <button
              onClick={() => router.push('/home')}
              className="w-full h-12 bg-white text-black font-bold rounded-xl"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-200">{error}</p>
              </div>
            )}

            {searching && (
              <div className="py-8 flex flex-col items-center gap-3">
                <Loader2 size={24} className="text-white/20 animate-spin" />
                <p className="text-xs text-white/20">Searching gyms...</p>
              </div>
            )}

            {!searching && results.map(gym => (
              <div key={gym.id} className="glass-panel p-4 flex items-center justify-between animate-slide-up">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Building2 size={18} className="text-white/40" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{gym.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {gym.type && <span className="text-[10px] text-white/30 uppercase tracking-wider">{gym.type}</span>}
                      {gym.type && gym.location && <span className="text-white/10">·</span>}
                      {gym.location && (
                        <div className="flex items-center gap-1 text-[10px] text-white/30 uppercase tracking-wider">
                          <MapPin size={10} />
                          {gym.location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleJoin(gym)}
                  disabled={!!joiningId}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  {joiningId === gym.id ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={18} />}
                </button>
              </div>
            ))}

            {query.length >= 2 && !searching && results.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-white/20">No gyms found matching &quot;{query}&quot;</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
