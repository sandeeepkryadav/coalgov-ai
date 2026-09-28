import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, ClipboardList, Droplets, Leaf } from 'lucide-react';
import api from '../../services/api';

export default function Transparency() {
  const [summary, setSummary] = useState({ complianceRate: 93.7, totalViolations: 1284 });
  const [mineCount, setMineCount] = useState(42);

  useEffect(() => {
    api.get('/reports/summary').then((res) => setSummary(res.data.data)).catch(() => {});
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <div className="bg-blue-600 rounded-lg p-1.5 text-white"><Shield size={16} /></div> CoalGov AI
          </div>
          <nav className="hidden lg:flex items-center gap-6 text-sm text-slate-500">
            <span>Overview</span><span>Mines</span><span>Reports</span><span>FAQs</span><span>Contact</span>
          </nav>
          <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">Login</Link>
        </div>
      </header>

      <section className="bg-gradient-to-br from-emerald-900 to-navy-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <h1 className="text-3xl font-bold">Public Transparency</h1>
          <p className="text-slate-200 mt-2 max-w-lg">Building trust through open and accountable governance in coal mining.</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8">
            {[
              { label: 'Mines Covered', value: mineCount },
              { label: 'Compliance Rate', value: `${summary.complianceRate}%` },
              { label: 'Inspections', value: '1,284' },
              { label: 'Safety Observations', value: '3,421' },
              { label: 'Resolved Issues', value: '2,987' }
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-slate-200 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="font-bold text-slate-800 mb-4">Key Information</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: FileText, label: 'Compliance Summary' },
            { icon: ClipboardList, label: 'Inspection Records' },
            { icon: Droplets, label: 'Environment Data' },
            { icon: Leaf, label: 'Sustainability Metrics' }
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-slate-200 shadow-card p-5 text-center hover:shadow-md transition-shadow cursor-pointer">
              <c.icon size={22} className="mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium text-slate-700">{c.label}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center text-xs text-slate-400 py-6">A safer, cleaner and more sustainable future for India's coal mines.</footer>
    </div>
  );
}
