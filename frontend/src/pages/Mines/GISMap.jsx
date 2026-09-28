import React, { useEffect, useState } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import api from '../../services/api';
import { Badge, Button, Loading } from '../../components/UI';

const RISK_COLOR = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444', Critical: '#991b1b' };

export default function GISMap() {
  const [mines, setMines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/mines', { params: { limit: 100 } }).then((res) => setMines(res.data.data)).finally(() => setLoading(false));
  }, []);

  const filtered = mines.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
  const lats = mines.map((m) => m.lat).filter(Boolean);
  const lngs = mines.map((m) => m.lng).filter(Boolean);
  const bounds = { minLat: Math.min(...lats, 20), maxLat: Math.max(...lats, 25), minLng: Math.min(...lngs, 82), maxLng: Math.max(...lngs, 87) };

  function project(m) {
    if (!m.lat || !m.lng) return { left: '50%', top: '50%' };
    const left = ((m.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1)) * 100;
    const top = 100 - ((m.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1)) * 100;
    return { left: `${Math.min(95, Math.max(5, left))}%`, top: `${Math.min(90, Math.max(10, top))}%` };
  }

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-800">GIS Mine Map</h2>
      <div className="relative bg-gradient-to-br from-emerald-100 via-emerald-50 to-blue-50 rounded-xl border border-slate-200 h-[70vh] overflow-hidden">
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-card flex items-center gap-2 px-3 py-2 w-72">
          <Search size={15} className="text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search mines, locations..." className="bg-transparent text-sm outline-none flex-1" />
        </div>

        {filtered.map((m) => {
          const pos = project(m);
          return (
            <button key={m.id} style={pos} onClick={() => setSelected(m)}
              className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center group">
              <MapPin size={28} fill={RISK_COLOR[m.risk_level] || '#2563eb'} className="text-white drop-shadow" strokeWidth={1} />
              <span className="text-[10px] bg-white/90 px-1.5 py-0.5 rounded mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{m.name}</span>
            </button>
          );
        })}

        {selected && (
          <div className="absolute top-4 right-4 z-10 bg-white rounded-xl shadow-xl p-4 w-64">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-slate-800">{selected.name}</p>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <div className="space-y-1.5 text-sm text-slate-600">
              <div className="flex justify-between"><span>Production</span><span className="font-medium">{Math.round(selected.current_production)} T</span></div>
              <div className="flex justify-between"><span>Compliance</span><span className="font-medium">{selected.compliance_pct?.toFixed ? selected.compliance_pct.toFixed(0) : selected.compliance_pct}%</span></div>
              <div className="flex justify-between items-center"><span>Risk</span><Badge>{selected.risk_level}</Badge></div>
              <div className="flex justify-between"><span>State</span><span className="font-medium">{selected.state}</span></div>
            </div>
            <a href={`/mines/${selected.id}`} className="block mt-3">
              <Button size="sm" className="w-full">View Details</Button>
            </a>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400">Marker positions are approximated from each mine's coordinates for demo purposes. Marker color reflects the live AI risk level.</p>
    </div>
  );
}
