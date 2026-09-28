const express = require('express');
const db = require('../db/db');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// Default thresholds used when a mine hasn't customized one for a parameter.
const DEFAULT_THRESHOLDS = { 'Air Quality': 100, 'Dust': 100, 'Water Quality': 100, 'Noise': 85, 'Waste': 50 };

router.get('/', authenticate, (req, res) => {
  const { mine_id, parameter, status, page = 1, limit = 30 } = req.query;
  let where = ' WHERE 1=1';
  const params = [];
  if (mine_id) { where += ' AND e.mine_id = ?'; params.push(mine_id); }
  if (parameter) { where += ' AND e.parameter = ?'; params.push(parameter); }
  if (status) { where += ' AND e.status = ?'; params.push(status); }
  if (['mine_manager', 'environmental_officer', 'field_inspector'].includes(req.user.role) && req.user.mine_id) {
    where += ' AND e.mine_id = ?'; params.push(req.user.mine_id);
  }
  const offset = (Number(page) - 1) * Number(limit);
  const total = db.prepare(`SELECT COUNT(*) AS c FROM environmental_records e ${where}`).get(...params).c;
  const rows = db.prepare(`
    SELECT e.*, m.name AS mine_name FROM environmental_records e LEFT JOIN mines m ON m.id = e.mine_id
    ${where} ORDER BY e.recorded_at DESC LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);
  res.json({ data: rows, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
});

// Historical trend for charting: last N readings per parameter for a mine.
router.get('/trend/:mineId', authenticate, (req, res) => {
  const rows = db.prepare(`
    SELECT parameter, value, threshold, status, recorded_at FROM environmental_records
    WHERE mine_id = ? ORDER BY recorded_at ASC
  `).all(req.params.mineId);
  res.json({ data: rows });
});

router.post('/', authenticate, (req, res, next) => {
  try {
    const b = req.body;
    const threshold = (b.threshold !== undefined && b.threshold !== null && b.threshold !== '') ? Number(b.threshold) : (DEFAULT_THRESHOLDS[b.parameter] || 100);
    const value = Number(b.value);
    let status = 'Normal';
    if (value > threshold) status = 'Breach';
    else if (value > threshold * 0.85) status = 'Warning';

    const info = db.prepare(`
      INSERT INTO environmental_records (mine_id, parameter, value, unit, threshold, status) VALUES (?, ?, ?, ?, ?, ?)
    `).run(b.mine_id, b.parameter, value, b.unit || null, threshold, status);

    if (status === 'Breach') {
      const mine = db.prepare(`SELECT name FROM mines WHERE id = ?`).get(b.mine_id);
      db.prepare(`
        INSERT INTO notifications (role_target, type, priority, message, module, related_id) VALUES (?, ?, 'High', ?, 'environment', ?)
      `).run('environmental_officer', 'Environmental Threshold Breach', `${b.parameter} at ${mine ? mine.name : 'mine'} exceeded the safe threshold (${value} vs ${threshold}).`, info.lastInsertRowid);
    }

    logAudit({ user: req.user, action: 'CREATE', module: 'environment', recordId: info.lastInsertRowid, newValue: { ...b, status }, ip: req.ip });
    res.status(201).json({ data: db.prepare(`SELECT * FROM environmental_records WHERE id = ?`).get(info.lastInsertRowid) });
  } catch (err) { next(err); }
});

module.exports = router;
