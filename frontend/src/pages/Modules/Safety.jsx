import React, { useState } from 'react';
import SafetyIncidents from './SafetyIncidents';
import SafetyObservations from './SafetyObservations';

export default function Safety() {
  const [tab, setTab] = useState('incidents');
  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-slate-200">
        {[{ key: 'incidents', label: 'Accidents & Incidents' }, { key: 'observations', label: 'Observations' }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'incidents' ? <SafetyIncidents /> : <SafetyObservations />}
    </div>
  );
}
