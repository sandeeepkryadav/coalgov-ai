const express = require('express');
const db = require('../db/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const { unread_only } = req.query;
  let where = ' WHERE (user_id = ? OR role_target = ?)';
  const params = [req.user.id, req.user.role];
  if (unread_only === 'true') where += ' AND is_read = 0';
  const rows = db.prepare(`SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT 100`).all(...params);
  const unreadCount = db.prepare(`SELECT COUNT(*) AS c FROM notifications WHERE (user_id = ? OR role_target = ?) AND is_read = 0`).get(req.user.id, req.user.role).c;
  res.json({ data: rows, unreadCount });
});

router.put('/:id/read', authenticate, (req, res) => {
  db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ?`).run(req.params.id);
  res.json({ data: { id: Number(req.params.id), is_read: 1 } });
});

router.put('/read-all', authenticate, (req, res) => {
  db.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ? OR role_target = ?`).run(req.user.id, req.user.role);
  res.json({ message: 'All notifications marked as read.' });
});

module.exports = router;
