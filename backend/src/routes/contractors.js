const express = require('express');
const db = require('../db/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();

/** Recomputes a contractor's compliance score from documents, safety, attendance and violations. */
function recalcContractorScore(contractorId) {
  const docs = db.prepare(`SELECT status FROM contractor_documents WHERE contractor_id = ?`).all(contractorId);
  const validDocs = docs.filter(d => d.status === 'Valid').length;
  const docScore = docs.length ? (validDocs / docs.length) * 100 : 100;

  const violations = db.prepare(`SELECT COUNT(*) AS c FROM violations WHERE contractor_id = ? AND status != 'Closed'`).get(contractorId).c;
  const safetyScore = Math.max(0, 100 - violations * 10);

  const workers = db.prepare(`SELECT id FROM workers WHERE contractor_id = ?`).all(contractorId).map(w => w.id);
  let attendanceScore = 100;
  if (workers.length) {
    const placeholders = workers.map(() => '?').join(',');
    const totalRecords = db.prepare(`SELECT COUNT(*) AS c FROM attendance WHERE worker_id IN (${placeholders})`).get(...workers).c;
    const present = db.prepare(`SELECT COUNT(*) AS c FROM attendance WHERE worker_id IN (${placeholders}) AND status IN ('Present','Half Day')`).get(...workers).c;
    attendanceScore = totalRecords ? Math.round((present / totalRecords) * 100) : 100;
  }

  const complianceScore = Math.round(docScore * 0.4 + safetyScore * 0.4 + attendanceScore * 0.2);
  db.prepare(`UPDATE contractors SET compliance_score = ?, safety_score = ?, attendance_score = ? WHERE id = ?`)
    .run(complianceScore, safetyScore, attendanceScore, contractorId);
  return { complianceScore, safetyScore, attendanceScore };
}

router.get('/', authenticate, (req, res) => {
  const { search = '', mine_id, contract_status, page = 1, limit = 20 } = req.query;
  let where = ' WHERE 1=1';
  const params = [];
  if (search) { where += ' AND (c.name LIKE ? OR c.contractor_code LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (mine_id) { where += ' AND c.mine_id = ?'; params.push(mine_id); }
  if (contract_status) { where += ' AND c.contract_status = ?'; params.push(contract_status); }
  if (req.user.role === 'contractor' && req.user.contractor_id) { where += ' AND c.id = ?'; params.push(req.user.contractor_id); }
  else if (['mine_manager'].includes(req.user.role) && req.user.mine_id) { where += ' AND c.mine_id = ?'; params.push(req.user.mine_id); }

  const offset = (Number(page) - 1) * Number(limit);
  const total = db.prepare(`SELECT COUNT(*) AS c FROM contractors c ${where}`).get(...params).c;
  const rows = db.prepare(`
    SELECT c.*, m.name AS mine_name FROM contractors c LEFT JOIN mines m ON m.id = c.mine_id
    ${where} ORDER BY c.compliance_score ASC LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);
  res.json({ data: rows, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
});

router.get('/:id', authenticate, (req, res) => {
  const contractor = db.prepare(`SELECT c.*, m.name AS mine_name FROM contractors c LEFT JOIN mines m ON m.id = c.mine_id WHERE c.id = ?`).get(req.params.id);
  if (!contractor) return res.status(404).json({ error: 'Contractor not found.' });
  const documents = db.prepare(`SELECT * FROM contractor_documents WHERE contractor_id = ?`).all(req.params.id);
  const workers = db.prepare(`SELECT * FROM workers WHERE contractor_id = ?`).all(req.params.id);
  res.json({ data: { ...contractor, documents, workers } });
});

router.post('/', authenticate, authorize('super_admin', 'mine_manager'), (req, res, next) => {
  try {
    const b = req.body;
    const count = db.prepare(`SELECT COUNT(*) AS c FROM contractors`).get().c;
    const contractor_code = `CTR-${String(count + 1).padStart(4, '0')}`;
    const info = db.prepare(`
      INSERT INTO contractors (contractor_code, name, mine_id, contract_status, contract_start, contract_end)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(contractor_code, b.name, b.mine_id, b.contract_status || 'Active', b.contract_start || null, b.contract_end || null);
    logAudit({ user: req.user, action: 'CREATE', module: 'contractors', recordId: info.lastInsertRowid, newValue: b, ip: req.ip });
    res.status(201).json({ data: db.prepare(`SELECT * FROM contractors WHERE id = ?`).get(info.lastInsertRowid) });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('super_admin', 'mine_manager'), (req, res, next) => {
  try {
    const existing = db.prepare(`SELECT * FROM contractors WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Contractor not found.' });
    const b = req.body;
    db.prepare(`
      UPDATE contractors SET name=COALESCE(?,name), contract_status=COALESCE(?,contract_status),
      contract_start=COALESCE(?,contract_start), contract_end=COALESCE(?,contract_end) WHERE id=?
    `).run(b.name, b.contract_status, b.contract_start, b.contract_end, req.params.id);
    logAudit({ user: req.user, action: 'UPDATE', module: 'contractors', recordId: req.params.id, previousValue: existing, newValue: b, ip: req.ip });
    res.json({ data: db.prepare(`SELECT * FROM contractors WHERE id = ?`).get(req.params.id) });
  } catch (err) { next(err); }
});

router.post('/:id/recalculate-score', authenticate, (req, res) => {
  const contractor = db.prepare(`SELECT * FROM contractors WHERE id = ?`).get(req.params.id);
  if (!contractor) return res.status(404).json({ error: 'Contractor not found.' });
  const scores = recalcContractorScore(req.params.id);
  res.json({ data: { id: Number(req.params.id), ...scores } });
});

// Documents
router.post('/:id/documents', authenticate, (req, res, next) => {
  try {
    const b = req.body;
    const today = new Date().toISOString().slice(0, 10);
    let status = 'Valid';
    if (b.expiry_date) {
      const daysLeft = (new Date(b.expiry_date) - new Date(today)) / 86400000;
      if (daysLeft < 0) status = 'Expired';
      else if (daysLeft <= 30) status = 'Expiring Soon';
    }
    const info = db.prepare(`INSERT INTO contractor_documents (contractor_id, name, expiry_date, status) VALUES (?, ?, ?, ?)`)
      .run(req.params.id, b.name, b.expiry_date || null, status);

    if (status !== 'Valid') {
      db.prepare(`INSERT INTO notifications (role_target, type, priority, message, module, related_id) VALUES (?, ?, ?, ?, 'contractors', ?)`)
        .run('mine_manager', 'Document Expiry', status === 'Expired' ? 'High' : 'Medium', `Document "${b.name}" for contractor #${req.params.id} is ${status.toLowerCase()}.`, req.params.id);
    }
    recalcContractorScore(req.params.id);
    logAudit({ user: req.user, action: 'CREATE', module: 'contractor_documents', recordId: info.lastInsertRowid, newValue: b, ip: req.ip });
    res.status(201).json({ data: db.prepare(`SELECT * FROM contractor_documents WHERE id = ?`).get(info.lastInsertRowid) });
  } catch (err) { next(err); }
});

module.exports = { router, recalcContractorScore };
