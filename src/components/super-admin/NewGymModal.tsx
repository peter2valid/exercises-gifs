'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, X } from 'lucide-react';
import { AdminButton } from '@/components/admin/AdminButton';

export function NewGymModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/gyms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });
      
      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create gym');
      }
    } catch (e) {
      alert('Error creating gym');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#111] border border-[#262626] rounded-2xl shadow-2xl p-6">
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
