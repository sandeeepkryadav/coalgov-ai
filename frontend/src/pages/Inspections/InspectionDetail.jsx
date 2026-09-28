import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, Badge, Button, Select, Modal, Textarea, FileUpload, Loading, Table, Td } from '../../components/UI';

const WORKFLOW = ['Created', 'Assigned', 'In Progress', 'Findings Recorded', 'Corrective Action', 'Verification', 'Closed'];

export default function InspectionDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [findingModal, setFindingModal] = useState(false);
  const [finding, setFinding] = useState({ description: '', severity: 'Medium', recommendation: '', category: '', create_violation: false });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/inspections/${id}`).then((res) => setData(res.data.data)).catch(() => {});
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function changeStatus(status) {
    try {
      await api.put(`/inspections/${id}/status`, { status });
      toast.success(`Status updated to "${status}".`);
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  async function submitFinding() {
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(finding).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('evidence', file);
      await api.post(`/inspections/${id}/findings`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Finding recorded.');
      setFindingModal(false);
      setFinding({ description: '', severity: 'Medium', recommendation: '', category: '', create_violation: false });
      setFile(null);
      load();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }

  if (!data) return <Loading />;
  const currentIdx = WORKFLOW.indexOf(data.status);

  return (
    <div className="space-y-6">
      <Link to="/inspections" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft size={15} /> Back to Inspections</Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{data.inspection_code}</h2>
          <p className="text-sm text-slate-500">{data.mine_name} · {data.type} Inspection · Inspector: {data.inspector_name || 'Unassigned'}</p>
        </div>
        <Badge>{data.status}</Badge>
      </div>

      <Card title="Workflow Progress">
        <div className="flex items-center flex-wrap gap-2">
          {WORKFLOW.map((step, idx) => (
            <React.Fragment key={step}>
              <button onClick={() => changeStatus(step)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${idx <= currentIdx ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}>
                {step}
              </button>
              {idx < WORKFLOW.length - 1 && <div className={`h-0.5 w-4 ${idx < currentIdx ? 'bg-blue-600' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <Card title="Findings" action={<Button size="sm" icon={Plus} onClick={() => setFindingModal(true)}>Add Finding</Button>}>
        {data.findings.length === 0 ? <p className="text-sm text-slate-400">No findings recorded yet.</p> : (
          <div className="space-y-3">
            {data.findings.map((f) => (
              <div key={f.id} className="border border-slate-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">{f.description}</p>
                  <Badge>{f.severity}</Badge>
                </div>
                {f.recommendation && <p className="text-xs text-slate-500 mt-1">Recommendation: {f.recommendation}</p>}
                {f.evidence_path && <img src={f.evidence_path} alt="evidence" className="mt-2 h-24 rounded-lg border border-slate-100 object-cover" />}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Related Violations" noPad>
        {data.violations.length === 0 ? <p className="text-sm text-slate-400 p-5">No violations linked to this inspection.</p> : (
          <Table columns={[{ key: 'violation_code', label: 'Code' }, { key: 'category', label: 'Category' }, { key: 'severity', label: 'Severity' }, { key: 'status', label: 'Status' }]}
            rows={data.violations}
            renderRow={(v) => (<><Td>{v.violation_code}</Td><Td>{v.category}</Td><Td><Badge>{v.severity}</Badge></Td><Td><Badge>{v.status}</Badge></Td></>)} />
        )}
      </Card>

      <Modal open={findingModal} onClose={() => setFindingModal(false)} title="Record Finding"
        footer={<><Button variant="secondary" onClick={() => setFindingModal(false)}>Cancel</Button><Button onClick={submitFinding} disabled={busy || !finding.description}>{busy ? 'Saving...' : 'Save Finding'}</Button></>}>
        <div className="space-y-4">
          <Textarea label="Observation" value={finding.description} onChange={(e) => setFinding((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="e.g. PPE not used in working area" />
          <Select label="Severity" value={finding.severity} onChange={(e) => setFinding((f) => ({ ...f, severity: e.target.value }))} options={['Low', 'Medium', 'High']} />
          <Textarea label="Recommendation" value={finding.recommendation} onChange={(e) => setFinding((f) => ({ ...f, recommendation: e.target.value }))} rows={2} />
          <FileUpload label="Photo Evidence" onChange={setFile} accept="image/*" />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={finding.create_violation} onChange={(e) => setFinding((f) => ({ ...f, create_violation: e.target.checked }))} />
            Also raise a violation from this finding
          </label>
        </div>
      </Modal>
    </div>
  );
}
