'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Ban, Play, XCircle, Edit2 } from 'lucide-react';
import { EditGymModal } from './EditGymModal';

export function SuspendGymButton({ gymId, status }: { gymId: string, status: string }) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isSuspended = status === 'suspended';
  const action = isSuspended ? 'restore' : 'suspend';

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    setConfirming(false);
    try {
      const res = await fetch(`/api/super-admin/gyms/${gymId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setError('Failed');
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError('Error');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <span className="text-[11px] text-rose-400">{error}</span>;
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
        >
          {loading ? <Loader2 size={11} className="animate-spin" /> : 'Confirm'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-2 py-0.5 rounded text-[11px] text-[#555] border border-[#262626] hover:text-[#e8e8e8]"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      disabled={loading}
      className={`p-1.5 rounded transition-colors ${
        isSuspended ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-rose-400 hover:bg-rose-400/10'
      }`}
      title={isSuspended ? 'Restore Gym' : 'Suspend Gym'}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : isSuspended ? <Play size={16} /> : <Ban size={16} />}
    </button>
  );
}

export function EditGymButton({ gym, ownerEmail }: { gym: any; ownerEmail?: string | null }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="p-1.5 rounded text-blue-400 hover:bg-blue-400/10 transition-colors"
        title="Edit Gym"
      >
        <Edit2 size={16} />
      </button>
      {show && <EditGymModal gym={gym} ownerEmail={ownerEmail} onClose={() => setShow(false)} />}
    </>
  );
}

export function CancelSubscriptionButton({ id, type, status }: { id: string, type: 'gym' | 'user', status: string }) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (status === 'canceled' || status === 'expired') return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    setConfirming(false);
    try {
      const res = await fetch(`/api/super-admin/subscriptions/${type}/${id}`, {
        method: 'POST',
      });
      if (res.ok) {
        router.refresh();
      } else {
        setError('Failed');
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError('Error');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <span className="text-[11px] text-rose-400">{error}</span>;
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
        >
          {loading ? <Loader2 size={11} className="animate-spin" /> : 'Confirm'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-2 py-0.5 rounded text-[11px] text-[#555] border border-[#262626] hover:text-[#e8e8e8]"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      disabled={loading}
      className="p-1.5 rounded text-rose-400 hover:bg-rose-400/10 transition-colors"
      title="Force Cancel Subscription"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
    </button>
  );
}
