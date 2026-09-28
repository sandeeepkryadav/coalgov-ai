const express = require('express');
const db = require('../db/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('./audit');

/**
 * Builds a fully working REST router (list/get/create/update/delete) for a
 * table, backed by real SQL against the SQLite database. Used for modules
 * whose CRUD shape is standard (compliance items, safety observations,
 * environmental records, production records, workers, attendance, grievances,
 * contractor documents, notifications) so every module hits real data
 * instead of being hand-rolled and risking inconsistency.
 *
 * config = {
 *   table, module, codePrefix,
 *   readRoles: [...] | null (null = any authenticated user),
 *   writeRoles: [...] | null,
 *   searchable: ['col1','col2'],
 *   mineScoped: true|false   -> restricts mine_manager/safety_officer/environmental_officer/field_inspector to their own mine_id
 * }
 */
function buildCrudRouter(config) {
  const router = express.Router();
  const { table, module, codePrefix, readRoles, writeRoles, searchable = [], mineScoped = true, defaultOrder = 'id DESC' } = config;

  function scopeClause(user) {
    const mineRestricted = ['mine_manager', 'safety_officer', 'environmental_officer', 'field_inspector'];
    if (mineScoped && mineRestricted.includes(user.role) && user.mine_id) {
      return { clause: ' AND mine_id = ?', params: [user.mine_id] };
    }
    if (user.role === 'contractor' && user.contractor_id && table === 'contractor_documents') {
      return { clause: ' AND contractor_id = ?', params: [user.contractor_id] };
    }
    return { clause: '', params: [] };
  }

  // LIST
  router.get('/', authenticate, readRoles ? authorize(...readRoles) : (req, res, next) => next(), (req, res) => {
    const { page = 1, limit = 20, search = '', status, mine_id, category, priority, from, to } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    let where = ' WHERE 1=1';
    const params = [];

    if (search && searchable.length) {
      where += ` AND (${searchable.map(c => `${c} LIKE ?`).join(' OR ')})`;
      searchable.forEach(() => params.push(`%${search}%`));
    }
    if (status) { where += ' AND status = ?'; params.push(status); }
    if (mine_id) { where += ' AND mine_id = ?'; params.push(mine_id); }
    if (category) { where += ' AND category = ?'; params.push(category); }
    if (priority) { where += ' AND priority = ?'; params.push(priority); }
    if (from) { where += ' AND created_at >= ?'; params.push(from); }
    if (to) { where += ' AND created_at <= ?'; params.push(to); }

    const scope = scopeClause(req.user);
    where += scope.clause;
    params.push(...scope.params);

    const total = db.prepare(`SELECT COUNT(*) AS c FROM ${table} ${where}`).get(...params).c;
    const rows = db.prepare(`SELECT * FROM ${table} ${where} ORDER BY ${defaultOrder} LIMIT ? OFFSET ?`).all(...params, Number(limit), offset);
    res.json({ data: rows, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  });

  // GET ONE
  router.get('/:id', authenticate, readRoles ? authorize(...readRoles) : (req, res, next) => next(), (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Record not found.' });
    res.json({ data: row });
  });

  // CREATE
  router.post('/', authenticate, writeRoles ? authorize(...writeRoles) : (req, res, next) => next(), (req, res) => {
    const body = { ...req.body };
    delete body.id;

    if (mineScoped && ['mine_manager', 'safety_officer', 'environmental_officer', 'field_inspector'].includes(req.user.role) && req.user.mine_id && !body.mine_id) {
      body.mine_id = req.user.mine_id;
    }

    if (codePrefix) {
      const count = db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get().c;
      body[`${table.replace(/s$/, '')}_code`] = `${codePrefix}-${String(count + 1).padStart(4, '0')}`;
    }

    const cols = Object.keys(body);
    const placeholders = cols.map(() => '?').join(',');
    const info = db.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`).run(...cols.map(c => body[c]));

    logAudit({ user: req.user, action: 'CREATE', module, recordId: info.lastInsertRowid, newValue: body, ip: req.ip });
    const created = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(info.lastInsertRowid);
    res.status(201).json({ data: created });
  });

  // UPDATE
  router.put('/:id', authenticate, writeRoles ? authorize(...writeRoles) : (req, res, next) => next(), (req, res) => {
    const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Record not found.' });

    const body = { ...req.body };
    delete body.id;
    if ('updated_at' in existing) body.updated_at = new Date().toISOString();

    const cols = Object.keys(body);
    if (cols.length === 0) return res.status(400).json({ error: 'No fields to update.' });
    const setClause = cols.map(c => `${c} = ?`).join(', ');
    db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`).run(...cols.map(c => body[c]), req.params.id);

    logAudit({ user: req.user, action: 'UPDATE', module, recordId: req.params.id, previousValue: existing, newValue: body, ip: req.ip });
    const updated = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    res.json({ data: updated });
  });

  // DELETE
  router.delete('/:id', authenticate, writeRoles ? authorize(...writeRoles) : (req, res, next) => next(), (req, res) => {
    const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Record not found.' });
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    logAudit({ user: req.user, action: 'DELETE', module, recordId: req.params.id, previousValue: existing, ip: req.ip });
    res.json({ data: { id: Number(req.params.id) } });
  });

  return router;
}

module.exports = buildCrudRouter;
