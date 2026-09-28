import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Download } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card, Button, Input, Select, Table, Td, Badge, Modal, ConfirmDialog, Loading, EmptyState, ErrorState, Pagination } from './UI';

/**
 * A single, fully-wired list+create+edit+delete page driven by a config object.
 * Every module built with this hits the real REST API (list/create/update/delete)
 * with real pagination, search and filters - no mock data anywhere.
 */
export default function ModulePage({ config }) {
  const { title, endpoint, columns, fields = [], filters = [], searchPlaceholder = 'Search...', canCreate = true, canEdit = true, canDelete = false, extraActions } = config;
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = { page, limit: 10, search, ...filterValues };
    api.get(endpoint, { params })
      .then((res) => { setRows(res.data.data); setPagination(res.data.pagination || { page: 1, pages: 1, total: res.data.data.length }); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [endpoint, page, search, filterValues]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    const initial = {};
    fields.forEach((f) => { initial[f.name] = f.default ?? ''; });
    setForm(initial);
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    const initial = {};
    fields.forEach((f) => { initial[f.name] = row[f.name] ?? ''; });
    setForm(initial);
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`${endpoint}/${editing.id}`, form);
        toast.success('Record updated successfully.');
      } else {
        await api.post(endpoint, form);
        toast.success('Record created successfully.');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`${endpoint}/${deleteTarget.id}`);
      toast.success('Record deleted.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <div className="flex items-center gap-2">
          {extraActions}
          {canCreate && fields.length > 0 && <Button icon={Plus} onClick={openCreate}>Add {title.replace(/s$/, '')}</Button>}
        </div>
      </div>

      <Card noPad>
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 flex-1">
            <Search size={15} className="text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={searchPlaceholder} className="bg-transparent text-sm outline-none flex-1" />
          </div>
          {filters.map((f) => (
            <select key={f.key} value={filterValues[f.key] || ''} onChange={(e) => { setFilterValues((v) => ({ ...v, [f.key]: e.target.value })); setPage(1); }}
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white">
              <option value="">{f.label}</option>
              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
        </div>

        <div className="p-5 pt-3">
          {loading ? <Loading /> : error ? <ErrorState onRetry={load} /> : rows.length === 0 ? (
            <EmptyState title={`No ${title.toLowerCase()} found`} action={canCreate && fields.length > 0 && <Button size="sm" icon={Plus} onClick={openCreate}>Add {title.replace(/s$/, '')}</Button>} />
          ) : (
            <>
              <Table
                columns={[...columns, ...(canEdit || canDelete ? [{ key: '_actions', label: '' }] : [])]}
                rows={rows}
                renderRow={(row) => (
                  <>
                    {columns.map((c) => (
                      <Td key={c.key}>{c.render ? c.render(row) : (c.badge ? <Badge>{row[c.key]}</Badge> : (row[c.key] ?? '-'))}</Td>
                    ))}
                    {(canEdit || canDelete) && (
                      <Td className="text-right whitespace-nowrap">
                        {canEdit && fields.length > 0 && <button onClick={() => openEdit(row)} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil size={15} /></button>}
                        {canDelete && <button onClick={() => setDeleteTarget(row)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={15} /></button>}
                      </Td>
                    )}
                  </>
                )}
              />
              <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onChange={setPage} />
            </>
          )}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${title.replace(/s$/, '')}` : `Add ${title.replace(/s$/, '')}`}
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.name} className={f.full ? 'sm:col-span-2' : ''}>
              {f.type === 'select' ? (
                <Select label={f.label} value={form[f.name] ?? ''} onChange={(e) => setForm((v) => ({ ...v, [f.name]: e.target.value }))} options={f.options} />
              ) : f.type === 'textarea' ? (
                <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}
                  <textarea value={form[f.name] ?? ''} onChange={(e) => setForm((v) => ({ ...v, [f.name]: e.target.value }))} rows={3}
                    className="w-full mt-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </label>
              ) : (
                <Input label={f.label} type={f.type || 'text'} value={form[f.name] ?? ''} onChange={(e) => setForm((v) => ({ ...v, [f.name]: e.target.value }))} />
              )}
            </div>
          ))}
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete record" message="This action cannot be undone. Are you sure you want to delete this record?" />
    </div>
  );
}
