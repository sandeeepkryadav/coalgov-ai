import React from 'react';
import { Loader2, Inbox, AlertTriangle, X, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';

export function Button({ children, variant = 'primary', size = 'md', className = '', icon: Icon, ...props }) {
  const base = 'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700'
  };
  const sizes = { sm: 'text-xs px-2.5 py-1.5', md: 'text-sm px-3.5 py-2', lg: 'text-sm px-5 py-2.5' };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

export function Card({ children, className = '', title, action, noPad = false }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-card ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
          {action}
        </div>
      )}
      <div className={noPad ? '' : 'p-5'}>{children}</div>
    </div>
  );
}

export function StatCard({ label, value, change, changeType, icon: Icon, iconColor = 'text-blue-600 bg-blue-50', tone }) {
  const toneStyles = {
    danger: 'bg-red-50 border-red-100',
    warning: 'bg-amber-50 border-amber-100',
    default: 'bg-white border-slate-200'
  };
  return (
    <div className={`rounded-xl border shadow-card p-4 ${toneStyles[tone] || toneStyles.default}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {change != null && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${changeType === 'down' ? 'text-emerald-600' : changeType === 'up-bad' ? 'text-red-600' : 'text-emerald-600'}`}>
              {changeType === 'down' ? <TrendingDown size={12} /> : <TrendingUp size={12} />} {change}
            </p>
          )}
        </div>
        {Icon && <div className={`p-2 rounded-lg ${iconColor}`}><Icon size={18} /></div>}
      </div>
    </div>
  );
}

export function ChartCard({ title, children, action }) {
  return (
    <Card title={title} action={action}>
      <div className="h-64">{children}</div>
    </Card>
  );
}

const BADGE_COLORS = {
  // Generic
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  High: 'bg-red-50 text-red-700 border-red-200',
  Critical: 'bg-red-100 text-red-800 border-red-300',
  // Status
  Compliant: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Partially Compliant': 'bg-amber-50 text-amber-700 border-amber-200',
  'Non-Compliant': 'bg-red-50 text-red-700 border-red-200',
  Expired: 'bg-red-50 text-red-700 border-red-200',
  'Pending Review': 'bg-slate-100 text-slate-600 border-slate-200',
  Open: 'bg-red-50 text-red-700 border-red-200',
  'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
  Closed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-slate-100 text-slate-500 border-slate-200',
  Verified: 'bg-blue-50 text-blue-700 border-blue-200',
  Overdue: 'bg-red-50 text-red-700 border-red-200',
  'Submitted for Verification': 'bg-blue-50 text-blue-700 border-blue-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Breach: 'bg-red-50 text-red-700 border-red-200',
  Warning: 'bg-amber-50 text-amber-700 border-amber-200',
  Normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Valid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Expiring Soon': 'bg-amber-50 text-amber-700 border-amber-200',
  Present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Absent: 'bg-red-50 text-red-700 border-red-200',
  Leave: 'bg-slate-100 text-slate-600 border-slate-200'
};

export function Badge({ children, color }) {
  const cls = BADGE_COLORS[children] || color || 'bg-slate-100 text-slate-600 border-slate-200';
  return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${cls}`}>{children}</span>;
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>}
      <input className={`w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`} {...props} />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>}
      <textarea className={`w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`} {...props} />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export function Select({ label, options = [], className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>}
      <select className={`w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${className}`} {...props}>
        {options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </div>
  );
}

export function FileUpload({ label, onChange, accept = 'image/*,.pdf', hint = 'JPG, PNG or PDF, up to 10MB' }) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>}
      <input type="file" accept={accept} onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="w-full text-sm border border-dashed border-slate-300 rounded-lg px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 file:text-xs" />
      <p className="text-xs text-slate-400 mt-1">{hint}</p>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message, danger = true, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>{loading ? 'Please wait...' : 'Confirm'}</Button>
      </>
    }>
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  );
}

export function Loading({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <Loader2 className="animate-spin mb-2" size={28} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ title = 'No records found', message = 'Try adjusting your filters or add a new record.', icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="p-3 bg-slate-100 rounded-full mb-3"><Icon size={24} className="text-slate-400" /></div>
      <p className="font-medium text-slate-600">{title}</p>
      <p className="text-sm text-slate-400 mt-1 max-w-xs">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong while loading this data.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="p-3 bg-red-50 rounded-full mb-3"><AlertTriangle size={24} className="text-red-500" /></div>
      <p className="font-medium text-slate-700">{message}</p>
      {onRetry && <Button className="mt-4" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Pagination({ page, pages, total, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-1 pt-4 text-sm text-slate-500">
      <span>Page {page} of {pages} · {total} records</span>
      <div className="flex gap-1">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronLeft size={16} /></button>
        <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

export function Table({ columns, rows, renderRow, keyField = 'id' }) {
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs text-slate-500 uppercase tracking-wide">
            {columns.map((c) => <th key={c.key} className="px-5 py-2.5 font-medium">{c.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((row) => (
            <tr key={row[keyField]} className="hover:bg-slate-50/70">
              {renderRow(row)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = '' }) {
  return <td className={`px-5 py-3 text-slate-700 ${className}`}>{children}</td>;
}
