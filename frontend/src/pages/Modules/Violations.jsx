import React from 'react';
import ModulePage from '../../components/ModulePage';
import { useMineOptions } from '../../hooks/useLookups';

export default function Violations() {
  const mineOptions = useMineOptions();
  return (
    <ModulePage config={{
      title: 'Violations',
      endpoint: '/violations',
      searchPlaceholder: 'Search violation code or description...',
      columns: [
        { key: 'violation_code', label: 'Code' },
        { key: 'mine_name', label: 'Mine' },
        { key: 'category', label: 'Category' },
        { key: 'severity', label: 'Severity', badge: true },
        { key: 'status', label: 'Status', badge: true }
      ],
      filters: [
        { key: 'status', label: 'All Status', options: ['Open', 'In Progress', 'Closed'] },
        { key: 'severity', label: 'All Severity', options: ['Low', 'Medium', 'High'] }
      ],
      fields: [
        { name: 'mine_id', label: 'Mine', type: 'select', options: mineOptions },
        { name: 'category', label: 'Category' },
        { name: 'description', label: 'Description', type: 'textarea', full: true },
        { name: 'severity', label: 'Severity', type: 'select', options: ['Low', 'Medium', 'High'] },
        { name: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Closed'] }
      ]
    }} />
  );
}
