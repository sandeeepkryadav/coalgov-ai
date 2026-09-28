const express = require('express');
const db = require('../db/db');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// Any compliance item past due and not yet marked Compliant/Expired is flagged Expired automatically.
function autoFlagOverdue() {
  db.prepare(`
    UPDATE compliance_items SET status = 'Expired', updated_at = datetime('now')
    WHERE due_date IS NOT NULL AND due_date < date('now') AND status NOT IN ('Compliant', 'Expired')
  `).run();
}

router.get('/', authenticate, (req, res) => {
  autoFlagOverdue();
  const { search = '', status, mine_id, category, page = 1, limit = 20 } = req.query;
  let where = ' WHERE 1=1';
  const params = [];
  if (search) { where += ' AND (c.compliance_code LIKE ? OR c.requirement LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (status) { where += ' AND c.status = ?'; params.push(status); }
  if (mine_id) { where += ' AND c.mine_id = ?'; params.push(mine_id); }
  if (category) { where += ' AND c.category = ?'; params.push(category); }
  if (['mine_manager', 'safety_officer', 'environmental_officer', 'field_inspector'].includes(req.user.role) && req.user.mine_id) {
    where += ' AND c.mine_id = ?'; params.push(req.user.mine_id);
  }

  const offset = (Number(page) - 1) * Number(limit);
  const total = db.prepare(`SELECT COUNT(*) AS c FROM compliance_items c ${where}`).get(...params).c;
  const rows = db.prepare(`
    SELECT c.*, m.name AS mine_name FROM compliance_items c LEFT JOIN mines m ON m.id = c.mine_id
    ${where} ORDER BY c.due_date ASC LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);
  res.json({ data: rows, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
});

router.post('/', authenticate, (req, res, next) => {
  try {
    const b = req.body;
    const count = db.prepare(`SELECT COUNT(*) AS c FROM compliance_items`).get().c;
    const compliance_code = `CMP-${String(count + 1).padStart(4, '0')}`;
    const info = db.prepare(`
      INSERT INTO compliance_items (compliance_code, mine_id, category, requirement, responsible_person, frequency, due_date, status, risk, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(compliance_code, b.mine_id, b.category, b.requirement, b.responsible_person || null, b.frequency || null, b.due_date || null, b.status || 'Pending Review', b.risk || 'Low', b.remarks || null);
    logAudit({ user: req.user, action: 'CREATE', module: 'compliance', recordId: info.lastInsertRowid, newValue: b, ip: req.ip });
    res.status(201).json({ data: db.prepare(`SELECT * FROM compliance_items WHERE id = ?`).get(info.lastInsertRowid) });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, (req, res, next) => {
  try {
    const existing = db.prepare(`SELECT * FROM compliance_items WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Compliance item not found.' });
    const b = req.body;
    db.prepare(`
      UPDATE compliance_items SET category=COALESCE(?,category), requirement=COALESCE(?,requirement),
      responsible_person=COALESCE(?,responsible_person), frequency=COALESCE(?,frequency), due_date=COALESCE(?,due_date),
      status=COALESCE(?,status), risk=COALESCE(?,risk), remarks=COALESCE(?,remarks), updated_at=datetime('now') WHERE id=?
    `).run(b.category, b.requirement, b.responsible_person, b.frequency, b.due_date, b.status, b.risk, b.remarks, req.params.id);
    logAudit({ user: req.user, action: 'UPDATE', module: 'compliance', recordId: req.params.id, previousValue: existing, newValue: b, ip: req.ip });
    res.json({ data: db.prepare(`SELECT * FROM compliance_items WHERE id = ?`).get(req.params.id) });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, (req, res) => {
  const existing = db.prepare(`SELECT * FROM compliance_items WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Compliance item not found.' });
  db.prepare(`DELETE FROM compliance_items WHERE id = ?`).run(req.params.id);
  logAudit({ user: req.user, action: 'DELETE', module: 'compliance', recordId: req.params.id, previousValue: existing, ip: req.ip });
  res.json({ data: { id: Number(req.params.id) } });
});

module.exports = router;
