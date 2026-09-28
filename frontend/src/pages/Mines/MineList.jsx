import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Badge, Table, Td, Modal, Input, Select, Loading, EmptyState, ErrorState, Pagination } from '../../components/UI';

export default function MineList() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', state: '', district: '', production_capacity: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    api.get('/mines', { params: { page, limit: 10, search, risk_level: riskLevel } })
      .then((res) => { setRows(res.data.data); setPagination(res.data.pagination); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [page, search, riskLevel]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    setSaving(true);
    try {
      await api.post('/mines', form);
      toast.success('Mine added successfully.');
      setModalOpen(false);
      setForm({ name: '', location: '', state: '', district: '', production_capacity: '' });
      load();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  }

  const canCreate = ['super_admin', 'leadership'].includes(user?.role);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Mines</h2>
        {canCreate && <Button icon={Plus} onClick={() => setModalOpen(true)}>Add Mine</Button>}
      </div>

      <Card noPad>
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 flex-1">
            <Search size={15} className="text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search mine name, code or location..." className="bg-transparent text-sm outline-none flex-1" />
          </div>
          <select value={riskLevel} onChange={(e) => { setRiskLevel(e.target.value); setPage(1); }} className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white">
            <option value="">All Risk Levels</option>
            {['Low', 'Medium', 'High', 'Critical'].map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="p-5 pt-3">
          {loading ? <Loading /> : error ? <ErrorState onRetry={load} /> : rows.length === 0 ? <EmptyState title="No mines found" /> : (
            <>
              <Table
                columns={[{ key: 'mine_code', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'state', label: 'State' }, { key: 'manager_name', label: 'Manager' }, { key: 'compliance_pct', label: 'Compliance' }, { key: 'risk_level', label: 'Risk' }, { key: 'status', label: 'Status' }]}
                rows={rows}
                renderRow={(m) => (
                  <>
                    <Td className="font-medium text-slate-800">{m.mine_code}</Td>
                    <Td><button className="text-blue-600 hover:underline text-left" onClick={() => navigate(`/mines/${m.id}`)}>{m.name}</button></Td>
                    <Td>{m.state}</Td>
                    <Td>{m.manager_name || '-'}</Td>
                    <Td>{m.compliance_pct?.toFixed ? m.compliance_pct.toFixed(1) : m.compliance_pct}%</Td>
                    <Td><Badge>{m.risk_level}</Badge></Td>
                    <Td><Badge>{m.status}</Badge></Td>
                  </>
                )}
              />
              <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onChange={setPage} />
            </>
          )}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Mine"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><Input label="Mine Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <Input label="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          <Input label="State" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
          <Input label="District" value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} />
          <Input label="Production Capacity (T)" type="number" value={form.production_capacity} onChange={(e) => setForm((f) => ({ ...f, production_capacity: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}
