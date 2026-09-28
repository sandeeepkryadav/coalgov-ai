const express = require('express');
const db = require('../db/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const { search = '', status, mine_id, category, severity, page = 1, limit = 20 } = req.query;
  let where = ' WHERE 1=1';
  const params = [];
  if (search) { where += ' AND (v.violation_code LIKE ? OR v.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (status) { where += ' AND v.status = ?'; params.push(status); }
  if (mine_id) { where += ' AND v.mine_id = ?'; params.push(mine_id); }
  if (category) { where += ' AND v.category = ?'; params.push(category); }
  if (severity) { where += ' AND v.severity = ?'; params.push(severity); }
  if (['mine_manager', 'safety_officer', 'environmental_officer', 'field_inspector'].includes(req.user.role) && req.user.mine_id) {
    where += ' AND v.mine_id = ?'; params.push(req.user.mine_id);
  }

  const offset = (Number(page) - 1) * Number(limit);
  const total = db.prepare(`SELECT COUNT(*) AS c FROM violations v ${where}`).get(...params).c;
  const rows = db.prepare(`
    SELECT v.*, m.name AS mine_name FROM violations v LEFT JOIN mines m ON m.id = v.mine_id
    ${where} ORDER BY v.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);
  res.json({ data: rows, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
});

router.get('/:id', authenticate, (req, res) => {
  const row = db.prepare(`
    SELECT v.*, m.name AS mine_name FROM violations v LEFT JOIN mines m ON m.id = v.mine_id WHERE v.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Violation not found.' });
  const actions = db.prepare(`SELECT * FROM corrective_actions WHERE violation_id = ?`).all(req.params.id);
  res.json({ data: { ...row, correctiveActions: actions } });
});

router.post('/', authenticate, authorize('super_admin', 'mine_manager', 'field_inspector', 'safety_officer', 'environmental_officer'), (req, res, next) => {
  try {
    const b = req.body;
    const count = db.prepare(`SELECT COUNT(*) AS c FROM violations`).get().c;
    const violation_code = `VIO-${String(count + 1).padStart(4, '0')}`;
    const info = db.prepare(`
      INSERT INTO violations (violation_code, mine_id, inspection_id, contractor_id, category, description, severity, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Open')
    `).run(violation_code, b.mine_id, b.inspection_id || null, b.contractor_id || null, b.category, b.description, b.severity || 'Medium');
    logAudit({ user: req.user, action: 'CREATE', module: 'violations', recordId: info.lastInsertRowid, newValue: b, ip: req.ip });
    res.status(201).json({ data: db.prepare(`SELECT * FROM violations WHERE id = ?`).get(info.lastInsertRowid) });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, (req, res, next) => {
  try {
    const existing = db.prepare(`SELECT * FROM violations WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Violation not found.' });
    const b = req.body;
    db.prepare(`
      UPDATE violations SET category=COALESCE(?,category), description=COALESCE(?,description),
      severity=COALESCE(?,severity), status=COALESCE(?,status), updated_at=datetime('now') WHERE id=?
    `).run(b.category, b.description, b.severity, b.status, req.params.id);
    logAudit({ user: req.user, action: 'UPDATE', module: 'violations', recordId: req.params.id, previousValue: existing, newValue: b, ip: req.ip });
    res.json({ data: db.prepare(`SELECT * FROM violations WHERE id = ?`).get(req.params.id) });
  } catch (err) { next(err); }
});

module.exports = router;
