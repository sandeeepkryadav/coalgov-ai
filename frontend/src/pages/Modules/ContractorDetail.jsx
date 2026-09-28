import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { Card, Badge, Table, Td, Loading } from '../../components/UI';

export default function ContractorDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  useEffect(() => { api.get(`/contractors/${id}`).then((res) => setData(res.data.data)); }, [id]);
  if (!data) return <Loading />;

  return (
    <div className="space-y-6">
      <Link to="/contractors" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft size={15} /> Back to Contractors</Link>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{data.name}</h2>
          <p className="text-sm text-slate-500">{data.contractor_code} · {data.mine_name}</p>
        </div>
        <Badge>{data.contract_status}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card><p className="text-2xl font-bold text-slate-800">{data.compliance_score}%</p><p className="text-xs text-slate-500">Compliance</p></Card>
        <Card><p className="text-2xl font-bold text-slate-800">{data.safety_score}%</p><p className="text-xs text-slate-500">Safety</p></Card>
        <Card><p className="text-2xl font-bold text-slate-800">{data.attendance_score}%</p><p className="text-xs text-slate-500">Attendance</p></Card>
      </div>
      <Card title="Documents" noPad>
        <Table columns={[{ key: 'name', label: 'Document' }, { key: 'expiry_date', label: 'Expiry' }, { key: 'status', label: 'Status' }]}
          rows={data.documents} renderRow={(d) => (<><Td>{d.name}</Td><Td>{d.expiry_date || '-'}</Td><Td><Badge>{d.status}</Badge></Td></>)} />
      </Card>
      <Card title="Workers" noPad>
        <Table columns={[{ key: 'worker_code', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'designation', label: 'Designation' }]}
          rows={data.workers} renderRow={(w) => (<><Td>{w.worker_code}</Td><Td>{w.name}</Td><Td>{w.designation}</Td></>)} />
      </Card>
    </div>
  );
}
