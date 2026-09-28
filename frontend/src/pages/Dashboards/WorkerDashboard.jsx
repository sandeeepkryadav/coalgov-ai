import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Card, StatCard, Badge, Loading, Button } from '../../components/UI';

export default function WorkerDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/dashboard').then((res) => setData(res.data.data)); }, []);
  if (!data) return <Loading />;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-800">My Dashboard</h2>
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Attendance Rate" value={data.attendanceRate != null ? `${data.attendanceRate}%` : 'N/A'} />
        <StatCard label="My Grievances" value={data.grievances.length} />
      </div>
      <Card title="My Recent Grievances" action={<Link to="/grievances"><Button size="sm" variant="secondary">Submit New</Button></Link>}>
        {data.grievances.length === 0 ? <p className="text-sm text-slate-400">You haven't submitted any grievances yet.</p> : (
          <div className="space-y-2">
            {data.grievances.map((g) => (
              <div key={g.id} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2">
                <span className="text-slate-700">{g.category} — {g.grievance_code}</span>
                <Badge>{g.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
