const express = require('express');
const db = require('../db/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, authorize('super_admin', 'leadership', 'regulator'), (req, res) => {
  const { search = '', module, action, user_id, page = 1, limit = 30 } = req.query;
  let where = ' WHERE 1=1';
  const params = [];
  if (search) { where += ' AND (user_name LIKE ? OR action LIKE ? OR module LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (module) { where += ' AND module = ?'; params.push(module); }
  if (action) { where += ' AND action = ?'; params.push(action); }
  if (user_id) { where += ' AND user_id = ?'; params.push(user_id); }

  const offset = (Number(page) - 1) * Number(limit);
  const total = db.prepare(`SELECT COUNT(*) AS c FROM audit_logs ${where}`).get(...params).c;
  const rows = db.prepare(`SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(limit), offset);
  res.json({ data: rows, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
});

module.exports = router;
