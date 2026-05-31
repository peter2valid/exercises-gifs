'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { AdminButton } from '@/components/admin/AdminButton';

export function AddMemberModal({ gymId, onClose }: { gymId: string; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Explicit validation to prevent "vague tooltips"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/gym/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId, email, role }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add member');
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative w-full max-w-sm bg-[#111] border border-[#262626] rounded-2xl shadow-2xl p-8 text-center animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
            <Loader2 size={24} className="text-emerald-400 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Member Added!</h3>
          <p className="text-sm text-[#555]">Refreshing the list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#111] border border-[#262626] rounded-2xl shadow-2xl p-6"
        style={{ maxHeight: 'calc(100vh - (var(--bottom-nav-height,76px) + env(safe-area-inset-bottom) + 48px))', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Add Member</h3>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleAdd} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#555] uppercase tracking-wider">User Email</label>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] outline-none focus:border-blue-600 transition-colors"
            />
          </div>

          {error && (
            <p className="text-[13px] text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="pt-2 flex gap-3">
            <AdminButton type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" variant="primary" className="flex-1" loading={loading}>
              Add Directly
            </AdminButton>
          </div>
          <p className="text-[10px] text-[#444] text-center">
            This will add an existing user immediately. If the user doesn&apos;t exist, please use the <a href="/admin/staff" className="text-blue-500 underline">Invite</a> system.
          </p>
        </form>
      </div>
    </div>
  );
}
