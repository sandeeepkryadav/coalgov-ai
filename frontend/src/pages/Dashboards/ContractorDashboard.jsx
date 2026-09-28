import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, StatCard, Loading, Badge } from '../../components/UI';
import { DonutChart } from '../../components/Charts';

export default function ContractorDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/dashboard').then((res) => setData(res.data.data)); }, []);
  if (!data) return <Loading />;
  const c = data.contractor;
  if (!c) return <Card><p className="text-sm text-slate-500">No contractor profile is linked to this account yet.</p></Card>;

  const donutData = [
    { name: 'Compliance', value: c.compliance_score },
    { name: 'Safety', value: c.safety_score },
    { name: 'Attendance', value: c.attendance_score }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{c.name}</h2>
          <p className="text-xs text-slate-400">Contractor Portal</p>
        </div>
        <Badge>{c.contract_status}</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Compliance" value={`${c.compliance_score}%`} />
        <StatCard label="Safety" value={`${c.safety_score}%`} />
        <StatCard label="Attendance" value={`${c.attendance_score}%`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Contract Performance">
          <div className="h-56"><DonutChart data={donutData} centerLabel={`${c.compliance_score}%`} /></div>
        </Card>
        <Card title="Pending Actions">
          {data.pendingDocuments.length === 0 ? <p className="text-sm text-slate-400">No pending items — all documents are valid.</p> : (
            <div className="space-y-2">
              {data.pendingDocuments.map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2">
                  <span className="text-slate-700">{d.name}</span>
                  <Badge>{d.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Worker Summary">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div><p className="text-xl font-bold text-slate-800">{data.workers}</p><p className="text-xs text-slate-500">Total Workers</p></div>
          <div><p className="text-xl font-bold text-emerald-600">{data.present}</p><p className="text-xs text-slate-500">Present Today</p></div>
          <div><p className="text-xl font-bold text-red-600">{data.absent}</p><p className="text-xs text-slate-500">Absent Today</p></div>
          <div><p className="text-xl font-bold text-slate-800">{data.trainingCompliance}%</p><p className="text-xs text-slate-500">Training Compliance</p></div>
        </div>
      </Card>
    </div>
  );
}
