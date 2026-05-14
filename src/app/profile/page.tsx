'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { User as UserIcon, LogOut, Settings, Loader2, X, Scale, Bell, ShieldCheck, Camera, Phone, User as UserCircle, ChevronRight, QrCode } from 'lucide-react';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEntitlementStore } from '@/store/entitlementStore';
import { type WeightUnit } from '@/lib/settings';

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  
  const { gymPlan, hasMemberPremium } = useEntitlementStore();
  const currentPlanLabel = hasMemberPremium ? 'Plus' : (gymPlan ? gymPlan.toUpperCase() : 'Free');

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Editable fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    const savedUnit = localStorage.getItem('weightUnit') as WeightUnit | null;
    if (savedUnit === 'kg' || savedUnit === 'lbs') setWeightUnit(savedUnit);
    setSoundEnabled(localStorage.getItem('restTimerSound') !== 'off');
  }, []);

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      setUser(session.user);

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || '');
        setPhoneNumber(profileData.phone_number || '');
      }
      
      setLoading(false);
    }
    loadData();
  }, [router]);

  const handleUpdateProfile = async () => {
    setUpdating(true);
    setSaveStatus('idle');
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          phone_number: phoneNumber,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      setSaveErrorMsg(err.message ?? 'Failed to save');
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  };

  const handleWeightUnit = (unit: WeightUnit) => {
    setWeightUnit(unit);
    localStorage.setItem('weightUnit', unit);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('restTimerSound', next ? 'on' : 'off');
  };

  if (loading) {
    return (
      <div className="dashboard-bg min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-white/20" size={32} />
      </div>
    );
  }

  return (
    <div className="dashboard-bg min-h-screen pb-24 pt-8">
      <div className="max-w-md mx-auto px-4">
        <div className="mb-8 animate-fade-in flex justify-between items-end gap-4">
          <div>
            <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium mb-2">Profile</p>
            <h1 className="text-3xl font-bold text-white tracking-tight">You</h1>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="text-xs font-bold uppercase tracking-widest text-sky-400 hover:text-sky-300 transition-colors"
          >
            Edit Settings
          </button>
        </div>

        {paymentStatus && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 animate-slide-up ${
            paymentStatus === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              paymentStatus === 'success' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
            }`}>
              {paymentStatus === 'success' ? <ShieldCheck size={16} /> : <X size={16} />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold tracking-tight">
                {paymentStatus === 'success' ? 'Payment Successful' : 'Payment Failed'}
              </p>
            </div>
            <button onClick={() => router.replace('/profile')} className="p-1 opacity-40 hover:opacity-100 transition-opacity">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="text-center mb-10 animate-slide-up">
          <div className="relative w-24 h-24 mx-auto mb-4">
            {profile?.avatar_url ? (
              <Image 
                src={profile.avatar_url} 
                alt="Avatar" 
                width={96}
                height={96}
                className="w-full h-full rounded-full object-cover border-2 border-white/10" 
              />
            ) : (
              <div className="w-full h-full rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <UserIcon size={36} className="text-white/20" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-sky-500 border-4 border-[#090909] flex items-center justify-center text-white cursor-pointer">
              <Camera size={14} />
              <input type="file" accept="image/*" className="sr-only" onChange={() => {}} />
            </label>
          </div>
          
          <div className="space-y-3 px-2">
            <div className="glass-panel p-4 text-left space-y-1">
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/25 font-bold">Name</p>
              <p className="text-sm font-semibold text-white">{profile?.full_name || 'Add your name in Settings'}</p>
            </div>
            <div className="glass-panel p-4 text-left space-y-1">
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/25 font-bold">Phone number</p>
              <p className="text-sm font-semibold text-white/70">{profile?.phone_number || 'Not added'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/subscription"
            className="w-full glass-panel p-4 flex items-center justify-between hover:bg-white/10 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                <ShieldCheck size={20} className="text-sky-400" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold text-white">Subscription</span>
                <span className="block text-[10px] text-white/30 uppercase tracking-wider">Manage your plan</span>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-tighter ${
              hasMemberPremium 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-white/5 border-white/10 text-white/40'
            }`}>
              {currentPlanLabel}
            </div>
          </Link>

          <Link
            href="/my-qr"
            className="w-full glass-panel p-4 flex items-center justify-between hover:bg-white/10 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <QrCode size={20} className="text-white/40" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold text-white">My Check-in Code</span>
                <span className="block text-[10px] text-white/30 uppercase tracking-wider">Show at gym entrance</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-white/20 group-hover:text-white/50 transition-colors" />
          </Link>

          <button
            onClick={() => setShowSettings(true)}
            className="w-full glass-panel p-4 flex items-center gap-3 hover:bg-white/10 transition-all active:scale-[0.98]"
          >
            <Settings size={20} className="text-white/40" />
            <span className="text-sm font-medium text-white">Settings</span>
          </button>
          <button
            onClick={handleSignOut}
            className="w-full glass-panel p-4 flex items-center gap-3 hover:bg-rose-500/10 transition-all group active:scale-[0.98]"
          >
            <LogOut size={20} className="text-white/40 group-hover:text-rose-400 transition-colors" />
            <span className="text-sm font-medium text-white group-hover:text-rose-400 transition-colors">Sign Out</span>
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
        <div
          className="relative bg-[#111] rounded-t-3xl px-6 pt-6 pb-10 space-y-6 animate-slide-up"
          style={{ maxHeight: 'calc(100vh - (var(--bottom-nav-height,76px) + env(safe-area-inset-bottom) + 24px))', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-colors"
                aria-label="Close settings"
              >
                <X size={18} />
              </button>
            </div>

            <div className="glass-panel p-5 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <UserCircle size={16} className="text-white/40" />
                <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] font-bold">Profile</p>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <UserCircle className="absolute left-0 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full bg-transparent border-b border-white/5 py-2 pl-7 text-white text-base font-semibold focus:border-sky-500 outline-none transition-colors placeholder:text-white/10"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-0 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="Phone number"
                    className="w-full bg-transparent border-b border-white/5 py-2 pl-7 text-white/70 text-sm focus:border-sky-500 outline-none transition-colors placeholder:text-white/10"
                  />
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Scale size={16} className="text-white/40" />
                <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] font-bold">Weight Unit</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['kg', 'lbs'] as WeightUnit[]).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => handleWeightUnit(unit)}
                    className={`py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.97] ${
                      weightUnit === unit
                        ? 'bg-white text-black shadow-lg'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {unit.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={toggleSound}
              className="w-full glass-panel p-5 flex items-center gap-3 text-left transition-colors hover:bg-white/5 active:scale-[0.98]"
            >
              <Bell size={16} className={soundEnabled ? 'text-emerald-400' : 'text-white/25'} />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Rest Timer Sound</p>
                <p className="text-xs text-white/30 mt-0.5">
                  {soundEnabled ? 'Beep plays when rest ends' : 'Sound is off'}
                </p>
              </div>
              <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${soundEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${soundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </button>

            {saveStatus === 'saved' && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                Saved.
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {saveErrorMsg}
              </div>
            )}

            <button
              onClick={handleUpdateProfile}
              disabled={updating}
              className="w-full rounded-2xl bg-sky-500 text-black py-3.5 text-sm font-bold uppercase tracking-[0.16em] disabled:opacity-50"
            >
              {updating ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
