'use client';

import { useState } from 'react';
import { UserCheck, UserX, Trash2, Loader2, Clock, UserPlus } from 'lucide-react';
import { AddMemberModal } from './AddMemberModal';

interface Member {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

interface Request {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

interface Props {
  gymId: string;
  initialMembers: Member[];
  initialRequests: Request[];
}

export function MembersPanel({ gymId, initialMembers, initialRequests }: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [requests, setRequests] = useState(initialRequests);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAction = async (membershipId: string, action: 'approve' | 'reject' | 'delete') => {
    if (processingId) return;
    setProcessingId(membershipId);

    try {
      if (action === 'delete') {
        const res = await fetch('/api/admin/gym/members', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gymId, membershipId }),
        });
        if (res.ok) setMembers(prev => prev.filter(m => m.id !== membershipId));
      } else {
        const res = await fetch('/api/admin/gym/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gymId, membershipId, action }),
        });
        if (res.ok) {
          if (action === 'approve') {
            const approved = requests.find(r => r.id === membershipId);
            if (approved) {
              setMembers(prev => [{ ...approved, created_at: new Date().toISOString() }, ...prev]);
            }
          }
          setRequests(prev => prev.filter(r => r.id !== membershipId));
        }
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Pending Requests */}
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[#e8e8e8]">Manage Members</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-8 px-3 rounded-lg bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1.5 hover:bg-blue-500 transition-colors"
        >
          <UserPlus size={14} />
          Add Member
        </button>
      </div>

      {showAddModal && <AddMemberModal gymId={gymId} onClose={() => setShowAddModal(false)} />}

      {requests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[14px] font-semibold text-[#e8e8e8] flex items-center gap-2">
            <Clock size={16} className="text-amber-400" />
            Pending Requests
          </h3>
          <div className="a-card p-0 overflow-hidden">
            <table className="a-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Requested</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id}>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-[#e8e8e8]">
                          {req.profiles?.full_name || 'Anonymous User'}
                        </span>
                        <span className="font-mono text-[10px] text-[#555]">
                          {req.user_id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="a-badge a-badge-gray capitalize">{req.role}</span>
                    </td>
                    <td className="text-[12px] text-[#555]">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAction(req.id, 'approve')}
                          disabled={!!processingId}
                          className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1.5 hover:bg-emerald-500 transition-colors disabled:opacity-50"
                        >
                          {processingId === req.id ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(req.id, 'reject')}
                          disabled={!!processingId}
                          className="h-8 px-3 rounded-lg bg-[#1a1a1a] border border-[#333] text-[#909090] text-[11px] font-bold flex items-center gap-1.5 hover:text-white hover:border-[#555] transition-colors disabled:opacity-50"
                        >
                          {processingId === req.id ? <Loader2 size={12} className="animate-spin" /> : <UserX size={12} />}
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Members */}
      <div className="space-y-3">
        <h3 className="text-[14px] font-semibold text-[#e8e8e8]">Active Members</h3>
        <div className="a-card p-0 overflow-hidden">
          <table className="a-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Joined</th>
                <th className="text-right"></th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-[#555] text-sm">
                    No active members found
                  </td>
                </tr>
              ) : (
                members.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-[#e8e8e8]">
                          {m.profiles?.full_name || 'Anonymous User'}
                        </span>
                        <span className="font-mono text-[10px] text-[#555]">
                          {m.user_id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="a-badge a-badge-gray capitalize">{m.role}</span>
                    </td>
                    <td className="text-[12px] text-[#555]">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      {confirmDeleteId === m.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(m.id, 'delete')}
                            disabled={!!processingId}
                            className="h-8 px-3 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[11px] font-bold hover:bg-rose-500/30 transition-colors disabled:opacity-50"
                          >
                            {processingId === m.id ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={!!processingId}
                            className="h-8 px-3 rounded-lg bg-[#1a1a1a] border border-[#333] text-[#909090] text-[11px] font-bold hover:text-white hover:border-[#555] transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(m.id)}
                          disabled={!!processingId}
                          className="text-[#555] hover:text-red-400 transition-colors p-2"
                          title="Remove member"
                        >
                          {processingId === m.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
