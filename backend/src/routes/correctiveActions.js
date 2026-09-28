const express = require('express');
const db = require('../db/db');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');
const upload = require('../middleware/upload');

const router = express.Router();
const WORKFLOW = ['Open', 'In Progress', 'Submitted for Verification', 'Verified', 'Closed', 'Overdue'];

function withComputedStatus(row) {
  if (!row) return row;
  if (['Closed', 'Verified'].includes(row.status)) return row;
  if (row.due_date && row.due_date < new Date().toISOString().slice(0, 10)) {
    return { ...row, computed_status: 'Overdue' };
  }
  return { ...row, computed_status: row.status };
}

router.get('/', authenticate, (req, res) => {
  const { search = '', status, mine_id, priority, overdue_only, page = 1, limit = 20 } = req.query;
  let where = ' WHERE 1=1';
  const params = [];
  if (search) { where += ' AND (ca.action_code LIKE ? OR ca.finding LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (status) { where += ' AND ca.status = ?'; params.push(status); }
  if (mine_id) { where += ' AND ca.mine_id = ?'; params.push(mine_id); }
  if (priority) { where += ' AND ca.priority = ?'; params.push(priority); }
  if (overdue_only === 'true') { where += " AND ca.status NOT IN ('Closed','Verified') AND ca.due_date < date('now')"; }
  if (['mine_manager', 'safety_officer', 'environmental_officer', 'field_inspector'].includes(req.user.role) && req.user.mine_id) {
    where += ' AND ca.mine_id = ?'; params.push(req.user.mine_id);
  }

  const offset = (Number(page) - 1) * Number(limit);
  const total = db.prepare(`SELECT COUNT(*) AS c FROM corrective_actions ca ${where}`).get(...params).c;
  const rows = db.prepare(`
    SELECT ca.*, m.name AS mine_name FROM corrective_actions ca LEFT JOIN mines m ON m.id = ca.mine_id
    ${where} ORDER BY ca.due_date ASC LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  res.json({ data: rows.map(withComputedStatus), pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
});

router.get('/:id', authenticate, (req, res) => {
  const row = db.prepare(`
    SELECT ca.*, m.name AS mine_name FROM corrective_actions ca LEFT JOIN mines m ON m.id = ca.mine_id WHERE ca.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Corrective action not found.' });
  res.json({ data: withComputedStatus(row) });
});

router.post('/', authenticate, (req, res, next) => {
  try {
    const b = req.body;
    const count = db.prepare(`SELECT COUNT(*) AS c FROM corrective_actions`).get().c;
    const action_code = `CA-${String(count + 1).padStart(4, '0')}`;
    const info = db.prepare(`
      INSERT INTO corrective_actions (action_code, violation_id, mine_id, finding, responsible_person, priority, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Open')
    `).run(action_code, b.violation_id || null, b.mine_id, b.finding, b.responsible_person || null, b.priority || 'Medium', b.due_date || null);

    if (b.violation_id) db.prepare(`UPDATE violations SET status = 'In Progress' WHERE id = ?`).run(b.violation_id);

    logAudit({ user: req.user, action: 'CREATE', module: 'corrective_actions', recordId: info.lastInsertRowid, newValue: b, ip: req.ip });
    res.status(201).json({ data: db.prepare(`SELECT * FROM corrective_actions WHERE id = ?`).get(info.lastInsertRowid) });
  } catch (err) { next(err); }
});

// Upload evidence and move to "Submitted for Verification"
router.post('/:id/evidence', authenticate, upload.single('evidence'), (req, res, next) => {
  try {
    const existing = db.prepare(`SELECT * FROM corrective_actions WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Corrective action not found.' });
    if (!req.file) return res.status(400).json({ error: 'Evidence file is required.' });
    const evidence_path = `/uploads/${req.file.filename}`;
    db.prepare(`UPDATE corrective_actions SET evidence_path = ?, status = 'Submitted for Verification', updated_at = datetime('now') WHERE id = ?`)
      .run(evidence_path, req.params.id);
    logAudit({ user: req.user, action: 'UPLOAD_EVIDENCE', module: 'corrective_actions', recordId: req.params.id, newValue: { evidence_path }, ip: req.ip });
    res.json({ data: db.prepare(`SELECT * FROM corrective_actions WHERE id = ?`).get(req.params.id) });
  } catch (err) { next(err); }
});

// Verify / close (leadership, mine manager, safety/environmental officer, super admin)
router.put('/:id/verify', authenticate, (req, res, next) => {
  try {
    const existing = db.prepare(`SELECT * FROM corrective_actions WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Corrective action not found.' });
    const { approved, verification_notes } = req.body;
    const newStatus = approved ? 'Verified' : 'In Progress';
    db.prepare(`UPDATE corrective_actions SET status = ?, verification_notes = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(newStatus, verification_notes || null, req.params.id);
    logAudit({ user: req.user, action: 'VERIFY', module: 'corrective_actions', recordId: req.params.id, previousValue: { status: existing.status }, newValue: { status: newStatus }, ip: req.ip });
    res.json({ data: db.prepare(`SELECT * FROM corrective_actions WHERE id = ?`).get(req.params.id) });
  } catch (err) { next(err); }
});

router.put('/:id/close', authenticate, (req, res, next) => {
  try {
    const existing = db.prepare(`SELECT * FROM corrective_actions WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Corrective action not found.' });
    if (existing.status !== 'Verified') return res.status(400).json({ error: 'Only verified corrective actions can be closed.' });
    const today = new Date().toISOString().slice(0, 10);
    db.prepare(`UPDATE corrective_actions SET status = 'Closed', closure_date = ?, updated_at = datetime('now') WHERE id = ?`).run(today, req.params.id);
    if (existing.violation_id) db.prepare(`UPDATE violations SET status = 'Closed', updated_at = datetime('now') WHERE id = ?`).run(existing.violation_id);
    logAudit({ user: req.user, action: 'CLOSE', module: 'corrective_actions', recordId: req.params.id, previousValue: { status: existing.status }, newValue: { status: 'Closed' }, ip: req.ip });
    res.json({ data: db.prepare(`SELECT * FROM corrective_actions WHERE id = ?`).get(req.params.id) });
  } catch (err) { next(err); }
});

module.exports = router;
