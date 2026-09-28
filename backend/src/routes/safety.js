const express = require('express');
const db = require('../db/db');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();

function scoped(req) {
  if (['mine_manager', 'safety_officer', 'field_inspector'].includes(req.user.role) && req.user.mine_id) {
    return { clause: ' AND mine_id = ?', params: [req.user.mine_id] };
  }
  return { clause: '', params: [] };
}

// ---- Incidents / Accidents ----
router.get('/incidents', authenticate, (req, res) => {
  const { search = '', status, mine_id, severity, page = 1, limit = 20 } = req.query;
  let where = ' WHERE 1=1';
  const params = [];
  if (search) { where += ' AND (si.incident_code LIKE ? OR si.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (status) { where += ' AND si.status = ?'; params.push(status); }
  if (mine_id) { where += ' AND si.mine_id = ?'; params.push(mine_id); }
  if (severity) { where += ' AND si.severity = ?'; params.push(severity); }
  if (['mine_manager', 'safety_officer', 'field_inspector'].includes(req.user.role) && req.user.mine_id) {
    where += ' AND si.mine_id = ?'; params.push(req.user.mine_id);
  }

  const offset = (Number(page) - 1) * Number(limit);
  const total = db.prepare(`SELECT COUNT(*) AS c FROM safety_incidents si ${where}`).get(...params).c;
  const rows = db.prepare(`
    SELECT si.*, m.name AS mine_name FROM safety_incidents si LEFT JOIN mines m ON m.id = si.mine_id
    ${where} ORDER BY si.date DESC LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);
  res.json({ data: rows, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
});

router.post('/incidents', authenticate, (req, res, next) => {
  try {
    const b = req.body;
    const count = db.prepare(`SELECT COUNT(*) AS c FROM safety_incidents`).get().c;
    const incident_code = `INC-${String(count + 1).padStart(4, '0')}`;
    const info = db.prepare(`
      INSERT INTO safety_incidents (incident_code, mine_id, date, location, type, severity, persons_affected, description, root_cause, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open')
    `).run(incident_code, b.mine_id, b.date || new Date().toISOString().slice(0,10), b.location || null, b.type, b.severity || 'Medium', b.persons_affected || 0, b.description, b.root_cause || null);
    logAudit({ user: req.user, action: 'CREATE', module: 'safety_incidents', recordId: info.lastInsertRowid, newValue: b, ip: req.ip });
    res.status(201).json({ data: db.prepare(`SELECT * FROM safety_incidents WHERE id = ?`).get(info.lastInsertRowid) });
  } catch (err) { next(err); }
});

router.put('/incidents/:id', authenticate, (req, res, next) => {
  try {
    const existing = db.prepare(`SELECT * FROM safety_incidents WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Incident not found.' });
    const b = req.body;
    db.prepare(`
      UPDATE safety_incidents SET type=COALESCE(?,type), severity=COALESCE(?,severity), root_cause=COALESCE(?,root_cause),
      status=COALESCE(?,status), description=COALESCE(?,description) WHERE id=?
    `).run(b.type, b.severity, b.root_cause, b.status, b.description, req.params.id);
    logAudit({ user: req.user, action: 'UPDATE', module: 'safety_incidents', recordId: req.params.id, previousValue: existing, newValue: b, ip: req.ip });
    res.json({ data: db.prepare(`SELECT * FROM safety_incidents WHERE id = ?`).get(req.params.id) });
  } catch (err) { next(err); }
});

// ---- Observations (near-miss, hazard, PPE) ----
router.get('/observations', authenticate, (req, res) => {
  const { mine_id, category, status, page = 1, limit = 20 } = req.query;
  let where = ' WHERE 1=1';
  const params = [];
  if (mine_id) { where += ' AND mine_id = ?'; params.push(mine_id); }
  if (category) { where += ' AND category = ?'; params.push(category); }
  if (status) { where += ' AND status = ?'; params.push(status); }
  const scope = scoped(req); where += scope.clause; params.push(...scope.params);
  const offset = (Number(page) - 1) * Number(limit);
  const total = db.prepare(`SELECT COUNT(*) AS c FROM safety_observations ${where}`).get(...params).c;
  const rows = db.prepare(`SELECT * FROM safety_observations ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(limit), offset);
  res.json({ data: rows, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
});

router.post('/observations', authenticate, (req, res, next) => {
  try {
    const b = req.body;
    const mine_id = b.mine_id || req.user.mine_id;
    const info = db.prepare(`
      INSERT INTO safety_observations (mine_id, observer_id, category, description, ppe_compliant, status) VALUES (?, ?, ?, ?, ?, 'Open')
    `).run(mine_id, req.user.id, b.category, b.description, b.ppe_compliant === false || b.ppe_compliant === 'false' ? 0 : 1);
    logAudit({ user: req.user, action: 'CREATE', module: 'safety_observations', recordId: info.lastInsertRowid, newValue: b, ip: req.ip });
    res.status(201).json({ data: db.prepare(`SELECT * FROM safety_observations WHERE id = ?`).get(info.lastInsertRowid) });
  } catch (err) { next(err); }
});

module.exports = router;
