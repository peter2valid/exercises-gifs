'use client';

import { useState } from 'react';
import { Check, Loader2, Save } from 'lucide-react';

interface GymData {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  type: string | null;
  location: string | null;
  description: string | null;
  website: string | null;
}

interface Props {
  gym: GymData;
}

export function GymProfileForm({ gym }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: gym.name,
    address: gym.address || '',
    phone: gym.phone || '',
    type: gym.type || '',
    location: gym.location || '',
    description: gym.description || '',
    website: gym.website || '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch('/api/admin/gym', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gymId: gym.id,
          ...form
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to save');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="a-card space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-3 mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#555]">General Information</p>
          {saved && (
            <span className="flex items-center gap-1 text-[12px] text-emerald-400 animate-fade-in">
              <Check size={12} />
              All changes saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#909090]">Gym Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              required
              maxLength={80}
              className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-[13px] text-[#e8e8e8] outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] text-[#909090]">Gym Type</label>
            <select
              value={form.type}
              onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
              className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-[13px] text-[#e8e8e8] outline-none focus:border-[#3b82f6] transition-colors appearance-none"
            >
              <option value="">Select type...</option>
              <option value="bodybuilding">Bodybuilding</option>
              <option value="crossfit">CrossFit</option>
              <option value="powerlifting">Powerlifting</option>
              <option value="yoga">Yoga / Pilates</option>
              <option value="general">General Fitness</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] text-[#909090]">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-[13px] text-[#e8e8e8] outline-none focus:border-[#3b82f6] transition-colors resize-none"
            placeholder="Tell us about your gym..."
          />
        </div>
      </div>

      <div className="a-card space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#555] border-b border-[#1e1e1e] pb-3 mb-2">Contact & Location</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#909090]">Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-[13px] text-[#e8e8e8] outline-none focus:border-[#3b82f6] transition-colors"
              placeholder="+254..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#909090]">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={e => setForm(prev => ({ ...prev, website: e.target.value }))}
              className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-[13px] text-[#e8e8e8] outline-none focus:border-[#3b82f6] transition-colors"
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#909090]">Physical Address</label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
              className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-[13px] text-[#e8e8e8] outline-none focus:border-[#3b82f6] transition-colors"
              placeholder="123 Gym St, City"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#909090]">Region / Location</label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
              className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-[13px] text-[#e8e8e8] outline-none focus:border-[#3b82f6] transition-colors"
              placeholder="e.g. Westlands, Nairobi"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-[#3b82f6] px-6 py-3 text-sm font-bold text-white hover:bg-[#2563eb] disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Changes
        </button>
      </div>
    </form>
  );
}
