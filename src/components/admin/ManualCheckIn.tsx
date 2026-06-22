'use client';

import { useMemo, useState } from 'react';
import { Search, CheckCircle2, XCircle, Loader2, UserCheck } from 'lucide-react';

interface Member {
  id: string;
  fullName: string;
}

interface Props {
  gymId: string;
  members: Member[];
}

interface Result {
  ok: boolean;
  fullName?: string;
  checkedInAt?: string;
  error?: string;
}

export function ManualCheckIn({ gymId, members }: Props) {
  const [query, setQuery] = useState('');
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return members.filter(m => m.fullName.toLowerCase().includes(q)).slice(0, 8);
  }, [query, members]);

  const checkIn = async (member: Member) => {
    if (checkingInId) return;
    setCheckingInId(member.id);
    setResult(null);
    try {
      const res = await fetch('/api/checkin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id, gymId }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, fullName: member.fullName, checkedInAt: data.checkIn.checked_in_at });
        setQuery('');
      } else {
        setResult({ ok: false, error: data.error ?? 'Check-in failed' });
      }
    } catch {
      setResult({ ok: false, error: 'Network error' });
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setResult(null); }}
          placeholder="Search member by name…"
          className="w-full h-11 rounded-xl border border-[#262626] bg-[#141414] pl-10 pr-3 text-sm text-[#e8e8e8] outline-none focus:border-[#3b82f6] transition-colors"
        />
      </div>

      {query.trim() && (
        <div className="a-card p-0 overflow-hidden divide-y divide-[#262626]">
          {matches.length === 0 ? (
            <p className="text-sm text-[#555] py-6 text-center">No members match &quot;{query}&quot;</p>
          ) : (
            matches.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-[#e8e8e8]">{m.fullName}</span>
                <button
                  onClick={() => checkIn(m)}
                  disabled={!!checkingInId}
                  className="h-8 px-3 rounded-lg bg-[#3b82f6] text-white text-[12px] font-semibold flex items-center gap-1.5 disabled:opacity-50 hover:bg-blue-500 transition-colors"
                >
                  {checkingInId === m.id ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                  Check in
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {result && (
        <div
          className={`a-card flex items-start gap-3 ${
            result.ok ? 'border-[#22c55e]/40 bg-[#22c55e]/5' : 'border-[#ef4444]/40 bg-[#ef4444]/5'
          }`}
        >
          {result.ok ? (
            <CheckCircle2 size={20} className="text-[#22c55e] shrink-0 mt-0.5" />
          ) : (
            <XCircle size={20} className="text-[#ef4444] shrink-0 mt-0.5" />
          )}
          <div>
            {result.ok ? (
              <>
                <p className="text-sm font-semibold text-[#e8e8e8]">Checked in!</p>
                <p className="text-xs text-[#909090] mt-0.5">
                  {result.fullName} ·{' '}
                  {result.checkedInAt
                    ? new Date(result.checkedInAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                    : ''}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[#e8e8e8]">Check-in failed</p>
                <p className="text-xs text-[#909090] mt-0.5">{result.error}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
