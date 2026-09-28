const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'database', 'coalgov.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------------------------------------------------------------------------
// SCHEMA
// ---------------------------------------------------------------------------
db.exec(`
CREATE TABLE IF NOT EXISTS subsidiaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mine_code TEXT UNIQUE,
  name TEXT NOT NULL,
  subsidiary_id INTEGER REFERENCES subsidiaries(id),
  location TEXT,
  state TEXT,
  district TEXT,
  manager_id INTEGER,
  production_capacity REAL DEFAULT 0,
  current_production REAL DEFAULT 0,
  compliance_pct REAL DEFAULT 0,
  risk_score REAL DEFAULT 0,
  risk_level TEXT DEFAULT 'Low',
  status TEXT DEFAULT 'Active',
  lat REAL,
  lng REAL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('super_admin','leadership','mine_manager','safety_officer','environmental_officer','field_inspector','contractor','worker','regulator')),
  mine_id INTEGER REFERENCES mines(id),
  contractor_id INTEGER,
  phone TEXT,
  avatar TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inspections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inspection_code TEXT UNIQUE,
  mine_id INTEGER REFERENCES mines(id),
  inspector_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL,
  scheduled_date TEXT,
  priority TEXT DEFAULT 'Medium',
  description TEXT,
  status TEXT DEFAULT 'Created' CHECK(status IN ('Created','Assigned','In Progress','Findings Recorded','Corrective Action','Verification','Closed')),
  created_by INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inspection_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inspection_id INTEGER REFERENCES inspections(id),
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'Medium',
  recommendation TEXT,
  evidence_path TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS compliance_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  compliance_code TEXT UNIQUE,
  mine_id INTEGER REFERENCES mines(id),
  category TEXT NOT NULL,
  requirement TEXT NOT NULL,
  responsible_person TEXT,
  frequency TEXT,
  due_date TEXT,
  status TEXT DEFAULT 'Pending Review' CHECK(status IN ('Compliant','Partially Compliant','Non-Compliant','Expired','Pending Review')),
  risk TEXT DEFAULT 'Low',
  evidence_path TEXT,
  remarks TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS violations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  violation_code TEXT UNIQUE,
  mine_id INTEGER REFERENCES mines(id),
  inspection_id INTEGER REFERENCES inspections(id),
  contractor_id INTEGER,
  category TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Open' CHECK(status IN ('Open','In Progress','Closed')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS corrective_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action_code TEXT UNIQUE,
  violation_id INTEGER REFERENCES violations(id),
  mine_id INTEGER REFERENCES mines(id),
  finding TEXT,
  responsible_person TEXT,
  priority TEXT DEFAULT 'Medium',
  due_date TEXT,
  status TEXT DEFAULT 'Open' CHECK(status IN ('Open','In Progress','Submitted for Verification','Verified','Closed','Overdue')),
  evidence_path TEXT,
  verification_notes TEXT,
  closure_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS safety_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_code TEXT UNIQUE,
  mine_id INTEGER REFERENCES mines(id),
  date TEXT,
  location TEXT,
  type TEXT,
  severity TEXT DEFAULT 'Medium',
  persons_affected INTEGER DEFAULT 0,
  description TEXT,
  root_cause TEXT,
  status TEXT DEFAULT 'Open' CHECK(status IN ('Open','Investigating','Closed')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS safety_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mine_id INTEGER REFERENCES mines(id),
  observer_id INTEGER REFERENCES users(id),
  category TEXT,
  description TEXT,
  ppe_compliant INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Open',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS environmental_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mine_id INTEGER REFERENCES mines(id),
  parameter TEXT NOT NULL CHECK(parameter IN ('Air Quality','Dust','Water Quality','Noise','Waste')),
  value REAL,
  unit TEXT,
  threshold REAL,
  status TEXT DEFAULT 'Normal' CHECK(status IN ('Normal','Warning','Breach')),
  recorded_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS production_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mine_id INTEGER REFERENCES mines(id),
  date TEXT,
  target REAL,
  actual REAL,
  dispatch REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contractors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contractor_code TEXT UNIQUE,
  name TEXT NOT NULL,
  mine_id INTEGER REFERENCES mines(id),
  contract_status TEXT DEFAULT 'Active',
  contract_start TEXT,
  contract_end TEXT,
  compliance_score REAL DEFAULT 0,
  safety_score REAL DEFAULT 0,
  attendance_score REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contractor_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contractor_id INTEGER REFERENCES contractors(id),
  name TEXT,
  expiry_date TEXT,
  status TEXT DEFAULT 'Valid' CHECK(status IN ('Valid','Expiring Soon','Expired')),
  file_path TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_code TEXT UNIQUE,
  name TEXT NOT NULL,
  mine_id INTEGER REFERENCES mines(id),
  contractor_id INTEGER REFERENCES contractors(id),
  designation TEXT,
  phone TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER REFERENCES workers(id),
  date TEXT,
  status TEXT DEFAULT 'Present' CHECK(status IN ('Present','Absent','Leave','Half Day')),
  shift TEXT DEFAULT 'Day',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS grievances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grievance_code TEXT UNIQUE,
  mine_id INTEGER REFERENCES mines(id),
  submitted_by INTEGER REFERENCES users(id),
  anonymous INTEGER DEFAULT 0,
  category TEXT,
  description TEXT,
  priority TEXT DEFAULT 'Medium',
  assigned_officer TEXT,
  status TEXT DEFAULT 'Submitted' CHECK(status IN ('Submitted','Assigned','Under Review','Action Taken','Resolved','Closed')),
  resolution TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  role_target TEXT,
  type TEXT,
  priority TEXT DEFAULT 'Medium',
  message TEXT NOT NULL,
  module TEXT,
  related_id INTEGER,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS risk_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mine_id INTEGER REFERENCES mines(id),
  score REAL,
  level TEXT,
  factors_json TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_name TEXT,
  role TEXT,
  action TEXT,
  module TEXT,
  record_id INTEGER,
  previous_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_inspections_mine ON inspections(mine_id);
CREATE INDEX IF NOT EXISTS idx_compliance_mine ON compliance_items(mine_id);
CREATE INDEX IF NOT EXISTS idx_violations_mine ON violations(mine_id);
CREATE INDEX IF NOT EXISTS idx_corrective_mine ON corrective_actions(mine_id);
CREATE INDEX IF NOT EXISTS idx_env_mine ON environmental_records(mine_id);
CREATE INDEX IF NOT EXISTS idx_prod_mine ON production_records(mine_id);
CREATE INDEX IF NOT EXISTS idx_attendance_worker ON attendance(worker_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
`);

module.exports = db;
