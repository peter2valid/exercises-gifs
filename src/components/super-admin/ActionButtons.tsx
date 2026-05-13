'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Ban, Play, XCircle } from 'lucide-react';

export function SuspendGymButton({ gymId, status }: { gymId: string, status: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const isSuspended = status === 'suspended';
  const action = isSuspended ? 'restore' : 'suspend';

  const handleToggle = async () => {
    if (!confirm(`Are you sure you want to ${action} this gym?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/super-admin/gyms/${gymId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to update gym status');
      }
    } catch (e) {
      alert('Error updating gym');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
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

export function CancelSubscriptionButton({ id, type, status }: { id: string, type: 'gym' | 'user', status: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (status === 'canceled' || status === 'expired') return null;

  const handleCancel = async () => {
    if (!confirm(`Force cancel this ${type} subscription?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/super-admin/subscriptions/${type}/${id}`, {
        method: 'POST',
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to cancel subscription');
      }
    } catch (e) {
      alert('Error canceling subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="p-1.5 rounded text-rose-400 hover:bg-rose-400/10 transition-colors"
      title="Force Cancel Subscription"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
    </button>
  );
}
