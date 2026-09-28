const express = require('express');
const db = require('../db/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  res.json({ data: db.prepare(`SELECT * FROM subsidiaries ORDER BY name`).all() });
});

router.post('/', authenticate, authorize('super_admin'), (req, res) => {
  const info = db.prepare(`INSERT INTO subsidiaries (name) VALUES (?)`).run(req.body.name);
  res.status(201).json({ data: db.prepare(`SELECT * FROM subsidiaries WHERE id = ?`).get(info.lastInsertRowid) });
});

module.exports = router;
