import React from 'react';
import { useNavigate } from 'react-router-dom';
import ModulePage from '../../components/ModulePage';
import { useMineOptions } from '../../hooks/useLookups';

export default function Contractors() {
  const mineOptions = useMineOptions();
  const navigate = useNavigate();
  return (
    <ModulePage config={{
      title: 'Contractors',
      endpoint: '/contractors',
      searchPlaceholder: 'Search contractor name or code...',
      columns: [
        { key: 'contractor_code', label: 'Code' },
        { key: 'name', label: 'Name', render: (r) => <button className="text-blue-600 hover:underline" onClick={() => navigate(`/contractors/${r.id}`)}>{r.name}</button> },
        { key: 'mine_name', label: 'Mine' },
        { key: 'contract_status', label: 'Status', badge: true },
        { key: 'compliance_score', label: 'Compliance', render: (r) => `${r.compliance_score}%` },
        { key: 'safety_score', label: 'Safety', render: (r) => `${r.safety_score}%` }
      ],
      filters: [{ key: 'contract_status', label: 'All Status', options: ['Active', 'Suspended', 'Expired'] }],
      fields: [
        { name: 'name', label: 'Contractor Name', full: true },
        { name: 'mine_id', label: 'Mine', type: 'select', options: mineOptions },
        { name: 'contract_status', label: 'Contract Status', type: 'select', options: ['Active', 'Suspended', 'Expired'] },
        { name: 'contract_start', label: 'Contract Start', type: 'date' },
        { name: 'contract_end', label: 'Contract End', type: 'date' }
      ]
    }} />
  );
}
