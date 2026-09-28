import React, { useEffect, useState } from 'react';
import { Mountain, ShieldCheck, HardHat, Factory } from 'lucide-react';
import api from '../../services/api';
import { Card, StatCard, ChartCard, Loading, Badge, Table, Td } from '../../components/UI';
import { TrendBarChart, TrendLineChart, DonutChart } from '../../components/Charts';

export default function LeadershipDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/dashboard').then((res) => setData(res.data.data)); }, []);
  if (!data) return <Loading />;

  const riskData = data.riskDistribution.map((r) => ({ name: r.risk_level, value: r.count }));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-800">Corporate Management Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Mines" value={data.totalMines} icon={Mountain} iconColor="text-purple-600 bg-purple-50" />
        <StatCard label="Compliance Rate" value={`${data.compliancePct}%`} change="+2.1%" icon={ShieldCheck} iconColor="text-emerald-600 bg-emerald-50" />
        <StatCard label="Production (30d)" value={`${(data.production / 1000).toFixed(1)}k T`} change="+4.9%" icon={Factory} iconColor="text-blue-600 bg-blue-50" />
        <StatCard label="Safety Incidents (30d)" value={data.safetyIncidents} icon={HardHat} tone="danger" changeType="down" change="Trend improving" iconColor="text-red-600 bg-red-50" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Mine-wise Compliance">
          <TrendBarChart data={data.mineWiseCompliance} xKey="name" bars={[{ key: 'compliance_pct', name: 'Compliance %' }]} />
        </ChartCard>
        <ChartCard title="Production Trend">
          <TrendLineChart data={data.productionTrend} xKey="month" lines={[{ key: 'actual', name: 'Actual' }, { key: 'target', name: 'Target', dashed: true }]} />
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Risk Distribution">
          <div className="h-56"><DonutChart data={riskData} centerLabel={`${data.totalMines}`} colors={['#ef4444', '#f59e0b', '#10b981', '#991b1b']} /></div>
        </Card>
        <Card title="Top Violations" noPad>
          <Table columns={[{ key: 'mine', label: 'Mine' }, { key: 'category', label: 'Violation' }, { key: 'status', label: 'Status' }]}
            rows={data.topViolations}
            renderRow={(v) => (<><Td>{v.mine}</Td><Td>{v.category}</Td><Td><Badge>{v.status}</Badge></Td></>)} />
        </Card>
      </div>
    </div>
  );
}
