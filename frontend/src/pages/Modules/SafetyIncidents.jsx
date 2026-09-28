import React from 'react';
import ModulePage from '../../components/ModulePage';
import { useMineOptions } from '../../hooks/useLookups';

export default function SafetyIncidents() {
  const mineOptions = useMineOptions();
  return (
    <ModulePage config={{
      title: 'Safety Incidents',
      endpoint: '/safety/incidents',
      searchPlaceholder: 'Search incident code or description...',
      columns: [
        { key: 'incident_code', label: 'Code' },
        { key: 'mine_name', label: 'Mine' },
        { key: 'date', label: 'Date' },
        { key: 'type', label: 'Type' },
        { key: 'severity', label: 'Severity', badge: true },
        { key: 'status', label: 'Status', badge: true }
      ],
      filters: [
        { key: 'status', label: 'All Status', options: ['Open', 'Investigating', 'Closed'] },
        { key: 'severity', label: 'All Severity', options: ['Low', 'Medium', 'High', 'Critical'] }
      ],
      fields: [
        { name: 'mine_id', label: 'Mine', type: 'select', options: mineOptions },
        { name: 'date', label: 'Date', type: 'date' },
        { name: 'location', label: 'Location' },
        { name: 'type', label: 'Type' },
        { name: 'severity', label: 'Severity', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
        { name: 'persons_affected', label: 'Persons Affected', type: 'number' },
        { name: 'description', label: 'Description', type: 'textarea', full: true },
        { name: 'root_cause', label: 'Root Cause', full: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Open', 'Investigating', 'Closed'] }
      ]
    }} />
  );
}
