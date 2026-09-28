import React from 'react';
import ModulePage from '../../components/ModulePage';
import { useMineOptions } from '../../hooks/useLookups';

export default function Production() {
  const mineOptions = useMineOptions();
  return (
    <ModulePage config={{
      title: 'Production Records',
      endpoint: '/production',
      searchPlaceholder: 'Search...',
      columns: [
        { key: 'mine_name', label: 'Mine' },
        { key: 'date', label: 'Date' },
        { key: 'target', label: 'Target (T)' },
        { key: 'actual', label: 'Actual (T)' },
        { key: 'dispatch', label: 'Dispatch (T)' },
        { key: 'variance', label: 'Variance', render: (r) => { const v = Math.round(((r.actual - r.target) / (r.target || 1)) * 100); return `${v > 0 ? '+' : ''}${v}%`; } }
      ],
      fields: [
        { name: 'mine_id', label: 'Mine', type: 'select', options: mineOptions },
        { name: 'date', label: 'Date', type: 'date' },
        { name: 'target', label: 'Target (Tonnes)', type: 'number' },
        { name: 'actual', label: 'Actual (Tonnes)', type: 'number' },
        { name: 'dispatch', label: 'Dispatch (Tonnes)', type: 'number' }
      ],
      canDelete: true
    }} />
  );
}
