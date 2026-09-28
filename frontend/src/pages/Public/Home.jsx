import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ShieldCheck, HardHat, Factory, Leaf, Brain, ArrowRight, MapPin } from 'lucide-react';
import api from '../../services/api';

const NAV = ['Home', 'About', 'Features', 'Solutions', 'AI Analytics', 'Impact', 'Resources', 'Contact'];

export default function Home() {
  const [stats, setStats] = useState({ mines: 24, compliance: 94.8, inspections: 127, highRisk: 3 });

  useEffect(() => {
  api.get("/reports/summary")
    .then((res) => {
      setStats((s) => ({
        ...s,
        compliance: res.data.data?.complianceRate ?? s.compliance,
      }));
    })
    .catch(() => {
      // Guest user ke liye default stats hi dikhao
      console.log("Guest mode: using demo statistics.");
    });
}, []);

  return (
    <div className="bg-slate-50">
      <header className="sticky top-0 z-50 bg-navy-950/95 backdrop-blur-md text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <div className="bg-blue-600 rounded-lg p-1.5"><Shield size={16} /></div> CoalGov AI
          </div>
          <nav className="hidden lg:flex items-center gap-6 text-sm text-slate-300">
  {NAV.map((n) => (
    <a
      key={n}
      href={`#${n.toLowerCase().replace(/\s+/g, "-")}`}
      className="hover:text-white transition-colors duration-200"
    >
      {n}
    </a>
  ))}
</nav>
          <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-sm font-medium px-4 py-2 rounded-lg">Login</Link>
        </div>
      </header>

      <section id="home" className="bg-navy-950 text-white">
        <div className="max-w-7xl mx-auto px-6 pb-16 pt-10 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl font-bold leading-tight">Smart Governance for India's Coal Mining Ecosystem</h1>
            <p className="text-slate-300 mt-4 max-w-lg">AI-powered platform for compliance, safety, inspections, operations and transparent governance across the national coal mining network.</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link to="/register" className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-1.5">Explore Platform <ArrowRight size={15} /></Link>
              <a
  href="#features"
  className="border border-white/20 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white hover:text-navy-950 transition"
>
  View Features
</a>
              <Link to="/login" className="border border-white/20 px-5 py-2.5 rounded-lg text-sm font-medium">Login</Link>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-white/10 h-64">
  <img
    src="/images/coal-mine-hero.jpg"
    alt="Coal Mining Operations"
    className="w-full h-full object-cover"
  />
</div>
        </div>
      </section>

      <section id="features" className="max-w-7xl mx-auto px-6 -mt-8 relative z-10 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { icon: ShieldCheck, label: 'Governance & Compliance', color: 'text-emerald-600 bg-emerald-50' },
          { icon: HardHat, label: 'Safety & Inspection', color: 'text-amber-600 bg-amber-50' },
          { icon: Factory, label: 'Production & Operations', color: 'text-purple-600 bg-purple-50' },
          { icon: Leaf, label: 'Environment & Sustainability', color: 'text-green-600 bg-green-50' },
          { icon: Brain, label: 'AI Analytics & Insights', color: 'text-blue-600 bg-blue-50' }
        ].map((f) => (
          <div key={f.label} className="bg-white rounded-xl border border-slate-200 shadow-card p-4 text-center">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2 ${f.color}`}><f.icon size={18} /></div>
            <p className="text-xs font-medium text-slate-600">{f.label}</p>
          </div>
        ))}
      </section>

      <section id="about" className="max-w-7xl mx-auto px-6 py-14 grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="font-bold text-slate-800 mb-4">Real-time Insights</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Mines', value: stats.mines },
              { label: 'Compliance Rate', value: `${stats.compliance}%` },
              { label: 'Inspections (This Month)', value: stats.inspections },
              { label: 'High Risk Areas', value: stats.highRisk, danger: true }
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-card p-4">
                <p className={`text-2xl font-bold ${s.danger ? 'text-red-600' : 'text-slate-800'}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-1.5"><MapPin size={15} /> Mine Locations (GIS)</h3>
            <Link to="/gis-map" className="text-xs text-blue-600 hover:underline">View Map</Link>
          </div>
          <div className="h-40 rounded-lg bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center text-xs text-slate-400">Interactive GIS map available after login</div>
        </div>
      </section>
      {/* SOLUTIONS */}
<section id="solutions" className="bg-white py-16">
  <div className="max-w-7xl mx-auto px-6">
    <div className="text-center mb-10">
      <h2 className="text-3xl font-bold text-slate-800">
        AI-Powered Governance Solutions
      </h2>
      <p className="text-slate-500 mt-2">
        Digital transformation for India's coal mining ecosystem through AI,
        automation, compliance monitoring, and operational intelligence.
      </p>
    </div>

    <div className="grid md:grid-cols-3 gap-6">
      {[
        {
          title: "Safety & Inspection Management",
          desc: "Geo-tagged inspections, violations, corrective actions and real-time safety monitoring across mine sites.",
          color: "bg-amber-50 text-amber-600",
          icon: HardHat,
        },
        {
          title: "Compliance Monitoring",
          desc: "Track statutory compliance, deadlines, audits and regulatory reporting from one centralized platform.",
          color: "bg-emerald-50 text-emerald-600",
          icon: ShieldCheck,
        },
        {
          title: "Operations & Production Analytics",
          desc: "Monitor production trends, contractor performance, worker attendance and operational KPIs.",
          color: "bg-purple-50 text-purple-600",
          icon: Factory,
        },
      ].map((item) => (
        <div
          key={item.title}
          className="border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition"
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.color}`}
          >
            <item.icon size={24} />
          </div>

          <h3 className="font-semibold text-lg text-slate-800">
            {item.title}
          </h3>

          <p className="text-sm text-slate-500 mt-2">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
</section>

{/* AI ANALYTICS */}
<section id="ai-analytics" className="bg-slate-50 py-16">
  <div className="max-w-7xl mx-auto px-6">
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold text-slate-800">
        AI Analytics & Predictive Intelligence
      </h2>

      <p className="text-slate-500 mt-2">
        Advanced analytics for identifying high-risk mines, recurring safety
        violations, environmental breaches, and operational anomalies.
      </p>
    </div>

    <div className="grid lg:grid-cols-2 gap-8 items-center">
      <div className="space-y-5">
        {[
          "Predict accident risk score for each mine.",
          "Identify recurring compliance failures.",
          "Detect abnormal environmental readings.",
          "Generate AI recommendations for corrective actions.",
        ].map((item) => (
          <div
            key={item}
            className="flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-200"
          >
            <Brain className="text-blue-600 mt-1" size={20} />
            <p className="text-slate-600">{item}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-blue-900 to-navy-900 rounded-2xl p-8 text-white">
        <p className="text-sm text-blue-200 mb-2">AI Risk Prediction</p>

        <h3 className="text-4xl font-bold">92%</h3>

        <p className="mt-2 text-slate-300">
          AI Confidence Score for identifying potential safety risks before an
          incident occurs.
        </p>

        <div className="mt-8 space-y-4">
          {[
            ["Compliance Risk", "94%"],
            ["Safety Risk", "88%"],
            ["Environment Risk", "81%"],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span>{label}</span>
                <span>{value}</span>
              </div>

              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="bg-blue-400 h-full rounded-full w-4/5"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</section>
{/* IMPACT */}
<section id="impact" className="bg-white py-16">
  <div className="max-w-7xl mx-auto px-6">
    <div className="text-center mb-10">
      <h2 className="text-3xl font-bold text-slate-800">
        Expected National Impact
      </h2>

      <p className="text-slate-500 mt-2">
        CoalGov AI empowers regulators, mine operators, contractors and workers
        through transparent digital governance.
      </p>
    </div>

    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        ["24+", "Coal Mines Connected"],
        ["95%", "Compliance Visibility"],
        ["40%", "Faster Inspections"],
        ["30%", "Reduction in Safety Delays"],
      ].map(([value, label]) => (
        <div
          key={label}
          className="bg-slate-50 border rounded-2xl p-6 text-center"
        >
          <h3 className="text-4xl font-bold text-blue-600">{value}</h3>

          <p className="text-slate-500 mt-2 text-sm">{label}</p>
        </div>
      ))}
    </div>

    <div className="mt-12 grid md:grid-cols-3 gap-6">
      {[
        "Real-time governance dashboard for Coal India subsidiaries.",
        "AI-assisted inspections with predictive alerts.",
        "Improved transparency for regulatory authorities.",
      ].map((item) => (
        <div key={item} className="p-5 rounded-xl bg-blue-50 text-blue-900">
          {item}
        </div>
      ))}
    </div>
  </div>
</section>

{/* RESOURCES */}
<section id="resources" className="bg-slate-50 py-16">
  <div className="max-w-7xl mx-auto px-6">
    <div className="text-center mb-10">
      <h2 className="text-3xl font-bold text-slate-800">
        Resources & Documentation
      </h2>

      <p className="text-slate-500 mt-2">
        Access project documentation, compliance guidelines and implementation
        resources.
      </p>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        {
          title: "Mine Safety Guidelines",
          type: "PDF",
        },
        {
          title: "Environmental Monitoring Standards",
          type: "Report",
        },
        {
          title: "AI Risk Prediction Documentation",
          type: "Guide",
        },
        {
          title: "CoalGov API Documentation",
          type: "API",
        },
      ].map((doc) => (
        <div
          key={doc.title}
          className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition"
        >
          <p className="text-xs text-blue-600 font-semibold">{doc.type}</p>

          <h3 className="font-semibold text-slate-800 mt-2">{doc.title}</h3>

          <button className="mt-4 text-sm text-blue-600 hover:underline">
            View Resource →
          </button>
        </div>
      ))}
    </div>
  </div>
</section>
{/* CONTACT */}
<section id="contact" className="bg-navy-950 text-white py-16">
  <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10">
    <div>
      <h2 className="text-3xl font-bold">
        Contact CoalGov AI Team
      </h2>

      <p className="text-slate-300 mt-4">
        Smart India Hackathon 2026 Project – AI-Based Smart Governance &
        Compliance Monitoring Platform for Indian Coal Mines.
      </p>

      <div className="space-y-3 mt-8 text-slate-300">
        <p className="flex items-center gap-2">
          📍 Kashi Institute of Technology, Varanasi
        </p>

        <p className="flex items-center gap-2">
          📧 team@coalgovai.in
        </p>

        <p className="flex items-center gap-2">
          📞 +91 XXXXX XXXXX
        </p>
      </div>
    </div>

    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
      <h3 className="font-semibold mb-4">
        Send a Message
      </h3>

      <div className="space-y-4">
        <input
          placeholder="Your Name"
          className="w-full rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-slate-400"
        />

        <input
          placeholder="Email Address"
          className="w-full rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-slate-400"
        />

        <textarea
          rows={4}
          placeholder="Write your message..."
          className="w-full rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-slate-400"
        />

        <button className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-3 font-medium">
          Submit Message
        </button>
      </div>
    </div>
  </div>
</section>
      <footer id="contact" className="bg-navy-950 ...">
        © {new Date().getFullYear()} CoalGov AI · AI-Based Smart Governance and Compliance Monitoring System for Coal Mines
      </footer>
    </div>
  );
}
