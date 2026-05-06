'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { Zap, Mail, Lock, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      }
      router.push('/home');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-bg min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo/Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-[22px] bg-white text-black flex items-center justify-center shadow-[0_20px_50px_rgba(255,255,255,0.15)] mb-4">
            <Zap size={32} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Supafast</h1>
          <p className="text-white/40 text-sm mt-1">Distributed Sync Engine</p>
        </div>

        {/* Auth Card */}
        <div className="glass-panel p-6 shadow-2xl border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-12 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-white text-sm outline-none focus:border-white/20 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-white text-sm outline-none focus:border-white/20 transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-rose-400 text-xs px-1">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold mt-2"
              disabled={loading}
              variant="primary"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-xs text-white/40 hover:text-white transition-colors"
            >
              {mode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-white/20 uppercase tracking-[0.2em]">
          Phase 2D: Secure Multi-Tenant Architecture
        </p>
      </div>
    </div>
  );
}
