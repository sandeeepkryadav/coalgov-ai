const db = require('../db/db');

/**
 * Deterministic, transparent risk-scoring engine.
 *
 * Risk Score (0-100) = Compliance Risk + Safety Risk + Environmental Risk
 *                     + Inspection Risk + Contractor Risk + Overdue Action Risk
 *
 * Each sub-score is capped so the total cannot exceed 100. The weights below
 * are intentionally documented so the "Why is this mine high risk?" panel in
 * the UI can show exactly how the number was produced - nothing here is a
 * black box or a random number.
 */

const WEIGHTS = {
  COMPLIANCE_MAX: 25, // based on % of non-compliant / expired compliance items
  SAFETY_MAX: 20,      // based on recent open safety incidents (severity weighted)
  ENVIRONMENTAL_MAX: 15, // based on threshold breaches in last 90 days
  INSPECTION_MAX: 15,  // based on open violations from inspections
  CONTRACTOR_MAX: 10,  // based on contractors below compliance threshold
  OVERDUE_ACTION_MAX: 15 // based on overdue corrective actions
};

function levelFor(score) {
  if (score <= 30) return 'Low';
  if (score <= 60) return 'Medium';
  if (score <= 80) return 'High';
  return 'Critical';
}

function calculateMineRisk(mineId) {
  const factors = [];
  let score = 0;

  // 1. Compliance risk
  const complianceItems = db.prepare(`SELECT status FROM compliance_items WHERE mine_id = ?`).all(mineId);
  const totalCompliance = complianceItems.length || 1;
  const badCompliance = complianceItems.filter(c => ['Non-Compliant', 'Expired'].includes(c.status)).length;
  const complianceRatio = badCompliance / totalCompliance;
  const complianceRisk = Math.round(complianceRatio * WEIGHTS.COMPLIANCE_MAX);
  score += complianceRisk;
  if (badCompliance > 0) factors.push({ label: `${badCompliance} non-compliant/expired compliance item(s)`, weight: complianceRisk });

  // 2. Safety risk - open safety incidents in last 180 days, severity weighted
  const incidents = db.prepare(`
    SELECT severity FROM safety_incidents
    WHERE mine_id = ? AND status != 'Closed' AND date >= date('now', '-180 days')
  `).all(mineId);
  const severityPoints = { Low: 1, Medium: 2, High: 3, Critical: 5 };
  const incidentPoints = incidents.reduce((sum, i) => sum + (severityPoints[i.severity] || 2), 0);
  const safetyRisk = Math.min(WEIGHTS.SAFETY_MAX, incidentPoints * 3);
  score += safetyRisk;
  if (incidents.length > 0) factors.push({ label: `${incidents.length} recent open safety incident(s)`, weight: safetyRisk });

  // 3. Environmental risk - threshold breaches in last 90 days
  const breaches = db.prepare(`
    SELECT COUNT(*) AS c FROM environmental_records
    WHERE mine_id = ? AND status = 'Breach' AND recorded_at >= date('now', '-90 days')
  `).get(mineId).c;
  const envRisk = Math.min(WEIGHTS.ENVIRONMENTAL_MAX, breaches * 4);
  score += envRisk;
  if (breaches > 0) factors.push({ label: `Environmental threshold exceeded ${breaches} time(s)`, weight: envRisk });

  // 4. Inspection / violation risk - open violations
  const openViolations = db.prepare(`SELECT COUNT(*) AS c FROM violations WHERE mine_id = ? AND status != 'Closed'`).get(mineId).c;
  const inspectionRisk = Math.min(WEIGHTS.INSPECTION_MAX, openViolations * 3);
  score += inspectionRisk;
  if (openViolations > 0) factors.push({ label: `${openViolations} open violation(s)`, weight: inspectionRisk });

  // 5. Contractor risk - contractors below compliance threshold (80%) at this mine
  const weakContractors = db.prepare(`
    SELECT COUNT(*) AS c FROM contractors WHERE mine_id = ? AND compliance_score < 80
  `).get(mineId).c;
  const contractorRisk = Math.min(WEIGHTS.CONTRACTOR_MAX, weakContractors * 5);
  score += contractorRisk;
  if (weakContractors > 0) factors.push({ label: `${weakContractors} contractor(s) below compliance threshold`, weight: contractorRisk });

  // 6. Overdue corrective action risk
  const overdue = db.prepare(`
    SELECT COUNT(*) AS c FROM corrective_actions
    WHERE mine_id = ? AND status NOT IN ('Closed','Verified') AND due_date < date('now')
  `).get(mineId).c;
  const overdueRisk = Math.min(WEIGHTS.OVERDUE_ACTION_MAX, overdue * 4);
  score += overdueRisk;
  if (overdue > 0) factors.push({ label: `${overdue} overdue corrective action(s)`, weight: overdueRisk });

  score = Math.min(100, Math.round(score));
  const level = levelFor(score);

  if (factors.length === 0) {
    factors.push({ label: 'No significant risk factors detected in current data', weight: 0 });
  }

  return { mineId, score, level, factors, breakdown: { complianceRisk, safetyRisk, envRisk, inspectionRisk, contractorRisk, overdueRisk } };
}

