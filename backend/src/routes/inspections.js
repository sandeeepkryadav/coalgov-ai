const express = require('express');
const db = require('../db/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');
const upload = require('../middleware/upload');

const router = express.Router();
const WORKFLOW = ['Created', 'Assigned', 'In Progress', 'Findings Recorded', 'Corrective Action', 'Verification', 'Closed'];

router.get('/', authenticate, (req, res) => {
  const { search = '', status, mine_id, type, priority, page = 1, limit = 20 } = req.query;
  let where = ' WHERE 1=1';
  const params = [];
  if (search) { where += ' AND (i.inspection_code LIKE ? OR i.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (status) { where += ' AND i.status = ?'; params.push(status); }
  if (mine_id) { where += ' AND i.mine_id = ?'; params.push(mine_id); }
  if (type) { where += ' AND i.type = ?'; params.push(type); }
  if (priority) { where += ' AND i.priority = ?'; params.push(priority); }

  if (req.user.role === 'field_inspector') { where += ' AND i.inspector_id = ?'; params.push(req.user.id); }
  else if (['mine_manager', 'safety_officer', 'environmental_officer'].includes(req.user.role) && req.user.mine_id) { where += ' AND i.mine_id = ?'; params.push(req.user.mine_id); }

  const offset = (Number(page) - 1) * Number(limit);
  const total = db.prepare(`SELECT COUNT(*) AS c FROM inspections i ${where}`).get(...params).c;
  const rows = db.prepare(`
    SELECT i.*, m.name AS mine_name, u.name AS inspector_name
    FROM inspections i LEFT JOIN mines m ON m.id = i.mine_id LEFT JOIN users u ON u.id = i.inspector_id
    ${where} ORDER BY i.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  res.json({ data: rows, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
});

router.get('/:id', authenticate, (req, res) => {
  const inspection = db.prepare(`
    SELECT i.*, m.name AS mine_name, u.name AS inspector_name FROM inspections i
    LEFT JOIN mines m ON m.id = i.mine_id LEFT JOIN users u ON u.id = i.inspector_id WHERE i.id = ?
  `).get(req.params.id);
  if (!inspection) return res.status(404).json({ error: 'Inspection not found.' });
  const findings = db.prepare(`SELECT * FROM inspection_findings WHERE inspection_id = ? ORDER BY created_at DESC`).all(req.params.id);
  const violations = db.prepare(`SELECT * FROM violations WHERE inspection_id = ?`).all(req.params.id);
  res.json({ data: { ...inspection, findings, violations } });
});

router.post('/', authenticate, authorize('super_admin', 'mine_manager', 'field_inspector', 'safety_officer', 'environmental_officer'), (req, res, next) => {
  try {
    const b = req.body;
    const count = db.prepare(`SELECT COUNT(*) AS c FROM inspections`).get().c;
    const inspection_code = `INSP-${String(count + 1).padStart(4, '0')}`;
    const status = b.inspector_id ? 'Assigned' : 'Created';
    const info = db.prepare(`
      INSERT INTO inspections (inspection_code, mine_id, inspector_id, type, scheduled_date, priority, description, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(inspection_code, b.mine_id, b.inspector_id || null, b.type, b.scheduled_date || null, b.priority || 'Medium', b.description || '', status, req.user.id);

    if (b.inspector_id) {
      db.prepare(`INSERT INTO notifications (user_id, type, priority, message, module, related_id) VALUES (?, ?, ?, ?, ?, ?)`)
        .run(b.inspector_id, 'Inspection Assigned', b.priority || 'Medium', `You have been assigned inspection ${inspection_code}.`, 'inspections', info.lastInsertRowid);
    }
    logAudit({ user: req.user, action: 'CREATE', module: 'inspections', recordId: info.lastInsertRowid, newValue: b, ip: req.ip });
    res.status(201).json({ data: db.prepare(`SELECT * FROM inspections WHERE id = ?`).get(info.lastInsertRowid) });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, (req, res, next) => {
  try {
    const existing = db.prepare(`SELECT * FROM inspections WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Inspection not found.' });
    const b = req.body;
    if (b.status && !WORKFLOW.includes(b.status)) return res.status(400).json({ error: 'Invalid inspection status.' });

    db.prepare(`
      UPDATE inspections SET inspector_id=COALESCE(?,inspector_id), type=COALESCE(?,type), scheduled_date=COALESCE(?,scheduled_date),
      priority=COALESCE(?,priority), description=COALESCE(?,description), status=COALESCE(?,status), updated_at=datetime('now') WHERE id=?
    `).run(b.inspector_id, b.type, b.scheduled_date, b.priority, b.description, b.status, req.params.id);

    logAudit({ user: req.user, action: 'UPDATE', module: 'inspections', recordId: req.params.id, previousValue: existing, newValue: b, ip: req.ip });
    res.json({ data: db.prepare(`SELECT * FROM inspections WHERE id = ?`).get(req.params.id) });
  } catch (err) { next(err); }
});

// Record a finding + optional evidence photo; may auto-create a violation and advance the workflow.
router.post('/:id/findings', authenticate, upload.single('evidence'), (req, res, next) => {
  try {
    const inspection = db.prepare(`SELECT * FROM inspections WHERE id = ?`).get(req.params.id);
    if (!inspection) return res.status(404).json({ error: 'Inspection not found.' });
    const { description, severity = 'Medium', recommendation, create_violation, category } = req.body;
    const evidence_path = req.file ? `/uploads/${req.file.filename}` : null;

    const info = db.prepare(`
      INSERT INTO inspection_findings (inspection_id, description, severity, recommendation, evidence_path) VALUES (?, ?, ?, ?, ?)
    `).run(req.params.id, description, severity, recommendation || null, evidence_path);

    let violation = null;
    if (create_violation === 'true' || create_violation === true) {
      const vCount = db.prepare(`SELECT COUNT(*) AS c FROM violations`).get().c;
      const violation_code = `VIO-${String(vCount + 1).padStart(4, '0')}`;
      const vInfo = db.prepare(`
        INSERT INTO violations (violation_code, mine_id, inspection_id, category, description, severity, status)
        VALUES (?, ?, ?, ?, ?, ?, 'Open')
      `).run(violation_code, inspection.mine_id, req.params.id, category || inspection.type, description, severity);
      violation = db.prepare(`SELECT * FROM violations WHERE id = ?`).get(vInfo.lastInsertRowid);
    }

    db.prepare(`UPDATE inspections SET status = 'Findings Recorded', updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
    logAudit({ user: req.user, action: 'ADD_FINDING', module: 'inspections', recordId: req.params.id, newValue: { description, severity }, ip: req.ip });
    res.status(201).json({ data: { finding: db.prepare(`SELECT * FROM inspection_findings WHERE id = ?`).get(info.lastInsertRowid), violation } });
  } catch (err) { next(err); }
});

router.put('/:id/status', authenticate, (req, res, next) => {
  try {
    const { status } = req.body;
    if (!WORKFLOW.includes(status)) return res.status(400).json({ error: 'Invalid inspection status.' });
    const existing = db.prepare(`SELECT * FROM inspections WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Inspection not found.' });
    db.prepare(`UPDATE inspections SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, req.params.id);
    logAudit({ user: req.user, action: 'STATUS_CHANGE', module: 'inspections', recordId: req.params.id, previousValue: { status: existing.status }, newValue: { status }, ip: req.ip });
    res.json({ data: db.prepare(`SELECT * FROM inspections WHERE id = ?`).get(req.params.id) });
  } catch (err) { next(err); }
});

module.exports = router;
