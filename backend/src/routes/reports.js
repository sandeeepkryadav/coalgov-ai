const express = require('express');
const PDFDocument = require('pdfkit');
const db = require('../db/db');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();

const REPORT_QUERIES = {
  compliance: (where, params) => db.prepare(`SELECT c.*, m.name AS mine_name FROM compliance_items c LEFT JOIN mines m ON m.id = c.mine_id ${where}`).all(...params),
  safety: (where, params) => db.prepare(`SELECT si.*, m.name AS mine_name FROM safety_incidents si LEFT JOIN mines m ON m.id = si.mine_id ${where.replace('created_at', 'date')}`).all(...params),
  environmental: (where, params) => db.prepare(`SELECT e.*, m.name AS mine_name FROM environmental_records e LEFT JOIN mines m ON m.id = e.mine_id ${where.replace('created_at', 'recorded_at')}`).all(...params),
  inspection: (where, params) => db.prepare(`SELECT i.*, m.name AS mine_name FROM inspections i LEFT JOIN mines m ON m.id = i.mine_id ${where}`).all(...params),
  production: (where, params) => db.prepare(`SELECT p.*, m.name AS mine_name FROM production_records p LEFT JOIN mines m ON m.id = p.mine_id ${where.replace('created_at', 'date')}`).all(...params),
  contractor: (where, params) => db.prepare(`SELECT c.*, m.name AS mine_name FROM contractors c LEFT JOIN mines m ON m.id = c.mine_id ${where}`).all(...params),
  labour: (where, params) => db.prepare(`SELECT w.*, m.name AS mine_name FROM workers w LEFT JOIN mines m ON m.id = w.mine_id ${where}`).all(...params),
  grievance: (where, params) => db.prepare(`SELECT * FROM grievances ${where}`).all(...params),
  corrective_action: (where, params) => db.prepare(`SELECT ca.*, m.name AS mine_name FROM corrective_actions ca LEFT JOIN mines m ON m.id = ca.mine_id ${where}`).all(...params)
};

function buildWhere(query) {
  const { mine_id, category, from, to } = query;
  let where = ' WHERE 1=1';
  const params = [];
  if (mine_id) { where += ' AND mine_id = ?'; params.push(mine_id); }
  if (category) { where += ' AND category = ?'; params.push(category); }
  if (from) { where += ' AND created_at >= ?'; params.push(from); }
  if (to) { where += ' AND created_at <= ?'; params.push(to); }
  return { where, params };
}

router.get('/summary', authenticate, (req, res) => {
  const complianceRate = (() => {
    const items = db.prepare(`SELECT status FROM compliance_items`).all();
    if (!items.length) return 0;
    return Math.round((items.filter(i => i.status === 'Compliant').length / items.length) * 1000) / 10;
  })();
  const totalViolations = db.prepare(`SELECT COUNT(*) AS c FROM violations`).get().c;
  const closedActions = db.prepare(`SELECT COUNT(*) AS c FROM corrective_actions WHERE status = 'Closed'`).get().c;
  const pendingActions = db.prepare(`SELECT COUNT(*) AS c FROM corrective_actions WHERE status NOT IN ('Closed')`).get().c;
  const byCategory = db.prepare(`
    SELECT category, ROUND(AVG(CASE WHEN status='Compliant' THEN 100.0 ELSE 0 END),1) AS rate
    FROM compliance_items GROUP BY category
  `).all();
  res.json({ data: { complianceRate, totalViolations, closedActions, pendingActions, byCategory } });
});

router.get('/:type/export', authenticate, (req, res) => {
  const { type } = req.params;
  const { format = 'csv' } = req.query;
  const queryFn = REPORT_QUERIES[type];
  if (!queryFn) return res.status(400).json({ error: 'Unknown report type.' });

  const { where, params } = buildWhere(req.query);
  const rows = queryFn(where, params);

  logAudit({ user: req.user, action: 'GENERATE_REPORT', module: 'reports', newValue: { type, format, count: rows.length }, ip: req.ip });

  if (format === 'json') return res.json({ data: rows });

  if (format === 'pdf') {
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.pdf"`);
    doc.pipe(res);
    doc.fontSize(18).text(`CoalGov AI - ${type.replace('_', ' ').toUpperCase()} Report`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(9).fillColor('gray').text(`Generated: ${new Date().toLocaleString()} | Records: ${rows.length}`, { align: 'center' });
    doc.moveDown();
    doc.fillColor('black');
    rows.slice(0, 200).forEach((row, idx) => {
      const line = Object.entries(row).filter(([k]) => !['id'].includes(k)).map(([k, v]) => `${k}: ${v ?? '-'}`).join('  |  ');
      doc.fontSize(8).text(`${idx + 1}. ${line}`, { width: 520 });
      doc.moveDown(0.3);
    });
    doc.end();
    return;
  }

  // CSV (default)
  if (!rows.length) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
    return res.send('No records found for the selected filters.\n');
  }
  const headers = Object.keys(rows[0]);
  const csvLines = [headers.join(',')];
  rows.forEach(row => {
    csvLines.push(headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','));
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
  res.send(csvLines.join('\n'));
});

module.exports = router;
