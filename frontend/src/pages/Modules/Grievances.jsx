import React from 'react';
import ModulePage from '../../components/ModulePage';

export default function Grievances() {
  return (
    <ModulePage config={{
      title: 'Grievances',
      endpoint: '/grievances',
      searchPlaceholder: 'Search grievances...',
      columns: [
        { key: 'grievance_code', label: 'Code' },
        { key: 'category', label: 'Category' },
        { key: 'priority', label: 'Priority', badge: true },
        { key: 'status', label: 'Status', badge: true },
        { key: 'created_at', label: 'Submitted' }
      ],
      filters: [
        { key: 'status', label: 'All Status', options: ['Submitted', 'Assigned', 'Under Review', 'Action Taken', 'Resolved', 'Closed'] },
        { key: 'priority', label: 'All Priority', options: ['Low', 'Medium', 'High'] }
      ],
      fields: [
        { name: 'category', label: 'Category', type: 'select', options: ['Wages', 'Working Conditions', 'Safety Equipment', 'Harassment', 'Transport', 'Medical Facilities'] },
        { name: 'description', label: 'Description', type: 'textarea', full: true },
        { name: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] },
        { name: 'anonymous', label: 'Submit Anonymously', type: 'select', options: [{ value: true, label: 'Yes' }, { value: false, label: 'No' }], default: false }
      ]
    }} />
  );
}
