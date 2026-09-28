import React from 'react';
import ModulePage from '../../components/ModulePage';
import { useMineOptions } from '../../hooks/useLookups';

export default function Environment() {
  const mineOptions = useMineOptions();
  return (
    <ModulePage config={{
      title: 'Environmental Records',
      endpoint: '/environment',
      searchPlaceholder: 'Search records...',
      columns: [
        { key: 'mine_name', label: 'Mine' },
        { key: 'parameter', label: 'Parameter' },
        { key: 'value', label: 'Value', render: (r) => `${r.value} ${r.unit || ''}` },
        { key: 'threshold', label: 'Threshold' },
        { key: 'status', label: 'Status', badge: true },
        { key: 'recorded_at', label: 'Recorded At' }
      ],
      filters: [
        { key: 'parameter', label: 'All Parameters', options: ['Air Quality', 'Dust', 'Water Quality', 'Noise', 'Waste'] },
        { key: 'status', label: 'All Status', options: ['Normal', 'Warning', 'Breach'] }
      ],
      fields: [
        { name: 'mine_id', label: 'Mine', type: 'select', options: mineOptions },
        { name: 'parameter', label: 'Parameter', type: 'select', options: ['Air Quality', 'Dust', 'Water Quality', 'Noise', 'Waste'] },
        { name: 'value', label: 'Measured Value', type: 'number' },
        { name: 'unit', label: 'Unit' },
        { name: 'threshold', label: 'Threshold (optional — default used if blank)', type: 'number' }
      ],
      canEdit: false
    }} />
  );
}
