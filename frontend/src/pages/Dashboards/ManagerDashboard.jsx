import React, { useEffect, useState } from 'react';
import { ShieldCheck, Factory, HardHat, FileWarning } from 'lucide-react';
import api from '../../services/api';
import { Card, StatCard, ChartCard, Loading, Badge } from '../../components/UI';
import { DonutChart, TrendLineChart } from '../../components/Charts';

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/dashboard').then((res) => setData(res.data.data)); }, []);
  if (!data) return <Loading />;

  const overview = data.complianceOverview || { compliant: 0, pending: 0, nonCompliant: 0 };
  const donutData = [
    { name: 'Compliant', value: overview.compliant },
    { name: 'Pending', value: overview.pending },
    { name: 'Non-compliant', value: overview.nonCompliant }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">{data.mine?.name || 'Mine'} Dashboard</h2>
        <Badge>{data.mine?.risk_level || 'Low'} Risk</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Compliance" value={`${data.compliancePct}%`} change="+2.4%" icon={ShieldCheck} iconColor="text-emerald-600 bg-emerald-50" />
        <StatCard label="Production" value={`${Math.round(data.production || 0)} T`} change="+5.2%" icon={Factory} iconColor="text-blue-600 bg-blue-50" />
        <StatCard label="Safety Incidents" value={data.safetyIncidents} tone="danger" icon={HardHat} iconColor="text-red-600 bg-red-50" />
        <StatCard label="Open Violations" value={data.openViolations} tone="warning" icon={FileWarning} iconColor="text-amber-600 bg-amber-50" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Compliance Overview">
          <div className="h-56"><DonutChart data={donutData} centerLabel={`${data.compliancePct}%`} colors={['#10b981', '#f59e0b', '#ef4444']} /></div>
        </Card>
        <ChartCard title="Production Trend">
          <TrendLineChart data={data.productionTrend} xKey="month" lines={[{ key: 'actual', name: 'Actual' }, { key: 'target', name: 'Target', dashed: true }]} />
        </ChartCard>
      </div>

      <Card title="Recent Activities">
        <div className="space-y-2">
          {data.recentActivities.length === 0 && <p className="text-sm text-slate-400">No recent activity recorded for this mine yet.</p>}
          {data.recentActivities.map((a) => (
            <div key={a.id} className="text-sm flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-700">{a.action} · {a.module}</span>
              <span className="text-xs text-slate-400">{a.created_at}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
