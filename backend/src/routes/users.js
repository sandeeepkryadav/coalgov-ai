const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();

function sanitize(u) { const { password_hash, ...rest } = u; return rest; }

router.get('/', authenticate, authorize('super_admin'), (req, res) => {
  const { search = '', role, mine_id, page = 1, limit = 30 } = req.query;
  let where = ' WHERE 1=1';
  const params = [];
  if (search) { where += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (role) { where += ' AND role = ?'; params.push(role); }
  if (mine_id) { where += ' AND mine_id = ?'; params.push(mine_id); }
  const offset = (Number(page) - 1) * Number(limit);
  const total = db.prepare(`SELECT COUNT(*) AS c FROM users ${where}`).get(...params).c;
  const rows = db.prepare(`SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(limit), offset);
  res.json({ data: rows.map(sanitize), pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
});

router.post('/', authenticate, authorize('super_admin'), (req, res, next) => {
  try {
    const b = req.body;
    const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(b.email.toLowerCase());
    if (existing) return res.status(409).json({ error: 'A user with this email already exists.' });
    const password_hash = bcrypt.hashSync(b.password || 'ChangeMe@123', 10);
    const info = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, mine_id, contractor_id, phone) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(b.name, b.email.toLowerCase(), password_hash, b.role, b.mine_id || null, b.contractor_id || null, b.phone || null);
    logAudit({ user: req.user, action: 'CREATE', module: 'users', recordId: info.lastInsertRowid, newValue: { ...b, password: undefined }, ip: req.ip });
    res.status(201).json({ data: sanitize(db.prepare(`SELECT * FROM users WHERE id = ?`).get(info.lastInsertRowid)) });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('super_admin'), (req, res, next) => {
  try {
    const existing = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'User not found.' });
    const b = req.body;
    db.prepare(`
      UPDATE users SET name=COALESCE(?,name), role=COALESCE(?,role), mine_id=COALESCE(?,mine_id),
      contractor_id=COALESCE(?,contractor_id), phone=COALESCE(?,phone), is_active=COALESCE(?,is_active) WHERE id=?
    `).run(b.name, b.role, b.mine_id, b.contractor_id, b.phone, b.is_active, req.params.id);
    logAudit({ user: req.user, action: 'UPDATE', module: 'users', recordId: req.params.id, previousValue: sanitize(existing), newValue: b, ip: req.ip });
    res.json({ data: sanitize(db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.params.id)) });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('super_admin'), (req, res) => {
  const existing = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found.' });
  db.prepare(`UPDATE users SET is_active = 0 WHERE id = ?`).run(req.params.id);
  logAudit({ user: req.user, action: 'DEACTIVATE', module: 'users', recordId: req.params.id, previousValue: sanitize(existing), ip: req.ip });
  res.json({ data: { id: Number(req.params.id), is_active: 0 } });
});

module.exports = router;
