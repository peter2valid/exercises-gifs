'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, X } from 'lucide-react';
import { AdminButton } from '@/components/admin/AdminButton';

export function NewGymModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/super-admin/gyms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, ownerEmail }),
      });

      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create gym');
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#111] border border-[#262626] rounded-2xl shadow-2xl p-6"
        style={{ maxHeight: 'calc(100vh - (var(--bottom-nav-height,76px) + env(safe-area-inset-bottom) + 48px))', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Add New Gym</h3>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#555] uppercase tracking-wider">Gym Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
              }}
              placeholder="e.g. Iron Paradise"
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] outline-none focus:border-blue-600 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#555] uppercase tracking-wider">URL Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. iron-paradise"
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] outline-none focus:border-blue-600 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#555] uppercase tracking-wider">Owner Email (Optional)</label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="owner@example.com"
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] outline-none focus:border-blue-600 transition-colors"
            />
            <p className="text-[10px] text-[#444]">If the user exists, they will get access immediately. Otherwise, an invitation will be created.</p>
          </div>

          {error && (
            <p className="text-[13px] text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="pt-2 flex gap-3">
            <AdminButton type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" variant="primary" className="flex-1" loading={loading}>
              Create Gym
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export function NewGymButton() {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <AdminButton variant="primary" onClick={() => setShowModal(true)}>
        <Plus size={15} />
        Add Gym
      </AdminButton>
      {showModal && <NewGymModal onClose={() => setShowModal(false)} />}
    </>
  );
}
