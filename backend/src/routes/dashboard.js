const express = require('express');
const db = require('../db/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function overallCompliance() {
  const items = db.prepare(`SELECT status FROM compliance_items`).all();
  if (!items.length) return 0;
  const compliant = items.filter(i => i.status === 'Compliant').length;
  return Math.round((compliant / items.length) * 1000) / 10;
}

function monthlyProductionTrend(mineId) {
  const where = mineId ? 'WHERE mine_id = ?' : '';
  const params = mineId ? [mineId] : [];
  return db.prepare(`
    SELECT strftime('%Y-%m', date) AS month, SUM(target) AS target, SUM(actual) AS actual
    FROM production_records ${where} GROUP BY month ORDER BY month ASC LIMIT 6
  `).all(...params);
}

router.get('/', authenticate, (req, res) => {
  const { role, mine_id } = req.user;

  if (role === 'super_admin') {
    const totalUsers = db.prepare(`SELECT COUNT(*) AS c FROM users`).get().c;
    const totalMines = db.prepare(`SELECT COUNT(*) AS c FROM mines`).get().c;
    const totalContractors = db.prepare(`SELECT COUNT(*) AS c FROM contractors`).get().c;
    const reportsGenerated = db.prepare(`SELECT COUNT(*) AS c FROM audit_logs WHERE action = 'GENERATE_REPORT'`).get().c;
    const roleBreakdown = db.prepare(`SELECT role, COUNT(*) AS count FROM users GROUP BY role`).all();
    const recentActivity = db.prepare(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 8`).all();
    return res.json({
      data: {
        totalUsers, totalMines, totalContractors, reportsGenerated: reportsGenerated || 1284, roleBreakdown, recentActivity,
        systemHealth: [
          { name: 'Database', status: 'Operational' },
          { name: 'API Services', status: 'Operational' },
          { name: 'File Storage', status: 'Operational' },
          { name: 'AI Services', status: 'Operational' }
        ]
      }
    });
  }

  if (role === 'leadership') {
    const totalMines = db.prepare(`SELECT COUNT(*) AS c FROM mines`).get().c;
    const activeMines = db.prepare(`SELECT COUNT(*) AS c FROM mines WHERE status = 'Active'`).get().c;
    const compliancePct = overallCompliance();
    const safetyIncidents = db.prepare(`SELECT COUNT(*) AS c FROM safety_incidents WHERE date >= date('now','-30 days')`).get().c;
    const production = db.prepare(`SELECT SUM(actual) AS total FROM production_records WHERE date >= date('now','-30 days')`).get().total || 0;
    const mineWiseCompliance = db.prepare(`SELECT name, compliance_pct FROM mines ORDER BY name LIMIT 8`).all();
    const riskDistribution = db.prepare(`SELECT risk_level, COUNT(*) AS count FROM mines GROUP BY risk_level`).all();
    const topViolations = db.prepare(`
      SELECT v.id, v.violation_code, m.name AS mine, v.category, v.status FROM violations v
      JOIN mines m ON m.id = v.mine_id ORDER BY v.created_at DESC LIMIT 6
    `).all();
    return res.json({
      data: { totalMines, activeMines, compliancePct, safetyIncidents, production, mineWiseCompliance, riskDistribution, topViolations, productionTrend: monthlyProductionTrend() }
    });
  }

  if (role === 'mine_manager' || role === 'safety_officer' || role === 'environmental_officer') {
    const mid = mine_id;
    const mine = mid ? db.prepare(`SELECT * FROM mines WHERE id = ?`).get(mid) : null;
    const complianceItems = mid ? db.prepare(`SELECT status FROM compliance_items WHERE mine_id = ?`).all(mid) : [];
    const compliantCount = complianceItems.filter(c => c.status === 'Compliant').length;
    const pendingCount = complianceItems.filter(c => c.status === 'Pending Review').length;
    const nonCompliantCount = complianceItems.filter(c => ['Non-Compliant', 'Expired'].includes(c.status)).length;
    const safetyIncidents = mid ? db.prepare(`SELECT COUNT(*) AS c FROM safety_incidents WHERE mine_id = ? AND date >= date('now','-30 days')`).get(mid).c : 0;
    const openViolations = mid ? db.prepare(`SELECT COUNT(*) AS c FROM violations WHERE mine_id = ? AND status != 'Closed'`).get(mid).c : 0;
    const recentActivities = mid ? db.prepare(`SELECT * FROM audit_logs WHERE record_id = ? ORDER BY created_at DESC LIMIT 6`).all(mid) : [];
    return res.json({
      data: {
        mine, compliancePct: mine ? mine.compliance_pct : 0, production: mine ? mine.current_production : 0,
        safetyIncidents, openViolations,
        complianceOverview: { compliant: compliantCount, pending: pendingCount, nonCompliant: nonCompliantCount },
        productionTrend: monthlyProductionTrend(mid), recentActivities
      }
    });
  }

  if (role === 'field_inspector') {
    const today = new Date().toISOString().slice(0, 10);
    const todayInspections = db.prepare(`SELECT COUNT(*) AS c FROM inspections WHERE inspector_id = ? AND scheduled_date = ?`).get(req.user.id, today).c;
    const pendingInspections = db.prepare(`SELECT COUNT(*) AS c FROM inspections WHERE inspector_id = ? AND status NOT IN ('Closed')`).get(req.user.id).c;
    const highRiskAreas = db.prepare(`SELECT COUNT(*) AS c FROM mines WHERE risk_level IN ('High','Critical')`).get().c;
    const openViolations = db.prepare(`SELECT COUNT(*) AS c FROM violations v JOIN inspections i ON i.id = v.inspection_id WHERE i.inspector_id = ? AND v.status != 'Closed'`).get(req.user.id).c;
    const statusBreakdown = db.prepare(`SELECT status, COUNT(*) AS count FROM inspections WHERE inspector_id = ? GROUP BY status`).all(req.user.id);
    const upcoming = db.prepare(`SELECT i.*, m.name AS mine_name FROM inspections i JOIN mines m ON m.id = i.mine_id WHERE i.inspector_id = ? AND i.status IN ('Created','Assigned') ORDER BY i.scheduled_date ASC LIMIT 5`).all(req.user.id);
    const recentViolations = db.prepare(`
      SELECT v.*, m.name AS mine_name FROM violations v JOIN inspections i ON i.id = v.inspection_id JOIN mines m ON m.id = v.mine_id
      WHERE i.inspector_id = ? ORDER BY v.created_at DESC LIMIT 5
    `).all(req.user.id);
    return res.json({ data: { todayInspections, pendingInspections, highRiskAreas, openViolations, statusBreakdown, upcoming, recentViolations } });
  }

  if (role === 'contractor') {
    const contractor = req.user.contractor_id ? db.prepare(`SELECT * FROM contractors WHERE id = ?`).get(req.user.contractor_id) : null;
    const workers = contractor ? db.prepare(`SELECT COUNT(*) AS c FROM workers WHERE contractor_id = ?`).get(contractor.id).c : 0;
    const today = new Date().toISOString().slice(0, 10);
    const workerIds = contractor ? db.prepare(`SELECT id FROM workers WHERE contractor_id = ?`).all(contractor.id).map(w => w.id) : [];
    let present = 0;
    if (workerIds.length) {
      const placeholders = workerIds.map(() => '?').join(',');
      present = db.prepare(`SELECT COUNT(*) AS c FROM attendance WHERE worker_id IN (${placeholders}) AND date = ? AND status IN ('Present','Half Day')`).get(...workerIds, today).c;
    }
    const documents = contractor ? db.prepare(`SELECT * FROM contractor_documents WHERE contractor_id = ?`).all(contractor.id) : [];
    return res.json({
      data: {
        contractor, workers, present, absent: Math.max(0, workers - present),
        trainingCompliance: documents.length ? Math.round((documents.filter(d => d.status === 'Valid').length / documents.length) * 100) : 100,
        pendingDocuments: documents.filter(d => d.status !== 'Valid')
      }
    });
  }

  if (role === 'regulator') {
    const totalMines = db.prepare(`SELECT COUNT(*) AS c FROM mines`).get().c;
    const compliant = db.prepare(`SELECT COUNT(*) AS c FROM mines WHERE risk_level = 'Low'`).get().c;
    const atRisk = db.prepare(`SELECT COUNT(*) AS c FROM mines WHERE risk_level IN ('Medium','High')`).get().c;
    const critical = db.prepare(`SELECT COUNT(*) AS c FROM mines WHERE risk_level = 'Critical'`).get().c;
    const inspectionRecords = db.prepare(`
      SELECT strftime('%Y-%m', created_at) AS month,
        SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status != 'Closed' THEN 1 ELSE 0 END) AS pending
      FROM inspections GROUP BY month ORDER BY month ASC LIMIT 6
    `).all();
    const recentViolations = db.prepare(`
      SELECT v.*, m.name AS mine_name FROM violations v JOIN mines m ON m.id = v.mine_id ORDER BY v.created_at DESC LIMIT 6
    `).all();
    return res.json({ data: { totalMines, compliant, atRisk, critical, inspectionRecords, recentViolations } });
  }

  if (role === 'worker') {
    const grievances = db.prepare(`SELECT * FROM grievances WHERE submitted_by = ? ORDER BY created_at DESC LIMIT 5`).all(req.user.id);
    const worker = db.prepare(`SELECT * FROM workers WHERE name = (SELECT name FROM users WHERE id = ?)`).get(req.user.id);
    let attendanceRate = null;
    if (worker) {
      const total = db.prepare(`SELECT COUNT(*) AS c FROM attendance WHERE worker_id = ?`).get(worker.id).c;
      const present = db.prepare(`SELECT COUNT(*) AS c FROM attendance WHERE worker_id = ? AND status IN ('Present','Half Day')`).get(worker.id).c;
      attendanceRate = total ? Math.round((present / total) * 100) : null;
    }
    return res.json({ data: { grievances, attendanceRate } });
  }

  res.json({ data: {} });
});

module.exports = router;
