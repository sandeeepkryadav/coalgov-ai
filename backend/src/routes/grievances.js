const express = require('express');
const db = require('../db/db');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();
const WORKFLOW = ['Submitted', 'Assigned', 'Under Review', 'Action Taken', 'Resolved', 'Closed'];

router.get('/', authenticate, (req, res) => {
  const { status, mine_id, category, priority, page = 1, limit = 20 } = req.query;
  let where = ' WHERE 1=1';
  const params = [];
  if (status) { where += ' AND status = ?'; params.push(status); }
  if (mine_id) { where += ' AND mine_id = ?'; params.push(mine_id); }
  if (category) { where += ' AND category = ?'; params.push(category); }
  if (priority) { where += ' AND priority = ?'; params.push(priority); }
  if (req.user.role === 'worker') { where += ' AND submitted_by = ?'; params.push(req.user.id); }
  else if (req.user.role === 'mine_manager' && req.user.mine_id) { where += ' AND mine_id = ?'; params.push(req.user.mine_id); }

  const offset = (Number(page) - 1) * Number(limit);
  const total = db.prepare(`SELECT COUNT(*) AS c FROM grievances ${where}`).get(...params).c;
  const rows = db.prepare(`SELECT * FROM grievances ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(limit), offset);
  res.json({ data: rows, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
});

router.post('/', authenticate, (req, res, next) => {
  try {
    const b = req.body;
    const isAnonymous = b.anonymous === true || b.anonymous === 'true';
    const count = db.prepare(`SELECT COUNT(*) AS c FROM grievances`).get().c;
    const grievance_code = `GRV-${String(count + 1).padStart(4, '0')}`;
    const info = db.prepare(`
      INSERT INTO grievances (grievance_code, mine_id, submitted_by, anonymous, category, description, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Submitted')
    `).run(grievance_code, b.mine_id || req.user.mine_id || null, isAnonymous ? null : req.user.id, isAnonymous ? 1 : 0, b.category, b.description, b.priority || 'Medium');
    logAudit({ user: req.user, action: 'CREATE', module: 'grievances', recordId: info.lastInsertRowid, newValue: { ...b, description: undefined }, ip: req.ip });
    res.status(201).json({ data: db.prepare(`SELECT * FROM grievances WHERE id = ?`).get(info.lastInsertRowid) });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, (req, res, next) => {
  try {
    const existing = db.prepare(`SELECT * FROM grievances WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Grievance not found.' });
    const b = req.body;
    if (b.status && !WORKFLOW.includes(b.status)) return res.status(400).json({ error: 'Invalid grievance status.' });
    db.prepare(`
      UPDATE grievances SET assigned_officer=COALESCE(?,assigned_officer), status=COALESCE(?,status),
      resolution=COALESCE(?,resolution), priority=COALESCE(?,priority), updated_at=datetime('now') WHERE id=?
    `).run(b.assigned_officer, b.status, b.resolution, b.priority, req.params.id);
    logAudit({ user: req.user, action: 'UPDATE', module: 'grievances', recordId: req.params.id, previousValue: existing, newValue: b, ip: req.ip });
    res.json({ data: db.prepare(`SELECT * FROM grievances WHERE id = ?`).get(req.params.id) });
  } catch (err) { next(err); }
});

module.exports = router;
