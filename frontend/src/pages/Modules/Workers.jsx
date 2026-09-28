import React from 'react';
import ModulePage from '../../components/ModulePage';
import { useMineOptions, useContractorOptions } from '../../hooks/useLookups';

export default function Workers() {
  const mineOptions = useMineOptions();
  const contractorOptions = useContractorOptions();
  return (
    <ModulePage config={{
      title: 'Workers',
      endpoint: '/workers',
      searchPlaceholder: 'Search worker name or code...',
      columns: [
        { key: 'worker_code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'mine_id', label: 'Mine ID' },
        { key: 'designation', label: 'Designation' },
        { key: 'phone', label: 'Phone' }
      ],
      fields: [
        { name: 'name', label: 'Full Name' },
        { name: 'mine_id', label: 'Mine', type: 'select', options: mineOptions },
        { name: 'contractor_id', label: 'Contractor', type: 'select', options: contractorOptions },
        { name: 'designation', label: 'Designation' },
        { name: 'phone', label: 'Phone' }
      ],
      canDelete: true
    }} />
  );
}
