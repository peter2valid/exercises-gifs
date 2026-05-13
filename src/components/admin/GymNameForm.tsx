'use client';

import { useState } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';

interface Props {
  gymId: string;
  initialName: string;
}

export function GymNameForm({ gymId, initialName }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [draft, setDraft] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (trimmed === name) { setEditing(false); return; }
    if (trimmed.length < 2) { setError('Name must be at least 2 characters'); return; }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/gym', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId, name: trimmed }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to save');
      setName(trimmed);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setDraft(name);
    setEditing(false);
    setError(null);
  };

  return (
    <div className="a-card space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#555]">Gym Name</p>
        {!editing && (
          <button
            onClick={() => { setEditing(true); setDraft(name); setSaved(false); }}
            className="flex items-center gap-1.5 text-[12px] text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Pencil size={12} />
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={e => { setDraft(e.target.value); setError(null); }}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
            maxLength={80}
            className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2 text-[13px] text-[#e8e8e8] outline-none focus:border-blue-500 transition-colors"
            placeholder="Enter gym name"
          />
          {error && <p className="text-[12px] text-red-400">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={loading || !draft.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Save
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-[#333] px-3 py-1.5 text-[12px] text-[#909090] hover:text-[#e8e8e8] hover:border-[#555] transition-colors"
            >
              <X size={12} />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <p className="text-[22px] font-bold text-[#e8e8e8]">{name}</p>
          {saved && (
            <span className="flex items-center gap-1 text-[12px] text-emerald-400">
              <Check size={12} />
              Saved
            </span>
          )}
        </div>
      )}
    </div>
  );
}
