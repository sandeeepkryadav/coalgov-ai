import React, { useEffect, useState } from 'react';
import { Brain, RefreshCw, TrendingUp, AlertOctagon, Lightbulb, Repeat } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Badge, Loading, Table, Td } from '../../components/UI';
import { TrendLineChart } from '../../components/Charts';

const TABS = [
  { key: 'risk', label: 'Risk Prediction', icon: TrendingUp },
  { key: 'anomaly', label: 'Anomaly Detection', icon: AlertOctagon },
  { key: 'recommendations', label: 'AI Recommendations', icon: Lightbulb },
  { key: 'recurring', label: 'Recurring Violations', icon: Repeat }
];

export default function AIAnalytics() {
  const toast = useToast();
  const [tab, setTab] = useState('risk');
  const [risk, setRisk] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  function loadAll() {
    setLoading(true);
    Promise.all([
      api.get('/analytics/risk'),
      api.get('/analytics/anomalies'),
      api.get('/analytics/recommendations'),
      api.get('/analytics/recurring-violations')
    ]).then(([r, a, rec, rv]) => {
      setRisk(r.data.data);
      setAnomalies(a.data.data);
      setRecommendations(rec.data.data);
      setRecurring(rv.data.data);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);

  async function runAnalysis() {
    setRecalculating(true);
    try {
      await api.post('/analytics/risk/recalculate');
      toast.success('AI risk analysis recalculated across all mines.');
      loadAll();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setRecalculating(false); }
  }

  if (loading) return <Loading />;
  const topMine = risk.scores[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-slate-800">AI Analytics</h2>
        </div>
        <Button icon={RefreshCw} onClick={runAnalysis} disabled={recalculating}>{recalculating ? 'Analyzing...' : 'Run Analysis'}</Button>
      </div>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'risk' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card title={`${topMine?.mine || 'No mines'}`} action={topMine && <Badge>{topMine.level} Risk</Badge>}>
            {topMine ? (
              <>
                <p className="text-3xl font-bold text-slate-800">{topMine.score}<span className="text-sm text-slate-400 font-normal">/100</span></p>
                <p className="text-xs text-slate-400 mb-3">Why is this mine high risk?</p>
                <ul className="space-y-1.5 text-sm text-slate-600">
                  {topMine.factors.map((f, idx) => <li key={idx}>• {f.label} <span className="text-slate-400">(+{f.weight})</span></li>)}
                </ul>
              </>
            ) : <p className="text-sm text-slate-400">No risk data available yet.</p>}
          </Card>
          <Card title="Risk Trend (Avg. across mines)">
            <div className="h-56">
              {risk.trend.length > 0 ? <TrendLineChart data={risk.trend} xKey="month" lines={[{ key: 'avgScore', name: 'Avg Risk Score' }]} /> : <p className="text-sm text-slate-400 pt-16 text-center">Run analysis a few times to build a trend.</p>}
            </div>
          </Card>
          <Card title="Top High-Risk Mines" noPad className="lg:col-span-2">
            <Table columns={[{ key: 'mine', label: 'Mine' }, { key: 'score', label: 'Score' }, { key: 'level', label: 'Level' }]}
              rows={risk.scores.slice(0, 8).map((s, i) => ({ ...s, id: i }))}
              renderRow={(s) => (<><Td className="font-medium">{s.mine}</Td><Td>{s.score}</Td><Td><Badge>{s.level}</Badge></Td></>)} />
          </Card>
        </div>
      )}

      {tab === 'anomaly' && (
        <Card title="Production Anomalies" noPad>
          {anomalies.length === 0 ? <p className="text-sm text-slate-400 p-5">No significant anomalies detected in current production data.</p> : (
            <Table columns={[{ key: 'mine', label: 'Mine' }, { key: 'date', label: 'Date' }, { key: 'actual', label: 'Actual (T)' }, { key: 'average', label: 'Trailing Avg (T)' }]}
              rows={anomalies.map((a, i) => ({ ...a, id: i }))}
              renderRow={(a) => (<><Td>{a.mine}</Td><Td>{a.date}</Td><Td>{a.actual}</Td><Td>{a.average}</Td></>)} />
          )}
        </Card>
      )}

      {tab === 'recommendations' && (
        <div className="space-y-3">
          {recommendations.length === 0 ? <Card><p className="text-sm text-slate-400">No recommendations right now — all monitored indicators look healthy.</p></Card> : recommendations.map((r, i) => (
            <Card key={i}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">{r.mine}</p>
                  <p className="text-sm text-slate-600 mt-1">{r.recommendation}</p>
                </div>
                <Badge>{r.priority}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'recurring' && (
        <Card title="Recurring Violations by Mine & Category" noPad>
          {recurring.length === 0 ? <p className="text-sm text-slate-400 p-5">No recurring violation patterns detected.</p> : (
            <Table columns={[{ key: 'mine', label: 'Mine' }, { key: 'category', label: 'Category' }, { key: 'count', label: 'Occurrences' }]}
              rows={recurring.map((r, i) => ({ ...r, id: i }))}
              renderRow={(r) => (<><Td>{r.mine}</Td><Td>{r.category}</Td><Td className="font-semibold">{r.count}</Td></>)} />
          )}
        </Card>
      )}
    </div>
  );
}
