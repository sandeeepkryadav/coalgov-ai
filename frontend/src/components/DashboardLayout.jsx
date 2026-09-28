import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({ title, children }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={user?.role} collapsed={collapsed} />

      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          title={title}
          onToggleSidebar={() => setCollapsed((c) => !c)}
        />

        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}