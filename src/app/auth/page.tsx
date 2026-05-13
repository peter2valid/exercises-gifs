'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { Zap, Mail, Lock, Loader2, Smartphone } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Wait for session to be acknowledged by browser/cookies before redirecting
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/home');
        }
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { full_name: '', avatar_url: '' } // Preparing metadata for profile
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

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      setNotice('Check your phone for the login code!');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'apple' | 'facebook') => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
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
          <h1 className="text-3xl font-bold text-white tracking-tight">GymApp</h1>
          <p className="text-white/40 text-sm mt-1">Distributed Sync Engine</p>
        </div>

        {/* Gym registration CTA */}
        <div className="text-center mb-4">
          <a
            href="/onboarding"
            className="text-xs text-white/40 hover:text-white/70 transition-colors underline underline-offset-2"
          >
            Opening a gym? Register here →
          </a>
        </div>

        {notice && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-300 text-center">
            {notice}
          </div>
        )}

        {/* Auth Card */}
        <div className="glass-panel p-6 shadow-2xl border-white/10">
          
          {!authMethod ? (
            <div className="space-y-3">
              {/* The "Best" Providers */}
              <Button 
                onClick={() => handleSocialAuth('apple')}
                variant="secondary" 
                className="w-full h-12 bg-white text-black hover:bg-gray-200 border-none font-semibold flex items-center justify-center gap-2"
                disabled={loading}
              >
                <svg viewBox="0 0 384 512" width="18" height="18" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 24 184.5 15.6 233.9 2.6 308.8 28.7 391.2 59.5 432.2c16 22 36.8 45.4 60.1 44.4 22.3-.9 31.9-14.7 58.7-14.7 26.6 0 35.7 14.7 59.3 14.3 24.3-.5 41.9-21.7 57.6-43.8 19-27.8 26.8-54.8 27.2-56.1-.5-.2-43.5-16.7-43.7-107.6zM228.6 96.1c13.1-15.8 21.9-38 19.5-60.1-18.7 1.1-41.6 13.5-55.5 29.8-11.7 13.8-21.8 36.5-18.9 58.2 21.2 1.9 41.8-12 54.9-27.9z"/></svg>
                Continue with Apple
              </Button>
              <Button 
                onClick={() => handleSocialAuth('google')}
                variant="secondary" 
                className="w-full h-12 bg-white/10 hover:bg-white/20 border border-white/10 font-semibold flex items-center justify-center gap-2"
                disabled={loading}
              >
                <svg viewBox="0 0 488 512" width="18" height="18" fill="currentColor"><path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/></svg>
                Continue with Google
              </Button>

              <div className="relative my-4 flex items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-white/30 text-[10px] uppercase tracking-wider font-bold">OR</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <Button 
                onClick={() => setAuthMethod('email')}
                variant="secondary" 
                className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center gap-2"
              >
                <Mail size={18} />
                Continue with Email
              </Button>

              <Button 
                onClick={() => setAuthMethod('phone')}
                variant="secondary" 
                className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center gap-2"
              >
                <Smartphone size={18} />
                Continue with Phone
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <button 
                onClick={() => { setAuthMethod(null); setError(null); }}
                className="text-white/40 text-xs mb-2 flex items-center gap-1 hover:text-white transition-colors"
              >
                ← Back to all options
              </button>

              {authMethod === 'email' && (
                <form onSubmit={handleEmailAuth} className="space-y-4">
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

                  {error && <p className="text-rose-400 text-xs px-1">{error}</p>}

                  <Button type="submit" className="w-full h-12 mt-2" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" size={20} /> : mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </Button>

                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                      className="text-xs text-white/40 hover:text-white transition-colors"
                    >
                      {mode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                  </div>
                </form>
              )}

              {authMethod === 'phone' && (
                <form onSubmit={handlePhoneAuth} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Phone Number</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1234567890"
                        className="w-full h-12 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-white text-sm outline-none focus:border-white/20 transition-all"
                        required
                      />
                    </div>
                  </div>

                  {error && <p className="text-rose-400 text-xs px-1">{error}</p>}

                  <Button type="submit" className="w-full h-12 mt-2" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Login Code'}
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
