import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useMineOptions } from '../../hooks/useLookups';
import { Card, Button, Badge, Table, Td, Modal, Select, Input, Textarea, Loading, EmptyState, ErrorState, Pagination } from '../../components/UI';

const TYPES = ['Safety', 'Environmental', 'Labour', 'Equipment', 'Statutory', 'Production', 'Contractor'];
const STATUSES = ['Created', 'Assigned', 'In Progress', 'Findings Recorded', 'Corrective Action', 'Verification', 'Closed'];

export default function InspectionList() {
  const toast = useToast();
  const navigate = useNavigate();
  const mineOptions = useMineOptions();
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ mine_id: '', type: 'Safety', priority: 'Medium', scheduled_date: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    api.get('/inspections', { params: { page, limit: 10, search, status } })
      .then((res) => { setRows(res.data.data); setPagination(res.data.pagination); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    setSaving(true);
    try {
      await api.post('/inspections', form);
      toast.success('Inspection created.');
      setModalOpen(false);
      load();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Inspections</h2>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>New Inspection</Button>
      </div>

      <Card noPad>
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 flex-1">
            <Search size={15} className="text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search inspection code..." className="bg-transparent text-sm outline-none flex-1" />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white">
            <option value="">All Status</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="p-5 pt-3">
          {loading ? <Loading /> : error ? <ErrorState onRetry={load} /> : rows.length === 0 ? <EmptyState title="No inspections found" action={<Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>New Inspection</Button>} /> : (
            <>
              <Table
                columns={[{ key: 'inspection_code', label: 'Code' }, { key: 'mine_name', label: 'Mine' }, { key: 'type', label: 'Type' }, { key: 'inspector_name', label: 'Inspector' }, { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status' }]}
                rows={rows}
                renderRow={(i) => (
                  <>
                    <Td className="font-medium text-slate-800"><button className="text-blue-600 hover:underline" onClick={() => navigate(`/inspections/${i.id}`)}>{i.inspection_code}</button></Td>
                    <Td>{i.mine_name}</Td>
                    <Td>{i.type}</Td>
                    <Td>{i.inspector_name || 'Unassigned'}</Td>
                    <Td><Badge>{i.priority}</Badge></Td>
                    <Td><Badge>{i.status}</Badge></Td>
                  </>
                )}
              />
              <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onChange={setPage} />
            </>
          )}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Inspection"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving || !form.mine_id}>{saving ? 'Creating...' : 'Create Inspection'}</Button></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Mine" value={form.mine_id} onChange={(e) => setForm((f) => ({ ...f, mine_id: e.target.value }))} options={[{ value: '', label: 'Select mine' }, ...mineOptions]} />
          <Select label="Type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} options={TYPES} />
          <Select label="Priority" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} options={['Low', 'Medium', 'High']} />
          <Input label="Scheduled Date" type="date" value={form.scheduled_date} onChange={(e) => setForm((f) => ({ ...f, scheduled_date: e.target.value }))} />
          <div className="sm:col-span-2"><Textarea label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} /></div>
        </div>
      </Modal>
    </div>
  );
}
