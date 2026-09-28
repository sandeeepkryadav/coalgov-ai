import React, { useEffect, useState, useCallback } from 'react';
import { Upload, CheckCircle2, Lock, Search } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Badge, Table, Td, Modal, Textarea, FileUpload, Loading, EmptyState, ErrorState, Pagination } from '../../components/UI';

export default function CorrectiveActions() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [evidenceTarget, setEvidenceTarget] = useState(null);
  const [file, setFile] = useState(null);
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    api.get('/corrective-actions', { params: { page, limit: 10, search, status } })
      .then((res) => { setRows(res.data.data); setPagination(res.data.pagination); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  async function submitEvidence() {
    if (!file) return toast.error('Please choose a file first.');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('evidence', file);
      await api.post(`/corrective-actions/${evidenceTarget.id}/evidence`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Evidence uploaded — submitted for verification.');
      setEvidenceTarget(null); setFile(null); load();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }

  async function submitVerify(approved) {
    setBusy(true);
    try {
      await api.put(`/corrective-actions/${verifyTarget.id}/verify`, { approved, verification_notes: notes });
      toast.success(approved ? 'Corrective action verified.' : 'Sent back for rework.');
      setVerifyTarget(null); setNotes(''); load();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }

  async function closeAction(row) {
    try {
      await api.put(`/corrective-actions/${row.id}/close`);
      toast.success('Corrective action closed.');
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  const effectiveStatus = (row) => row.computed_status || row.status;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-800">Corrective Action Management</h2>

      <Card noPad>
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 flex-1">
            <Search size={15} className="text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search action code or finding..." className="bg-transparent text-sm outline-none flex-1" />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white">
            <option value="">All Status</option>
            {['Open', 'In Progress', 'Submitted for Verification', 'Verified', 'Closed', 'Overdue'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="p-5 pt-3">
          {loading ? <Loading /> : error ? <ErrorState onRetry={load} /> : rows.length === 0 ? <EmptyState title="No corrective actions found" /> : (
            <>
              <Table
                columns={[
                  { key: 'action_code', label: 'Code' }, { key: 'mine_name', label: 'Mine' }, { key: 'finding', label: 'Finding' },
                  { key: 'due_date', label: 'Due Date' }, { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status' }, { key: '_actions', label: '' }
                ]}
                rows={rows}
                renderRow={(row) => (
                  <>
                    <Td className="font-medium text-slate-800">{row.action_code}</Td>
                    <Td>{row.mine_name}</Td>
                    <Td className="max-w-xs truncate">{row.finding}</Td>
                    <Td>{row.due_date || '-'}</Td>
                    <Td><Badge>{row.priority}</Badge></Td>
                    <Td><Badge>{effectiveStatus(row)}</Badge></Td>
                    <Td className="text-right whitespace-nowrap">
                      {['Open', 'In Progress'].includes(row.status) && (
                        <button onClick={() => setEvidenceTarget(row)} className="p-1.5 text-slate-400 hover:text-blue-600" title="Upload evidence"><Upload size={15} /></button>
                      )}
                      {row.status === 'Submitted for Verification' && (
                        <button onClick={() => setVerifyTarget(row)} className="p-1.5 text-slate-400 hover:text-emerald-600" title="Verify"><CheckCircle2 size={15} /></button>
                      )}
                      {row.status === 'Verified' && (
                        <button onClick={() => closeAction(row)} className="p-1.5 text-slate-400 hover:text-slate-700" title="Close"><Lock size={15} /></button>
                      )}
                    </Td>
                  </>
                )}
              />
              <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onChange={setPage} />
            </>
          )}
        </div>
      </Card>

      <Modal open={!!evidenceTarget} onClose={() => { setEvidenceTarget(null); setFile(null); }} title={`Upload evidence — ${evidenceTarget?.action_code || ''}`}
        footer={<><Button variant="secondary" onClick={() => setEvidenceTarget(null)}>Cancel</Button><Button onClick={submitEvidence} disabled={busy}>{busy ? 'Uploading...' : 'Submit for Verification'}</Button></>}>
        <FileUpload label="Evidence file" onChange={setFile} />
      </Modal>

      <Modal open={!!verifyTarget} onClose={() => setVerifyTarget(null)} title={`Verify — ${verifyTarget?.action_code || ''}`}
        footer={<>
          <Button variant="secondary" onClick={() => submitVerify(false)} disabled={busy}>Reject / Rework</Button>
          <Button variant="success" onClick={() => submitVerify(true)} disabled={busy}>Approve &amp; Verify</Button>
        </>}>
        <Textarea label="Verification notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Optional remarks about the verification..." />
      </Modal>
    </div>
  );
}
