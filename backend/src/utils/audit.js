const db = require('../db/db');

/**
 * Records an entry in the audit trail.
 * Called from controllers after any create/update/delete
 * so every mutating action in the system is traceable.
 */
function logAudit({ user, action, module, recordId, previousValue, newValue, ip }) {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (
      user_id,
      user_name,
      role,
      action,
      module,
      record_id,
      previous_value,
      new_value,
      ip_address
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    user ? user.id : null,
    user ? user.name : 'system',
    user ? user.role : 'system',
    action,
    module,
    recordId || null,
    previousValue ? JSON.stringify(previousValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    ip || null
  );
}

module.exports = { logAudit };