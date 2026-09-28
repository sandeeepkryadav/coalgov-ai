import React from 'react';
import ModulePage from '../../components/ModulePage';
import { useMineOptions } from '../../hooks/useLookups';

const ROLES = ['super_admin', 'leadership', 'mine_manager', 'safety_officer', 'environmental_officer', 'field_inspector', 'contractor', 'worker', 'regulator'];

export default function Users() {
  const mineOptions = useMineOptions();
  return (
    <ModulePage config={{
      title: 'Users',
      endpoint: '/users',
      searchPlaceholder: 'Search name or email...',
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role', badge: true },
        { key: 'is_active', label: 'Status', render: (r) => (r.is_active ? <span className="text-emerald-600">Active</span> : <span className="text-slate-400">Inactive</span>) }
      ],
      filters: [{ key: 'role', label: 'All Roles', options: ROLES }],
      fields: [
        { name: 'name', label: 'Full Name' },
        { name: 'email', label: 'Email' },
        { name: 'password', label: 'Password (new users only)', type: 'password' },
        { name: 'role', label: 'Role', type: 'select', options: ROLES },
        { name: 'mine_id', label: 'Assigned Mine (if applicable)', type: 'select', options: mineOptions },
        { name: 'phone', label: 'Phone' }
      ]
    }} />
  );
}
