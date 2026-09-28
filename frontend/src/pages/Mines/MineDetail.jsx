import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { Card, StatCard, Badge, Loading, Table, Td } from '../../components/UI';

export default function MineDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => { api.get(`/mines/${id}/overview`).then((res) => setData(res.data.data)); }, [id]);
  if (!data) return <Loading />;
  const { mine, stats, recentInspections, recentViolations } = data;

  return (
    <div className="space-y-6">
      <Link to="/mines" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft size={15} /> Back to Mines</Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{mine.name}</h2>
          <p className="text-sm text-slate-500">{mine.mine_code} · {mine.location}</p>
        </div>
        <Badge>{mine.risk_level} Risk · Score {mine.risk_score}</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Compliance" value={`${mine.compliance_pct?.toFixed ? mine.compliance_pct.toFixed(1) : mine.compliance_pct}%`} />
        <StatCard label="Production" value={`${Math.round(mine.current_production)} T`} />
        <StatCard label="Open Violations" value={stats.openViolations} tone="warning" />
        <StatCard label="Overdue Actions" value={stats.overdueActions} tone="danger" />
        <StatCard label="Workers" value={stats.workers} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Recent Inspections" noPad>
          {recentInspections.length === 0 ? <p className="text-sm text-slate-400 p-5">No inspections recorded yet.</p> : (
            <Table columns={[{ key: 'inspection_code', label: 'Code' }, { key: 'type', label: 'Type' }, { key: 'status', label: 'Status' }]}
              rows={recentInspections}
              renderRow={(i) => (<><Td>{i.inspection_code}</Td><Td>{i.type}</Td><Td><Badge>{i.status}</Badge></Td></>)} />
          )}
        </Card>
        <Card title="Recent Violations" noPad>
          {recentViolations.length === 0 ? <p className="text-sm text-slate-400 p-5">No violations recorded yet.</p> : (
            <Table columns={[{ key: 'violation_code', label: 'Code' }, { key: 'category', label: 'Category' }, { key: 'status', label: 'Status' }]}
              rows={recentViolations}
              renderRow={(v) => (<><Td>{v.violation_code}</Td><Td>{v.category}</Td><Td><Badge>{v.status}</Badge></Td></>)} />
          )}
        </Card>
      </div>

      <Card title="Mine Information">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><p className="text-slate-400 text-xs">Subsidiary</p><p className="text-slate-700 font-medium">{mine.subsidiary_name || '-'}</p></div>
          <div><p className="text-slate-400 text-xs">Manager</p><p className="text-slate-700 font-medium">{mine.manager_name || '-'}</p></div>
          <div><p className="text-slate-400 text-xs">State / District</p><p className="text-slate-700 font-medium">{mine.state}, {mine.district}</p></div>
          <div><p className="text-slate-400 text-xs">Capacity</p><p className="text-slate-700 font-medium">{mine.production_capacity} T</p></div>
        </div>
      </Card>
    </div>
  );
}
