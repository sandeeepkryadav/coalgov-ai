import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../../services/api';
import { Card, Badge, Button, Loading, EmptyState } from '../../components/UI';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/notifications').then((res) => setItems(res.data.data)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function markAllRead() {
    await api.put('/notifications/read-all');
    load();
  }

  async function markRead(id) {
    await api.put(`/notifications/${id}/read`);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Notifications</h2>
        <Button variant="secondary" size="sm" icon={CheckCheck} onClick={markAllRead}>Mark all as read</Button>
      </div>
      <Card noPad>
        {loading ? <div className="p-5"><Loading /></div> : items.length === 0 ? <div className="p-5"><EmptyState icon={Bell} title="You're all caught up" message="No notifications right now." /></div> : (
          <div className="divide-y divide-slate-50">
            {items.map((n) => (
              <div key={n.id} onClick={() => !n.is_read && markRead(n.id)} className={`px-5 py-4 flex items-start gap-3 cursor-pointer ${!n.is_read ? 'bg-blue-50/40' : ''}`}>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0"><Bell size={16} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-slate-800">{n.type}</p>
                    <Badge>{n.priority}</Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{n.created_at}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
