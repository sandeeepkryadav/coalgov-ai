import React from 'react';
import ModulePage from '../../components/ModulePage';

export default function Subsidiaries() {
  return (
    <ModulePage config={{
      title: 'Subsidiaries',
      endpoint: '/subsidiaries',
      searchPlaceholder: 'Search...',
      columns: [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'created_at', label: 'Added' }],
      fields: [{ name: 'name', label: 'Subsidiary Name', full: true }],
      canDelete: false,
      canEdit: false
    }} />
  );
}
