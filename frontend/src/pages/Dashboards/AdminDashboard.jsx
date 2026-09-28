import React, { useEffect, useState } from 'react';
import { Users, Mountain, HandCoins, FileBarChart, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { Card, StatCard, Loading, Badge } from '../../components/UI';

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/dashboard').then((res) => setData(res.data.data)); }, []);
  if (!data) return <Loading />;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-800">Platform Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={data.totalUsers} icon={Users} />
        <StatCard label="Total Mines" value={data.totalMines} icon={Mountain} iconColor="text-purple-600 bg-purple-50" />
        <StatCard label="Contractors" value={data.totalContractors} icon={HandCoins} iconColor="text-amber-600 bg-amber-50" />
        <StatCard label="Reports Generated" value={data.reportsGenerated} icon={FileBarChart} iconColor="text-emerald-600 bg-emerald-50" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="System Health">
          <div className="space-y-3">
            {data.systemHealth.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{s.name}</span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-medium"><CheckCircle2 size={14} /> {s.status}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Recent Activity">
          <div className="space-y-3 max-h-56 overflow-y-auto">
            {data.recentActivity.length === 0 && <p className="text-sm text-slate-400">No recent activity yet.</p>}
            {data.recentActivity.map((a) => (
              <div key={a.id} className="text-sm border-b border-slate-50 pb-2">
                <p className="text-slate-700">{a.action} — <span className="text-slate-500">{a.module}</span></p>
                <p className="text-xs text-slate-400">{a.user_name} · {a.created_at}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Role Management">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {data.roleBreakdown.map((r) => (
            <div key={r.role} className="border border-slate-100 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-slate-800">{r.count}</p>
              <p className="text-xs text-slate-500 mt-1 capitalize">{r.role.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
