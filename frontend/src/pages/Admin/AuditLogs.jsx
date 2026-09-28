import React, { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import api from '../../services/api';
import { Card, Table, Td, Badge, Loading, EmptyState, ErrorState, Pagination } from '../../components/UI';

export default function AuditLogs() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    api.get('/audit-logs', { params: { page, limit: 15, search } })
      .then((res) => { setRows(res.data.data); setPagination(res.data.pagination); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-800">Audit Trail</h2>
      <Card noPad>
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 max-w-md">
            <Search size={15} className="text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by user, action or module..." className="bg-transparent text-sm outline-none flex-1" />
          </div>
        </div>
        <div className="p-5 pt-3">
          {loading ? <Loading /> : error ? <ErrorState onRetry={load} /> : rows.length === 0 ? <EmptyState title="No audit records found" /> : (
            <>
              <Table
                columns={[{ key: 'created_at', label: 'Time' }, { key: 'user_name', label: 'User' }, { key: 'role', label: 'Role' }, { key: 'action', label: 'Action' }, { key: 'module', label: 'Module' }, { key: 'record_id', label: 'Record ID' }]}
                rows={rows}
                renderRow={(row) => (
                  <>
                    <Td className="whitespace-nowrap text-xs text-slate-500">{row.created_at}</Td>
                    <Td>{row.user_name}</Td>
                    <Td><Badge>{row.role}</Badge></Td>
                    <Td className="font-medium">{row.action}</Td>
                    <Td>{row.module}</Td>
                    <Td>{row.record_id ?? '-'}</Td>
                  </>
                )}
              />
              <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onChange={setPage} />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
