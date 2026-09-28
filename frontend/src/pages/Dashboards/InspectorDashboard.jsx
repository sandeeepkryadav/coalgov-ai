import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Clock, AlertTriangle, FileWarning, Plus } from 'lucide-react';
import api from '../../services/api';
import { Card, StatCard, Loading, Badge, Table, Td, Button } from '../../components/UI';
import { DonutChart } from '../../components/Charts';

export default function InspectorDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  useEffect(() => { api.get('/dashboard').then((res) => setData(res.data.data)); }, []);
  if (!data) return <Loading />;

  const donutData = data.statusBreakdown.map((s) => ({ name: s.status, value: s.count }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Field Inspector Dashboard</h2>
        <Button icon={Plus} onClick={() => navigate('/inspections')}>New Inspection</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Inspections" value={data.todayInspections} icon={ClipboardCheck} iconColor="text-blue-600 bg-blue-50" />
        <StatCard label="Pending Inspections" value={data.pendingInspections} icon={Clock} iconColor="text-amber-600 bg-amber-50" />
        <StatCard label="High Risk Areas" value={data.highRiskAreas} tone="danger" icon={AlertTriangle} iconColor="text-red-600 bg-red-50" />
        <StatCard label="Open Violations" value={data.openViolations} tone="warning" icon={FileWarning} iconColor="text-amber-600 bg-amber-50" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Inspection Status">
          <div className="h-56">{donutData.length > 0 ? <DonutChart data={donutData} /> : <p className="text-sm text-slate-400 text-center pt-16">No inspections assigned yet.</p>}</div>
        </Card>
        <Card title="Upcoming Inspections" noPad>
          {data.upcoming.length === 0 ? <p className="text-sm text-slate-400 p-5">No upcoming inspections.</p> : (
            <Table columns={[{ key: 'mine_name', label: 'Mine' }, { key: 'type', label: 'Type' }, { key: 'scheduled_date', label: 'Date' }]}
              rows={data.upcoming}
              renderRow={(i) => (<><Td>{i.mine_name}</Td><Td>{i.type}</Td><Td>{i.scheduled_date}</Td></>)} />
          )}
        </Card>
      </div>

      <Card title="Recent Violations" noPad>
        {data.recentViolations.length === 0 ? <p className="text-sm text-slate-400 p-5">No violations logged yet.</p> : (
          <Table columns={[{ key: 'mine_name', label: 'Mine' }, { key: 'category', label: 'Type' }, { key: 'severity', label: 'Severity' }, { key: 'status', label: 'Status' }]}
            rows={data.recentViolations}
            renderRow={(v) => (<><Td>{v.mine_name}</Td><Td>{v.category}</Td><Td><Badge>{v.severity}</Badge></Td><Td><Badge>{v.status}</Badge></Td></>)} />
        )}
      </Card>
    </div>
  );
}
