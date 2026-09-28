import React, { useEffect, useState } from 'react';
import { Mountain, ShieldCheck, AlertTriangle, XOctagon, FileText, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Card, StatCard, ChartCard, Loading, Badge, Table, Td, Button } from '../../components/UI';
import { DonutChart, TrendBarChart } from '../../components/Charts';

export default function RegulatorDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  useEffect(() => { api.get('/dashboard').then((res) => setData(res.data.data)); }, []);
  if (!data) return <Loading />;

  const donutData = [
    { name: 'Compliant', value: data.compliant },
    { name: 'At Risk', value: data.atRisk },
    { name: 'Critical', value: data.critical }
  ];
  const pct = data.totalMines ? Math.round((data.compliant / data.totalMines) * 100) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-800">Regulatory Authority Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Mines" value={data.totalMines} icon={Mountain} />
        <StatCard label="Compliant" value={data.compliant} icon={ShieldCheck} iconColor="text-emerald-600 bg-emerald-50" />
        <StatCard label="At Risk" value={data.atRisk} tone="warning" icon={AlertTriangle} iconColor="text-amber-600 bg-amber-50" />
        <StatCard label="Critical" value={data.critical} tone="danger" icon={XOctagon} iconColor="text-red-600 bg-red-50" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Compliance Overview">
          <div className="h-56"><DonutChart data={donutData} centerLabel={`${pct}%`} colors={['#10b981', '#f59e0b', '#ef4444']} /></div>
        </Card>
        <ChartCard title="Inspection Records">
          <TrendBarChart data={data.inspectionRecords} xKey="month" bars={[{ key: 'completed', name: 'Completed' }, { key: 'pending', name: 'Pending' }]} />
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Recent Violations" noPad>
          <Table columns={[{ key: 'mine_name', label: 'Mine' }, { key: 'category', label: 'Violation' }, { key: 'status', label: 'Status' }]}
            rows={data.recentViolations}
            renderRow={(v) => (<><Td>{v.mine_name}</Td><Td>{v.category}</Td><Td><Badge>{v.status}</Badge></Td></>)} />
        </Card>
        <Card title="Quick Actions">
          <div className="space-y-2">
            <Button variant="secondary" className="w-full justify-start" icon={FileText} onClick={() => navigate('/reports')}>View Reports</Button>
            <Button variant="secondary" className="w-full justify-start" icon={FileText} onClick={() => navigate('/reports')}>Generate Compliance Report</Button>
            <Button variant="secondary" className="w-full justify-start" icon={History} onClick={() => navigate('/admin/audit-logs')}>View Audit Trail</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
