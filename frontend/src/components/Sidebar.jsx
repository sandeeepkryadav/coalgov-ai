import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { NAV_BY_ROLE, ROLE_LABELS } from '../config/nav';

export default function Sidebar({ role, collapsed }) {
  const items = NAV_BY_ROLE[role] || [];
  return (
    <aside className={`bg-navy-950 text-slate-300 h-screen sticky top-0 flex flex-col transition-all ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center gap-2 px-4 h-16 border-b border-white/10 shrink-0">
        <div className="bg-blue-600 rounded-lg p-1.5"><Shield size={18} className="text-white" /></div>
        {!collapsed && <span className="font-bold text-white tracking-tight">CoalGov AI</span>}
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-300'
              }`
            }
          >
            <item.icon size={18} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/10 text-xs text-slate-400">
          {ROLE_LABELS[role]}
        </div>
      )}
    </aside>
  );
}
