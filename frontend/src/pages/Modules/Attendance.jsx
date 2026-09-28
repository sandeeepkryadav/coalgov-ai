import React from 'react';
import ModulePage from '../../components/ModulePage';

export default function Attendance() {
  return (
    <ModulePage config={{
      title: 'Attendance',
      endpoint: '/attendance',
      searchPlaceholder: 'Search...',
      columns: [
        { key: 'worker_id', label: 'Worker ID' },
        { key: 'date', label: 'Date' },
        { key: 'shift', label: 'Shift' },
        { key: 'status', label: 'Status', badge: true }
      ],
      filters: [{ key: 'status', label: 'All Status', options: ['Present', 'Absent', 'Leave', 'Half Day'] }],
      fields: [
        { name: 'worker_id', label: 'Worker ID', type: 'number' },
        { name: 'date', label: 'Date', type: 'date' },
        { name: 'shift', label: 'Shift', type: 'select', options: ['Day', 'Night'] },
        { name: 'status', label: 'Status', type: 'select', options: ['Present', 'Absent', 'Leave', 'Half Day'] }
      ],
      canDelete: true
    }} />
  );
}
