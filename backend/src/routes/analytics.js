const express = require('express');
const db = require('../db/db');
const { authenticate, authorize } = require('../middleware/auth');
const { calculateMineRisk, recalculateAllRisk, detectRecurringViolations, detectProductionAnomalies, generateRecommendations } = require('../utils/ai');

const router = express.Router();

router.get('/risk', authenticate, (req, res) => {
  const { mine_id } = req.query;
  if (mine_id) return res.json({ data: calculateMineRisk(Number(mine_id)) });

  const mines = db.prepare(`SELECT id, name FROM mines`).all();
  const scores = mines.map(m => ({ mine: m.name, ...calculateMineRisk(m.id) }))
    .sort((a, b) => b.score - a.score);
  const trend = db.prepare(`
    SELECT strftime('%Y-%m', created_at) AS month, ROUND(AVG(score)) AS avgScore
    FROM risk_scores GROUP BY month ORDER BY month ASC LIMIT 6
  `).all();
  res.json({ data: { scores, trend, topHighRisk: scores.slice(0, 5) } });
});

router.post('/risk/recalculate', authenticate, authorize('super_admin', 'leadership'), (req, res) => {
  const results = recalculateAllRisk();
  res.json({ data: results });
});

router.get('/recurring-violations', authenticate, (req, res) => {
  res.json({ data: detectRecurringViolations() });
});

router.get('/anomalies', authenticate, (req, res) => {
  res.json({ data: detectProductionAnomalies() });
});

router.get('/recommendations', authenticate, (req, res) => {
  res.json({ data: generateRecommendations() });
});

router.get('/insights', authenticate, (req, res) => {
  res.json({
    data: {
      riskSummary: recalculateAllRisk().sort((a, b) => b.score - a.score).slice(0, 5),
      recurringViolations: detectRecurringViolations().slice(0, 10),
      anomalies: detectProductionAnomalies().slice(0, 10),
      recommendations: generateRecommendations()
    }
  });
});

module.exports = router;
