'use client';

import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { UserEditModal } from './UserEditModal';

export function UserActions({ user, gyms, roles }: { user: any; gyms: any[]; roles: any[] }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="p-1.5 rounded text-blue-400 hover:bg-blue-400/10 transition-colors"
        title="Manage Roles"
      >
        <Edit2 size={16} />
      </button>
      {show && (
        <UserEditModal 
          user={user} 
          gyms={gyms} 
          initialRoles={roles} 
          onClose={() => setShow(false)} 
        />
      )}
    </>
  );
}
