import React, { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Select, Input } from '../../components/UI';
import { DonutChart } from '../../components/Charts';

const REPORT_TYPES = [
  { key: 'compliance', label: 'Compliance Report' },
  { key: 'safety', label: 'Safety Report' },
  { key: 'environmental', label: 'Environmental Report' },
  { key: 'inspection', label: 'Inspection Report' },
  { key: 'production', label: 'Production Report' },
  { key: 'contractor', label: 'Contractor Report' },
  { key: 'labour', label: 'Workforce Report' },
  { key: 'grievance', label: 'Grievance Report' },
  { key: 'corrective_action', label: 'Corrective Action Report' }
];

export default function Reports() {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => { api.get('/reports/summary').then((res) => setSummary(res.data.data)); }, []);

  async function download(type, format) {
    try {
      const params = new URLSearchParams({ format, ...(from ? { from } : {}), ...(to ? { to } : {}) });
      const token = localStorage.getItem('coalgov_token');
      const res = await fetch(`/api/reports/${type}/export?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${type}-report.${format === 'json' ? 'json' : format}`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded.');
    } catch {
      toast.error('Could not generate the report. Please try again.');
    }
  }

  const donutData = summary ? (summary.byCategory || []).map((c) => ({ name: c.category, value: c.rate })) : [];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-800">Report Center</h2>

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </Card>

      {summary && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card title="Key Metrics">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-2xl font-bold text-slate-800">{summary.complianceRate}%</p><p className="text-xs text-slate-500">Compliance Rate</p></div>
              <div><p className="text-2xl font-bold text-slate-800">{summary.totalViolations}</p><p className="text-xs text-slate-500">Total Violations</p></div>
              <div><p className="text-2xl font-bold text-emerald-600">{summary.closedActions}</p><p className="text-xs text-slate-500">Closed Actions</p></div>
              <div><p className="text-2xl font-bold text-amber-600">{summary.pendingActions}</p><p className="text-xs text-slate-500">Pending Actions</p></div>
            </div>
          </Card>
          <Card title="Compliance by Category">
            <div className="h-48">{donutData.length > 0 ? <DonutChart data={donutData} /> : <p className="text-sm text-slate-400 pt-14 text-center">No compliance data yet.</p>}</div>
          </Card>
        </div>
      )}

      <Card title="Export Reports">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {REPORT_TYPES.map((r) => (
            <div key={r.key} className="border border-slate-100 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-700">{r.label}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => download(r.key, 'pdf')} title="PDF" className="p-1.5 rounded border border-slate-200 hover:bg-red-50 hover:border-red-200 text-red-500"><Download size={13} /></button>
                <button onClick={() => download(r.key, 'csv')} title="CSV" className="p-1.5 rounded border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 text-emerald-600"><Download size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
