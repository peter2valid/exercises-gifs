'use client';

import { useState, useCallback } from 'react';
import { UserPlus, Copy, Check, Trash2, Loader2, X } from 'lucide-react';

const ROLE_LABEL: Record<string, string> = {
  gym_admin: 'Admin',
  trainer:   'Trainer',
  member:    'Member',
};

const ROLE_CLASS: Record<string, string> = {
  gym_owner: 'a-badge a-badge-blue',
  gym_admin: 'a-badge a-badge-ok',
  trainer:   'a-badge a-badge-warn',
  member:    'a-badge a-badge-gray',
};

const STAFF_ROLE_LABEL: Record<string, string> = {
  gym_owner: 'Owner',
  gym_admin: 'Admin',
  trainer:   'Trainer',
  member:    'Member',
};

interface StaffRow {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

interface InviteRow {
  id: string;
  email: string;
  role: string;
  token: string;
  created_at: string;
  expires_at: string;
}

interface Props {
  gymId: string;
  initialStaff: StaffRow[];
  initialInvites: InviteRow[];
  appUrl: string;
}

export function StaffPanel({ gymId, initialStaff, initialInvites, appUrl }: Props) {
  const [staff, setStaff] = useState(initialStaff);
  const [invites, setInvites] = useState(initialInvites);

  // Invite form
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'gym_admin' | 'trainer' | 'member'>('trainer');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [newInviteUrl, setNewInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Remove
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviting) return;
    setInviting(true);
    setInviteError(null);
    setNewInviteUrl(null);

    try {
      const res = await fetch('/api/admin/gym/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId, email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create invite');
      setNewInviteUrl(data.inviteUrl);
      setEmail('');
      // Reload pending invites
      const listRes = await fetch(`/api/admin/gym/invite?gymId=${gymId}`);
      const listData = await listRes.json();
      if (listRes.ok) setInvites(listData.invitations ?? []);
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Error creating invite');
    } finally {
      setInviting(false);
    }
  };

  const copyLink = useCallback((url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const revokeInvite = async (invite: InviteRow) => {
    const res = await fetch('/api/admin/gym/invite', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId: invite.id, gymId }),
    });
    if (res.ok) setInvites(prev => prev.filter(i => i.id !== invite.id));
  };

  const removeStaff = async (row: StaffRow) => {
    setRemovingId(row.id);
    try {
      const res = await fetch('/api/admin/gym/staff', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: row.id, gymId }),
      });
      if (res.ok) setStaff(prev => prev.filter(s => s.id !== row.id));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Invite form */}
      <div className="a-card">
        <h3 className="text-[14px] font-semibold text-[#e8e8e8] mb-4">Invite someone</h3>
        <form onSubmit={handleInvite} className="flex gap-2 flex-wrap">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            className="flex-1 min-w-[200px] h-9 rounded-lg border border-[#262626] bg-[#141414] px-3 text-sm text-[#e8e8e8] outline-none focus:border-[#3b82f6] transition-colors"
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value as typeof role)}
            className="h-9 rounded-lg border border-[#262626] bg-[#141414] px-3 text-sm text-[#e8e8e8] outline-none cursor-pointer"
          >
            <option value="gym_admin">Admin</option>
            <option value="trainer">Trainer</option>
            <option value="member">Member</option>
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="h-9 px-4 rounded-lg bg-[#3b82f6] text-white text-sm font-medium flex items-center gap-1.5 disabled:opacity-50"
          >
            {inviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            {inviting ? 'Creating…' : 'Create invite link'}
          </button>
        </form>

        {inviteError && <p className="text-[13px] text-[#ef4444] mt-3">{inviteError}</p>}

        {newInviteUrl && (
          <div className="mt-4 p-3 rounded-lg border border-[#22c55e]/30 bg-[#22c55e]/5">
            <p className="text-[12px] text-[#909090] mb-2">
              Invite link created — copy and send it to the person you&apos;re inviting:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] text-[#e8e8e8] truncate font-mono">{newInviteUrl}</code>
              <button
                onClick={() => copyLink(newInviteUrl)}
                className="shrink-0 h-7 px-3 rounded-md border border-[#262626] bg-[#1c1c1c] text-[12px] text-[#909090] flex items-center gap-1.5 hover:text-[#e8e8e8] transition-colors"
              >
                {copied ? <Check size={12} className="text-[#22c55e]" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {invites.length > 0 && (
        <div>
          <h3 className="text-[14px] font-semibold text-[#e8e8e8] mb-3">
            Pending invitations ({invites.length})
          </h3>
          <div className="a-card p-0 overflow-hidden">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Expires</th>
                  <th>Link</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invites.map(inv => (
                  <tr key={inv.id}>
                    <td className="text-[13px] text-[#e8e8e8]">{inv.email}</td>
                    <td>
                      <span className={ROLE_CLASS[inv.role] ?? 'a-badge a-badge-gray'}>
                        {ROLE_LABEL[inv.role] ?? inv.role}
                      </span>
                    </td>
                    <td className="text-[12px] text-[#555]">
                      {new Date(inv.expires_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </td>
                    <td>
                      <button
                        onClick={() => copyLink(`${appUrl}/join/${inv.token}`)}
                        className="flex items-center gap-1 text-[12px] text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
                      >
                        <Copy size={11} /> Copy link
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => revokeInvite(inv)}
                        className="text-[#555] hover:text-[#ef4444] transition-colors"
                        title="Revoke"
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Current staff */}
      <div>
        <h3 className="text-[14px] font-semibold text-[#e8e8e8] mb-3">
          Current staff ({staff.length})
        </h3>
        {staff.length === 0 ? (
          <div className="a-card text-center py-10">
            <p className="text-sm text-[#555]">No staff assigned yet</p>
            <p className="text-xs text-[#444] mt-1">Use the invite form above to add your team</p>
          </div>
        ) : (
          <div className="a-card p-0 overflow-hidden">
            <table className="a-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Added</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {staff.map(row => (
                  <tr key={row.id}>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-[#e8e8e8]">
                          {row.profiles?.full_name || 'Anonymous User'}
                        </span>
                        <span className="font-mono text-[10px] text-[#555]">
                          {row.user_id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={ROLE_CLASS[row.role] ?? 'a-badge a-badge-gray'}>
                        {STAFF_ROLE_LABEL[row.role] ?? row.role}
                      </span>
                    </td>
                    <td className="text-[12px] text-[#555]">
                      {new Date(row.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>
                      {row.role !== 'gym_owner' && (
                        <button
                          onClick={() => removeStaff(row)}
                          disabled={removingId === row.id}
                          className="text-[#555] hover:text-[#ef4444] transition-colors disabled:opacity-40"
                          title="Remove"
                        >
                          {removingId === row.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={14} />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
