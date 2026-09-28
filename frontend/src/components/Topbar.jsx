import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronDown, LogOut, UserCircle, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../config/nav';
import api from '../services/api';

export default function Topbar({ title, onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    api.get('/notifications').then((res) => {
      setNotifications(res.data.data.slice(0, 6));
      setUnread(res.data.unreadCount);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onToggleSidebar} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 shrink-0"><Menu size={18} /></button>
        <h1 className="font-semibold text-slate-800 truncate">{title}</h1>
      </div>

      <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 w-72">
        <Search size={15} className="text-slate-400" />
        <input placeholder="Global search..." className="bg-transparent text-sm outline-none flex-1" />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen((v) => !v)} className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <Bell size={18} />
            {unread > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 font-medium text-sm">Notifications</div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 && <p className="text-sm text-slate-400 px-4 py-6 text-center">No notifications yet.</p>}
                {notifications.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b border-slate-50 text-sm ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                    <p className="font-medium text-slate-700">{n.type}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{n.message}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => { navigate('/notifications'); setNotifOpen(false); }} className="w-full text-center text-xs text-blue-600 py-2 hover:bg-slate-50">View all</button>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 hover:bg-slate-100 rounded-lg px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
              {user?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-700 leading-tight">{user?.name}</p>
              <p className="text-xs text-slate-400 leading-tight">{ROLE_LABELS[user?.role]}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden text-sm">
              <button onClick={() => { navigate('/profile'); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-slate-700">
                <UserCircle size={15} /> Profile
              </button>
              <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-red-600">
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
