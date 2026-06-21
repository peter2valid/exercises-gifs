'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, Dumbbell, ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    if (next && next.startsWith('/')) setNextPath(next);
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // Help Google-OAuth users who try email/password
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            throw new Error('Incorrect email or password. If you signed up with Google, use "Continue with Google" instead.');
          }
          throw error;
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (session) router.replace(nextPath ?? '/home');
      } else {
        const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
        if (nextPath) callbackUrl.searchParams.set('next', nextPath);
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callbackUrl.toString(),
            data: { full_name: '', avatar_url: '' },
          }
        });
        if (error) throw error;
        setNotice('Check your email for the confirmation link!');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/home`,
      });
      if (error) throw error;
      setNotice('Password reset email sent! Check your inbox.');
      setMode('signin');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
      if (nextPath) callbackUrl.searchParams.set('next', nextPath);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl.toString() },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-bg min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[340px]">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-[0_8px_32px_rgba(255,255,255,0.12)] mb-3">
            <Dumbbell size={22} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">GymApp</h1>
          <p className="text-white/35 text-xs mt-0.5">Track your progress, anywhere.</p>
        </div>

        {notice && (
          <div className="mb-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 text-center">
            {notice}
          </div>
        )}

        {/* Auth Card */}
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.07) inset, 0 12px 40px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(24px)',
          }}
        >
          {mode === 'reset' ? (
            /* ── Forgot password view ── */
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null); }}
                  className="text-white/30 hover:text-white/70 transition-colors"
                >
                  <ArrowLeft size={15} />
                </button>
                <p className="text-sm font-semibold text-white">Reset password</p>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed">
                Enter your email and we&apos;ll send a reset link. Works for Google accounts too — you can set a password after clicking the link.
              </p>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full h-10 bg-white/5 border border-white/8 rounded-xl pl-9 pr-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/20 focus:bg-white/7 transition-all"
                  required
                  autoFocus
                />
              </div>

              {error && <p className="text-rose-400 text-xs px-0.5">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-xl bg-white text-black text-sm font-semibold flex items-center justify-center transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Send reset link'}
              </button>
            </form>
          ) : (
            /* ── Sign in / Sign up view ── */
            <>
              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full h-10 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 text-white text-sm font-medium flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <svg viewBox="0 0 48 48" width="16" height="16">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-grow border-t border-white/8"></div>
                <span className="text-white/20 text-[10px] uppercase tracking-widest font-semibold">or</span>
                <div className="flex-grow border-t border-white/8"></div>
              </div>

              {/* Email form */}
              <form onSubmit={handleEmailAuth} className="space-y-2.5">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full h-10 bg-white/5 border border-white/8 rounded-xl pl-9 pr-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/20 focus:bg-white/7 transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full h-10 bg-white/5 border border-white/8 rounded-xl pl-9 pr-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/20 focus:bg-white/7 transition-all"
                      required
                    />
                  </div>
                  {mode === 'signin' && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => { setMode('reset'); setError(null); }}
                        className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>

                {error && <p className="text-rose-400 text-xs px-0.5">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-xl bg-white text-black text-sm font-semibold flex items-center justify-center transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50 mt-1"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : mode === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              </form>

              <div className="flex items-center justify-between pt-0.5">
                <button
                  type="button"
                  onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
                  className="text-[11px] text-white/35 hover:text-white/70 transition-colors"
                >
                  {mode === 'signin' ? 'New here? Sign up' : 'Have an account? Sign in'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setNextPath('/onboarding');
                    window.history.replaceState({}, '', '/auth?next=/onboarding');
                  }}
                  className="text-[11px] text-white/35 hover:text-white/70 transition-colors"
                >
                  Own a gym?
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-[10px] text-white/20 text-center mt-4 leading-relaxed">
          By continuing you agree to our{' '}
          <a href="/terms" className="underline underline-offset-2 hover:text-white/40 transition-colors">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="underline underline-offset-2 hover:text-white/40 transition-colors">Privacy Policy</a>.
        </p>

      </div>
    </div>
  );
}