/** Recalculates risk for every mine, persists it, and raises notifications for newly high-risk mines. */
function recalculateAllRisk() {
  const mines = db.prepare(`SELECT id, risk_level, name FROM mines`).all();
  const results = [];
  const updateMine = db.prepare(`UPDATE mines SET risk_score = ?, risk_level = ?, updated_at = datetime('now') WHERE id = ?`);
  const insertHistory = db.prepare(`INSERT INTO risk_scores (mine_id, score, level, factors_json) VALUES (?, ?, ?, ?)`);
  const insertNotification = db.prepare(`
    INSERT INTO notifications (role_target, type, priority, message, module, related_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction((mines) => {
    for (const mine of mines) {
      const result = calculateMineRisk(mine.id);
      updateMine.run(result.score, result.level, mine.id);
      insertHistory.run(mine.id, result.score, result.level, JSON.stringify(result.factors));

      if ((result.level === 'High' || result.level === 'Critical') && mine.risk_level !== result.level) {
        insertNotification.run(
          'leadership',
          'High Risk Mine',
          result.level === 'Critical' ? 'Critical' : 'High',
          `${mine.name} risk level changed to ${result.level} (score ${result.score}).`,
          'analytics',
          mine.id
        );
      }
      results.push({ mineId: mine.id, name: mine.name, ...result });
    }
  });
  tx(mines);
  return results;
}

/** Detects mines/categories/contractors with repeated (recurring) violations. */
function detectRecurringViolations() {
  const byMine = db.prepare(`
    SELECT m.name AS mine, v.category, COUNT(*) AS count
    FROM violations v JOIN mines m ON m.id = v.mine_id
    GROUP BY v.mine_id, v.category
    HAVING COUNT(*) >= 2
    ORDER BY count DESC
  `).all();
  return byMine;
}

/** Simple anomaly detection on production: flags days where actual deviates >25% from the mine's trailing average. */
function detectProductionAnomalies() {
  const mines = db.prepare(`SELECT id, name FROM mines`).all();
  const anomalies = [];
  for (const mine of mines) {
    const records = db.prepare(`
      SELECT date, actual FROM production_records WHERE mine_id = ? ORDER BY date DESC LIMIT 30
    `).all(mine.id);
    if (records.length < 5) continue;
    const avg = records.reduce((s, r) => s + r.actual, 0) / records.length;
    records.forEach(r => {
      if (avg > 0 && Math.abs(r.actual - avg) / avg > 0.25) {
        anomalies.push({ mine: mine.name, date: r.date, actual: r.actual, average: Math.round(avg) });
      }
    });
  }
  return anomalies.slice(0, 25);
}

/** Generates actionable AI recommendations grounded in real current data. */
function generateRecommendations() {
  const recs = [];
  const highRiskMines = db.prepare(`SELECT id, name, risk_level FROM mines WHERE risk_level IN ('High','Critical')`).all();
  highRiskMines.forEach(m => recs.push({
    mine: m.name,
    priority: m.risk_level === 'Critical' ? 'Critical' : 'High',
    recommendation: `Schedule an urgent safety & compliance inspection at ${m.name} (risk level: ${m.risk_level}).`
  }));

  const overdueByMine = db.prepare(`
    SELECT m.name AS mine, COUNT(*) AS c FROM corrective_actions ca
    JOIN mines m ON m.id = ca.mine_id
    WHERE ca.status NOT IN ('Closed','Verified') AND ca.due_date < date('now')
    GROUP BY ca.mine_id HAVING c > 0
  `).all();
  overdueByMine.forEach(o => recs.push({
    mine: o.mine,
    priority: 'High',
    recommendation: `Review ${o.c} overdue corrective action(s) at ${o.mine} before next audit.`
  }));

  const weakContractors = db.prepare(`
    SELECT c.name AS contractor, m.name AS mine FROM contractors c
    JOIN mines m ON m.id = c.mine_id WHERE c.compliance_score < 75
  `).all();
  weakContractors.forEach(c => recs.push({
    mine: c.mine,
    priority: 'Medium',
    recommendation: `Inspect contractor "${c.contractor}" at ${c.mine} - compliance score below 75%.`
  }));

  const envBreaches = db.prepare(`
    SELECT m.name AS mine, e.parameter, COUNT(*) AS c FROM environmental_records e
    JOIN mines m ON m.id = e.mine_id
    WHERE e.status = 'Breach' AND e.recorded_at >= date('now','-30 days')
    GROUP BY e.mine_id, e.parameter HAVING c > 0
  `).all();
  envBreaches.forEach(e => recs.push({
    mine: e.mine,
    priority: 'Medium',
    recommendation: `Review environmental monitoring for ${e.parameter} at ${e.mine} (${e.c} breach(es) in last 30 days).`
  }));

  const ppeIssues = db.prepare(`
    SELECT m.name AS mine, COUNT(*) AS c FROM safety_observations so
    JOIN mines m ON m.id = so.mine_id WHERE so.ppe_compliant = 0
    GROUP BY so.mine_id HAVING c > 0
  `).all();
  ppeIssues.forEach(p => recs.push({
    mine: p.mine,
    priority: 'Medium',
    recommendation: `Conduct a PPE compliance audit at ${p.mine} (${p.c} non-compliant observation(s)).`
  }));

  return recs.slice(0, 30);
}

module.exports = {
  calculateMineRisk,
  recalculateAllRisk,
  detectRecurringViolations,
  detectProductionAnomalies,
  generateRecommendations
};
