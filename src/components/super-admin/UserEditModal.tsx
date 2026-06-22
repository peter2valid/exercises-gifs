'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';
import { AdminButton } from '@/components/admin/AdminButton';

interface User {
  id: string;
  email?: string;
}

interface Gym {
  id: string;
  name: string;
}

export function UserEditModal({ user, gyms, initialRoles, onClose }: { 
  user: User; 
  gyms: Gym[]; 
  initialRoles: any[]; 
  onClose: () => void 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(initialRoles.some(r => r.role === 'super_admin'));
  const [gymRoles, setGymRoles] = useState(initialRoles.filter(r => r.gym_id));
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/super-admin/users/${user.id}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isSuperAdmin,
          gymRoles: gymRoles.map(r => ({ gym_id: r.gym_id, role: r.role }))
        }),
      });

      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        setError('Failed to update roles');
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  const addGymRole = () => {
    if (gyms.length === 0) return;
    setGymRoles([...gymRoles, { gym_id: gyms[0].id, role: 'gym_admin' }]);
  };

  const removeGymRole = (index: number) => {
    setGymRoles(gymRoles.filter((_, i) => i !== index));
  };

  const updateGymRole = (index: number, field: string, value: string) => {
    const next = [...gymRoles];
    next[index] = { ...next[index], [field]: value };
    setGymRoles(next);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#111] border border-[#262626] rounded-2xl shadow-2xl p-6"
        style={{ maxHeight: 'calc(100vh - (var(--bottom-nav-height,76px) + env(safe-area-inset-bottom) + 48px))', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Manage User Roles</h3>
            <p className="text-[12px] text-[#555]">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Global Roles */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-[#555] uppercase tracking-wider">System Permissions</h4>
            <label className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl cursor-pointer hover:border-[#333] transition-colors">
              <input 
                type="checkbox" 
                checked={isSuperAdmin} 
                onChange={e => setIsSuperAdmin(e.target.checked)}
                className="w-4 h-4 rounded border-[#333] bg-transparent text-blue-600 focus:ring-0 focus:ring-offset-0"
              />
              <div>
                <p className="text-[13px] font-medium text-[#e8e8e8]">Platform Super Admin</p>
                <p className="text-[11px] text-[#555]">Full access to all gyms, users, and platform settings.</p>
              </div>
            </label>
          </div>

          {/* Gym Roles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-[#555] uppercase tracking-wider">Gym Assignments</h4>
              <button 
                onClick={addGymRole}
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                + Add Gym
              </button>
            </div>
            
            <div className="space-y-2">
              {gymRoles.length === 0 ? (
                <p className="text-[12px] text-[#444] italic py-2">No gym assignments</p>
              ) : (
                gymRoles.map((gr, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select 
                      value={gr.gym_id}
                      onChange={e => updateGymRole(i, 'gym_id', e.target.value)}
                      className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-[13px] text-[#e8e8e8] outline-none"
                    >
                      {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <select 
                      value={gr.role}
                      onChange={e => updateGymRole(i, 'role', e.target.value)}
                      className="w-32 bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-[13px] text-[#e8e8e8] outline-none"
                    >
                      <option value="gym_owner">Owner</option>
                      <option value="gym_admin">Admin</option>
                      <option value="trainer">Trainer</option>
                      <option value="front_desk">Front Desk</option>
                      <option value="member">Member</option>
                    </select>
                    <button 
                      onClick={() => removeGymRole(i)}
                      className="p-2 text-[#444] hover:text-red-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-[13px] text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="mt-4 flex gap-3">
          <AdminButton variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton variant="primary" className="flex-1" onClick={handleSave} loading={loading}>
            Save Assignments
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
