import React from 'react';
import ModulePage from '../../components/ModulePage';

export default function SafetyObservations() {
  return (
    <ModulePage config={{
      title: 'Safety Observations',
      endpoint: '/safety/observations',
      searchPlaceholder: 'Search observations...',
      columns: [
        { key: 'category', label: 'Category', badge: true },
        { key: 'description', label: 'Description' },
        { key: 'ppe_compliant', label: 'PPE Compliant', render: (r) => (r.ppe_compliant ? 'Yes' : 'No') },
        { key: 'status', label: 'Status', badge: true },
        { key: 'created_at', label: 'Recorded' }
      ],
      filters: [
        { key: 'category', label: 'All Categories', options: ['Near Miss', 'Hazard', 'PPE Compliance', 'Housekeeping'] },
        { key: 'status', label: 'All Status', options: ['Open', 'Closed'] }
      ],
      fields: [
        { name: 'category', label: 'Category', type: 'select', options: ['Near Miss', 'Hazard', 'PPE Compliance', 'Housekeeping'] },
        { name: 'description', label: 'Description', type: 'textarea', full: true },
        { name: 'ppe_compliant', label: 'PPE Compliant', type: 'select', options: [{ value: true, label: 'Yes' }, { value: false, label: 'No' }] }
      ]
    }} />
  );
}
