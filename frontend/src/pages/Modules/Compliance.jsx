import React from 'react';
import ModulePage from '../../components/ModulePage';
import { useMineOptions } from '../../hooks/useLookups';

export default function Compliance() {
  const mineOptions = useMineOptions();
  return (
    <ModulePage config={{
      title: 'Compliance Items',
      endpoint: '/compliance',
      searchPlaceholder: 'Search requirement or code...',
      columns: [
        { key: 'compliance_code', label: 'Code' },
        { key: 'mine_name', label: 'Mine' },
        { key: 'category', label: 'Category' },
        { key: 'requirement', label: 'Requirement' },
        { key: 'due_date', label: 'Due Date' },
        { key: 'status', label: 'Status', badge: true },
        { key: 'risk', label: 'Risk', badge: true }
      ],
      filters: [
        { key: 'status', label: 'All Status', options: ['Compliant', 'Partially Compliant', 'Non-Compliant', 'Expired', 'Pending Review'] },
        { key: 'category', label: 'All Categories', options: ['Safety', 'Environment', 'Labour', 'Statutory', 'Equipment', 'Contractor', 'Production'] }
      ],
      fields: [
        { name: 'mine_id', label: 'Mine', type: 'select', options: mineOptions, required: true },
        { name: 'category', label: 'Category', type: 'select', options: ['Safety', 'Environment', 'Labour', 'Statutory', 'Equipment', 'Contractor', 'Production'] },
        { name: 'requirement', label: 'Requirement', full: true },
        { name: 'responsible_person', label: 'Responsible Person' },
        { name: 'frequency', label: 'Frequency', type: 'select', options: ['Monthly', 'Quarterly', 'Annual'] },
        { name: 'due_date', label: 'Due Date', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', options: ['Compliant', 'Partially Compliant', 'Non-Compliant', 'Expired', 'Pending Review'] },
        { name: 'risk', label: 'Risk', type: 'select', options: ['Low', 'Medium', 'High'] },
        { name: 'remarks', label: 'Remarks', type: 'textarea', full: true }
      ],
      canDelete: true
    }} />
  );
}
