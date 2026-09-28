import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, Badge, Table, Td, Loading, Button, Modal, Input, FileUpload } from '../../components/UI';

export default function ContractorDetails() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', expiry_date: '' });
  const [saving, setSaving] = useState(false);

  function load() {
    if (!user?.contractor_id) return;
    api.get(`/contractors/${user.contractor_id}`).then((res) => setData(res.data.data));
  }
  useEffect(() => { load(); }, [user]);

  async function addDocument() {
    setSaving(true);
    try {
      await api.post(`/contractors/${user.contractor_id}/documents`, form);
      toast.success('Document added.');
      setModalOpen(false);
      setForm({ name: '', expiry_date: '' });
      load();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  }

  if (!user?.contractor_id) return <Card><p className="text-sm text-slate-500">No contractor profile is linked to this account.</p></Card>;
  if (!data) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{data.name}</h2>
          <p className="text-sm text-slate-500">{data.contractor_code} · {data.mine_name}</p>
        </div>
        <Badge>{data.contract_status}</Badge>
      </div>

      <Card title="Contract Information">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><p className="text-slate-400 text-xs">Start Date</p><p className="font-medium text-slate-700">{data.contract_start || '-'}</p></div>
          <div><p className="text-slate-400 text-xs">End Date</p><p className="font-medium text-slate-700">{data.contract_end || '-'}</p></div>
          <div><p className="text-slate-400 text-xs">Compliance Score</p><p className="font-medium text-slate-700">{data.compliance_score}%</p></div>
          <div><p className="text-slate-400 text-xs">Safety Score</p><p className="font-medium text-slate-700">{data.safety_score}%</p></div>
        </div>
      </Card>

      <Card title="Documents" action={<Button size="sm" onClick={() => setModalOpen(true)}>Add Document</Button>} noPad>
        <Table columns={[{ key: 'name', label: 'Document' }, { key: 'expiry_date', label: 'Expiry' }, { key: 'status', label: 'Status' }]}
          rows={data.documents}
          renderRow={(d) => (<><Td>{d.name}</Td><Td>{d.expiry_date || '-'}</Td><Td><Badge>{d.status}</Badge></Td></>)} />
      </Card>

      <Card title="Workers" noPad>
        <Table columns={[{ key: 'worker_code', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'designation', label: 'Designation' }]}
          rows={data.workers}
          renderRow={(w) => (<><Td>{w.worker_code}</Td><Td>{w.name}</Td><Td>{w.designation}</Td></>)} />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Document"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={addDocument} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></>}>
        <div className="space-y-4">
          <Input label="Document Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Expiry Date" type="date" value={form.expiry_date} onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}
