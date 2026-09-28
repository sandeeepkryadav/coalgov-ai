const express = require('express');
const db = require('../db/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();
const ADMIN_ROLES = ['super_admin', 'leadership'];

router.get('/', authenticate, (req, res) => {
  const { search = '', state, risk_level, status, subsidiary_id, page = 1, limit = 50 } = req.query;
  let where = ' WHERE 1=1';
  const params = [];
  if (search) { where += ' AND (m.name LIKE ? OR m.mine_code LIKE ? OR m.location LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (state) { where += ' AND m.state = ?'; params.push(state); }
  if (risk_level) { where += ' AND m.risk_level = ?'; params.push(risk_level); }
  if (status) { where += ' AND m.status = ?'; params.push(status); }
  if (subsidiary_id) { where += ' AND m.subsidiary_id = ?'; params.push(subsidiary_id); }

  // Mine-level roles only see their own mine
  if (['mine_manager', 'safety_officer', 'environmental_officer', 'field_inspector'].includes(req.user.role) && req.user.mine_id) {
    where += ' AND m.id = ?'; params.push(req.user.mine_id);
  }

  const offset = (Number(page) - 1) * Number(limit);
  const total = db.prepare(`SELECT COUNT(*) AS c FROM mines m ${where}`).get(...params).c;
  const rows = db.prepare(`
    SELECT m.*, s.name AS subsidiary_name, u.name AS manager_name
    FROM mines m
    LEFT JOIN subsidiaries s ON s.id = m.subsidiary_id
    LEFT JOIN users u ON u.id = m.manager_id
    ${where} ORDER BY m.risk_score DESC LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  res.json({ data: rows, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
});

router.get('/:id', authenticate, (req, res) => {
  const mine = db.prepare(`
    SELECT m.*, s.name AS subsidiary_name, u.name AS manager_name
    FROM mines m LEFT JOIN subsidiaries s ON s.id = m.subsidiary_id
    LEFT JOIN users u ON u.id = m.manager_id WHERE m.id = ?
  `).get(req.params.id);
  if (!mine) return res.status(404).json({ error: 'Mine not found.' });
  res.json({ data: mine });
});

router.get('/:id/overview', authenticate, (req, res) => {
  const mineId = req.params.id;
  const mine = db.prepare(`SELECT * FROM mines WHERE id = ?`).get(mineId);
  if (!mine) return res.status(404).json({ error: 'Mine not found.' });

  const inspections = db.prepare(`SELECT COUNT(*) AS c FROM inspections WHERE mine_id = ?`).get(mineId).c;
  const openViolations = db.prepare(`SELECT COUNT(*) AS c FROM violations WHERE mine_id = ? AND status != 'Closed'`).get(mineId).c;
  const contractors = db.prepare(`SELECT COUNT(*) AS c FROM contractors WHERE mine_id = ?`).get(mineId).c;
  const workers = db.prepare(`SELECT COUNT(*) AS c FROM workers WHERE mine_id = ?`).get(mineId).c;
  const overdueActions = db.prepare(`SELECT COUNT(*) AS c FROM corrective_actions WHERE mine_id = ? AND status NOT IN ('Closed','Verified') AND due_date < date('now')`).get(mineId).c;
  const recentInspections = db.prepare(`SELECT * FROM inspections WHERE mine_id = ? ORDER BY created_at DESC LIMIT 5`).all(mineId);
  const recentViolations = db.prepare(`SELECT * FROM violations WHERE mine_id = ? ORDER BY created_at DESC LIMIT 5`).all(mineId);
  const auditHistory = db.prepare(`SELECT * FROM audit_logs WHERE module IN ('mines') AND record_id = ? ORDER BY created_at DESC LIMIT 10`).all(mineId);

  res.json({
    data: { mine, stats: { inspections, openViolations, contractors, workers, overdueActions }, recentInspections, recentViolations, auditHistory }
  });
});

router.post('/', authenticate, authorize(...ADMIN_ROLES), (req, res, next) => {
  try {
    const b = req.body;
    const count = db.prepare(`SELECT COUNT(*) AS c FROM mines`).get().c;
    const mine_code = `MINE-${String(count + 1).padStart(3, '0')}`;
    const info = db.prepare(`
      INSERT INTO mines (mine_code, name, subsidiary_id, location, state, district, manager_id, production_capacity, current_production, status, lat, lng)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(mine_code, b.name, b.subsidiary_id || null, b.location || null, b.state || null, b.district || null, b.manager_id || null,
      b.production_capacity || 0, b.current_production || 0, b.status || 'Active', b.lat || null, b.lng || null);

    logAudit({ user: req.user, action: 'CREATE', module: 'mines', recordId: info.lastInsertRowid, newValue: b, ip: req.ip });
    res.status(201).json({ data: db.prepare(`SELECT * FROM mines WHERE id = ?`).get(info.lastInsertRowid) });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize(...ADMIN_ROLES, 'mine_manager'), (req, res, next) => {
  try {
    const existing = db.prepare(`SELECT * FROM mines WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Mine not found.' });
    const b = req.body;
    db.prepare(`
      UPDATE mines SET name=COALESCE(?,name), subsidiary_id=COALESCE(?,subsidiary_id), location=COALESCE(?,location),
      state=COALESCE(?,state), district=COALESCE(?,district), manager_id=COALESCE(?,manager_id),
      production_capacity=COALESCE(?,production_capacity), current_production=COALESCE(?,current_production),
      status=COALESCE(?,status), lat=COALESCE(?,lat), lng=COALESCE(?,lng), updated_at=datetime('now') WHERE id=?
    `).run(b.name, b.subsidiary_id, b.location, b.state, b.district, b.manager_id, b.production_capacity, b.current_production, b.status, b.lat, b.lng, req.params.id);

    logAudit({ user: req.user, action: 'UPDATE', module: 'mines', recordId: req.params.id, previousValue: existing, newValue: b, ip: req.ip });
    res.json({ data: db.prepare(`SELECT * FROM mines WHERE id = ?`).get(req.params.id) });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('super_admin'), (req, res) => {
  const existing = db.prepare(`SELECT * FROM mines WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Mine not found.' });
  db.prepare(`UPDATE mines SET status = 'Inactive', updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
  logAudit({ user: req.user, action: 'DEACTIVATE', module: 'mines', recordId: req.params.id, previousValue: existing, ip: req.ip });
  res.json({ data: { id: Number(req.params.id), status: 'Inactive' } });
});

module.exports = router;
