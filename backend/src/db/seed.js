/* eslint-disable no-console */
const bcrypt = require('bcryptjs');
const db = require('./db');
const { recalculateAllRisk } = require('../utils/ai');

const DEMO_PASSWORD = 'Demo@123';

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

console.log('Clearing existing data...');
const tables = [
  'audit_logs', 'risk_scores', 'notifications', 'grievances', 'attendance', 'workers',
  'contractor_documents', 'contractors', 'production_records', 'environmental_records',
  'safety_observations', 'safety_incidents', 'corrective_actions', 'violations',
  'inspection_findings', 'inspections', 'compliance_items', 'users', 'mines', 'subsidiaries'
];
tables.forEach(t => db.prepare(`DELETE FROM ${t}`).run());
tables.forEach(t => db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(t));

console.log('Seeding subsidiaries...');
const subsidiaryNames = [
  'Bharat Coking Coal Limited (BCCL)',
  'Eastern Coalfields Limited (ECL)',
  'Central Coalfields Limited (CCL)',
  'South Eastern Coalfields Limited (SECL)',
  'Northern Coalfields Limited (NCL)',
  'Mahanadi Coalfields Limited (MCL)'
];
const subsidiaryIds = subsidiaryNames.map(name => db.prepare(`INSERT INTO subsidiaries (name) VALUES (?)`).run(name).lastInsertRowid);

console.log('Seeding mines...');
const mineDefs = [
  { name: 'Jharia Colliery', sub: 0, state: 'Jharkhand', district: 'Dhanbad', cap: 4500 },
  { name: 'Kusunda Colliery', sub: 0, state: 'Jharkhand', district: 'Dhanbad', cap: 3200 },
  { name: 'Rajmahal OCP', sub: 1, state: 'Jharkhand', district: 'Godda', cap: 11000 },
  { name: 'Sonepur Bazari OCP', sub: 1, state: 'West Bengal', district: 'Bardhaman', cap: 6500 },
  { name: 'Piparwar OCP', sub: 2, state: 'Jharkhand', district: 'Chatra', cap: 5200 },
  { name: 'Gevra OCP', sub: 3, state: 'Chhattisgarh', district: 'Korba', cap: 22000 },
  { name: 'Kusmunda OCP', sub: 3, state: 'Chhattisgarh', district: 'Korba', cap: 18500 },
  { name: 'Dipka OCP', sub: 3, state: 'Chhattisgarh', district: 'Korba', cap: 16000 },
  { name: 'Amlohri OCP', sub: 4, state: 'Madhya Pradesh', district: 'Singrauli', cap: 9000 },
  { name: 'Jayant OCP', sub: 4, state: 'Madhya Pradesh', district: 'Singrauli', cap: 11500 },
  { name: 'Talcher OCP', sub: 5, state: 'Odisha', district: 'Angul', cap: 19000 },
  { name: 'Ib Valley OCP', sub: 5, state: 'Odisha', district: 'Jharsuguda', cap: 14000 }
];
const mineIds = mineDefs.map((m, idx) => db.prepare(`
  INSERT INTO mines (mine_code, name, subsidiary_id, location, state, district, production_capacity, current_production, compliance_pct, status, lat, lng)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?)
`).run(
  `MINE-${String(idx + 1).padStart(3, '0')}`, m.name, subsidiaryIds[m.sub], `${m.district}, ${m.state}`, m.state, m.district,
  m.cap, Math.round(m.cap * (0.75 + Math.random() * 0.2)), 0,
  22 + Math.random() * 3, 82 + Math.random() * 3
).lastInsertRowid);

console.log('Seeding users (demo accounts + operational staff)...');
const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);
const managerNames = ['Ramesh Kumar', 'Sanjay Mehta', 'Anil Verma', 'Deepak Rao', 'Vikram Singh', 'Manoj Tiwari', 'Ashok Yadav', 'Suresh Nair', 'Rajeev Gupta', 'Pankaj Sharma', 'Naveen Chandra', 'Arvind Joshi'];
const inspectorNames = ['Priya Singh', 'Kavita Rao', 'Amit Desai', 'Neha Kulkarni'];

function insertUser(name, email, role, mine_id = null, contractor_id = null) {
  return db.prepare(`
    INSERT INTO users (name, email, password_hash, role, mine_id, contractor_id) VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, email.toLowerCase(), passwordHash, role, mine_id, contractor_id).lastInsertRowid;
}

const adminId = insertUser('Admin User', 'admin@coalgov.demo', 'super_admin');
const leadershipId = insertUser('Sanjay Mehta', 'leadership@coalgov.demo', 'leadership');
const regulatorId = insertUser('Anita Sharma', 'regulator@coalgov.demo', 'regulator');

const managerIds = mineIds.map((mineId, idx) => insertUser(managerNames[idx], idx === 0 ? 'manager@coalgov.demo' : `mgr.${mineDefs[idx].name.toLowerCase().replace(/[^a-z]+/g, '.')}@coalgov.demo`, 'mine_manager', mineId));
managerIds.forEach((uid, idx) => db.prepare(`UPDATE mines SET manager_id = ? WHERE id = ?`).run(uid, mineIds[idx]));

const safetyOfficerId = insertUser('Ramesh Kumar', 'safety@coalgov.demo', 'safety_officer', mineIds[0]);
const envOfficerId = insertUser('Sunita Patel', 'environment@coalgov.demo', 'environmental_officer', mineIds[0]);

const inspectorIds = inspectorNames.map((name, idx) => insertUser(name, idx === 0 ? 'inspector@coalgov.demo' : `${name.toLowerCase().replace(' ', '.')}@coalgov.demo`, 'field_inspector'));

const workerDemoId = insertUser('Ravi Prasad', 'worker@coalgov.demo', 'worker', mineIds[0]);

console.log('Seeding contractors...');
const contractorCompanyNames = [
  'XYZ Contractors Ltd.', 'Bharat Mining Services Pvt. Ltd.', 'Coalfield Logistics Co.', 'Shakti Earthmovers Pvt. Ltd.',
  'National Mine Support Services', 'Deccan Heavy Equipment Ltd.', 'Vindhya Mining Contractors', 'Orissa Coal Handlers Pvt. Ltd.',
  'Gondwana Infra Projects', 'Mahanadi Transport & Mining Co.'
];
const contractorIds = contractorCompanyNames.map((name, idx) => db.prepare(`
  INSERT INTO contractors (contractor_code, name, mine_id, contract_status, contract_start, contract_end, compliance_score, safety_score, attendance_score)
  VALUES (?, ?, ?, 'Active', ?, ?, ?, ?, ?)
`).run(
  `CTR-${String(idx + 1).padStart(4, '0')}`, name, pick(mineIds), daysAgo(rand(200, 700)), daysFromNow(rand(-20, 300)),
  rand(60, 98), rand(60, 98), rand(70, 99)
).lastInsertRowid);

// Link the demo contractor login to the first contractor company
db.prepare(`UPDATE users SET contractor_id = ? WHERE id = ?`).run(contractorIds[0], insertUser('Rahul Verma', 'contractor@coalgov.demo', 'contractor', mineIds[0], contractorIds[0]));

console.log('Seeding contractor documents...');
const docTypes = ['Safety Training Certificate', 'Labour License', 'Equipment Certification', 'Insurance Policy', 'Environmental Clearance Acknowledgement'];
contractorIds.forEach(cid => {
  docTypes.forEach(doc => {
    const expiry = daysFromNow(rand(-15, 180));
    let status = 'Valid';
    const daysLeft = (new Date(expiry) - new Date()) / 86400000;
    if (daysLeft < 0) status = 'Expired'; else if (daysLeft <= 30) status = 'Expiring Soon';
    db.prepare(`INSERT INTO contractor_documents (contractor_id, name, expiry_date, status) VALUES (?, ?, ?, ?)`).run(cid, doc, expiry, status);
  });
});

console.log('Seeding workers + attendance...');
const firstNames = ['Ravi', 'Suresh', 'Rajesh', 'Vinod', 'Mahesh', 'Dinesh', 'Santosh', 'Ramesh', 'Ashok', 'Prakash', 'Sunil', 'Kailash', 'Mukesh', 'Naresh', 'Umesh'];
const lastNames = ['Prasad', 'Kumar', 'Yadav', 'Singh', 'Mahato', 'Oraon', 'Soren', 'Das', 'Behera', 'Nayak'];
const designations = ['Loader Operator', 'Dumper Driver', 'Drill Operator', 'Blaster', 'Surveyor Assistant', 'Electrician', 'Fitter', 'General Labourer', 'Safety Marshal', 'Machine Operator'];
const workerIds = [];
mineIds.forEach(mineId => {
  const count = rand(4, 6);
  for (let i = 0; i < count; i++) {
    const name = `${pick(firstNames)} ${pick(lastNames)}`;
    const contractorId = pick(contractorIds);
    const id = db.prepare(`
      INSERT INTO workers (worker_code, name, mine_id, contractor_id, designation, phone) VALUES (?, ?, ?, ?, ?, ?)
    `).run(`WRK-${String(workerIds.length + 1).padStart(4, '0')}`, name, mineId, contractorId, pick(designations), `9${rand(100000000, 999999999)}`).lastInsertRowid;
    workerIds.push(id);
  }
});
// Ensure the demo worker login has a matching worker record for attendance/grievance linkage
const demoWorkerRowId = db.prepare(`
  INSERT INTO workers (worker_code, name, mine_id, contractor_id, designation, phone) VALUES (?, 'Ravi Prasad', ?, ?, 'Safety Marshal', '9812345678')
`).run(`WRK-${String(workerIds.length + 1).padStart(4, '0')}`, mineIds[0], contractorIds[0]).lastInsertRowid;
workerIds.push(demoWorkerRowId);

workerIds.forEach(workerId => {
  for (let d = 0; d < 30; d++) {
    const roll = Math.random();
    const status = roll < 0.87 ? 'Present' : roll < 0.93 ? 'Absent' : roll < 0.97 ? 'Half Day' : 'Leave';
    db.prepare(`INSERT INTO attendance (worker_id, date, status, shift) VALUES (?, ?, ?, ?)`).run(workerId, daysAgo(d), status, pick(['Day', 'Night']));
  }
});

console.log('Seeding compliance items...');
const complianceCategories = ['Safety', 'Environment', 'Labour', 'Statutory', 'Equipment', 'Contractor', 'Production'];
const requirementsByCategory = {
  Safety: ['Fire safety equipment inspection', 'Emergency evacuation drill', 'PPE stock audit', 'Gas detection system calibration'],
  Environment: ['Air quality monitoring submission', 'Effluent discharge compliance', 'Tree plantation target report', 'Mine closure plan review'],
  Labour: ['Minimum wages compliance', 'Provident fund deposit', 'Weekly working hours audit', 'Contract labour registration renewal'],
  Statutory: ['DGMS annual return filing', 'Mining plan approval renewal', 'Explosives license renewal', 'Environmental clearance renewal'],
  Equipment: ['Heavy machinery fitness certificate', 'Conveyor belt safety inspection', 'Crane load test certification'],
  Contractor: ['Contractor safety training completion', 'Contractor insurance validity', 'Sub-contractor registration check'],
  Production: ['Monthly production target reconciliation', 'Dispatch weighbridge calibration']
};
const complianceStatuses = ['Compliant', 'Compliant', 'Compliant', 'Partially Compliant', 'Non-Compliant', 'Pending Review', 'Expired'];
let complianceCount = 0;
mineIds.forEach(mineId => {
  for (let i = 0; i < rand(3, 5); i++) {
    const category = pick(complianceCategories);
    const requirement = pick(requirementsByCategory[category]);
    complianceCount++;
    db.prepare(`
      INSERT INTO compliance_items (compliance_code, mine_id, category, requirement, responsible_person, frequency, due_date, status, risk, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `CMP-${String(complianceCount).padStart(4, '0')}`, mineId, category, requirement, pick(managerNames),
      pick(['Monthly', 'Quarterly', 'Annual']), daysFromNow(rand(-20, 60)), pick(complianceStatuses),
      pick(['Low', 'Medium', 'High']), 'Reviewed during last periodic audit.'
    );
  }
});

console.log('Seeding inspections, findings and violations...');
const inspectionTypes = ['Safety', 'Environmental', 'Labour', 'Equipment', 'Statutory', 'Production', 'Contractor'];
const workflowStatuses = ['Created', 'Assigned', 'In Progress', 'Findings Recorded', 'Corrective Action', 'Verification', 'Closed'];
const violationCategories = { Safety: 'Safety - PPE', Environmental: 'Environment - Water', Production: 'Production - Target', Equipment: 'Equipment - Maintenance', Labour: 'Labour - Wages', Statutory: 'Statutory - Documentation', Contractor: 'Contractor - Compliance' };

let inspectionCount = 0, violationCount = 0, findingCount = 0;
const inspectionIds = [];
const violationIds = [];

mineIds.forEach(mineId => {
  for (let i = 0; i < rand(2, 4); i++) {
    const type = pick(inspectionTypes);
    const status = pick(workflowStatuses);
    inspectionCount++;
    const inspectionId = db.prepare(`
      INSERT INTO inspections (inspection_code, mine_id, inspector_id, type, scheduled_date, priority, description, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `INSP-${String(inspectionCount).padStart(4, '0')}`, mineId, pick(inspectorIds), type,
      status === 'Created' ? daysFromNow(rand(1, 10)) : daysAgo(rand(0, 45)),
      pick(['Low', 'Medium', 'High']), `${type} inspection covering routine statutory checkpoints.`, status, adminId
    ).lastInsertRowid;
    inspectionIds.push(inspectionId);

    if (['Findings Recorded', 'Corrective Action', 'Verification', 'Closed'].includes(status)) {
      findingCount++;
      db.prepare(`
        INSERT INTO inspection_findings (inspection_id, description, severity, recommendation) VALUES (?, ?, ?, ?)
      `).run(inspectionId, `Observed non-conformance during ${type.toLowerCase()} checks.`, pick(['Low', 'Medium', 'High']), 'Recommend corrective action within 15 days.');

      if (Math.random() < 0.7) {
        violationCount++;
        const vStatus = status === 'Closed' ? 'Closed' : pick(['Open', 'In Progress']);
        const vId = db.prepare(`
          INSERT INTO violations (violation_code, mine_id, inspection_id, category, description, severity, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(`VIO-${String(violationCount).padStart(4, '0')}`, mineId, inspectionId, violationCategories[type] || type,
          `${type} non-compliance identified during inspection ${String(inspectionCount).padStart(4, '0')}.`, pick(['Low', 'Medium', 'High']), vStatus).lastInsertRowid;
        violationIds.push({ id: vId, mineId, status: vStatus });
      }
    }
  }
});

console.log('Seeding corrective actions...');
let actionCount = 0;
violationIds.forEach(v => {
  if (Math.random() < 0.85) {
    actionCount++;
    const statusRoll = Math.random();
    let status, closureDate = null, dueDate;
    if (v.status === 'Closed') { status = 'Closed'; dueDate = daysAgo(rand(10, 60)); closureDate = daysAgo(rand(1, 9)); }
    else if (statusRoll < 0.15) { status = 'Overdue'; dueDate = daysAgo(rand(1, 20)); }
    else if (statusRoll < 0.4) { status = 'In Progress'; dueDate = daysFromNow(rand(1, 20)); }
    else if (statusRoll < 0.55) { status = 'Submitted for Verification'; dueDate = daysFromNow(rand(1, 10)); }
    else if (statusRoll < 0.7) { status = 'Verified'; dueDate = daysFromNow(rand(1, 10)); }
    else { status = 'Open'; dueDate = daysFromNow(rand(1, 30)); }

    db.prepare(`
      INSERT INTO corrective_actions (action_code, violation_id, mine_id, finding, responsible_person, priority, due_date, status, closure_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(`CA-${String(actionCount).padStart(4, '0')}`, v.id, v.mineId, 'Address root cause identified in inspection finding.', pick(managerNames), pick(['Low', 'Medium', 'High']), dueDate, status, closureDate);
  }
});

console.log('Seeding safety incidents & observations...');
const incidentTypes = ['Slip and Fall', 'Equipment Malfunction', 'Roof Fall', 'Vehicle Collision', 'Fire', 'Gas Leak', 'Electrical Shock'];
let incidentCount = 0;
mineIds.forEach(mineId => {
  for (let i = 0; i < rand(1, 3); i++) {
    incidentCount++;
    const status = pick(['Open', 'Investigating', 'Closed']);
    db.prepare(`
      INSERT INTO safety_incidents (incident_code, mine_id, date, location, type, severity, persons_affected, description, root_cause, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(`INC-${String(incidentCount).padStart(4, '0')}`, mineId, daysAgo(rand(0, 150)), pick(['North Pit', 'South Bench', 'Haul Road', 'Coal Handling Plant', 'Workshop']),
      pick(incidentTypes), pick(['Low', 'Medium', 'High', 'Critical']), rand(0, 3), 'Incident reported during shift operations; investigation conducted per SOP.',
      pick(['Inadequate PPE usage', 'Equipment wear and tear', 'Procedural lapse', 'Adverse weather condition']), status);
  }
  for (let i = 0; i < rand(2, 4); i++) {
    const ppe = Math.random() < 0.8;
    db.prepare(`
      INSERT INTO safety_observations (mine_id, observer_id, category, description, ppe_compliant, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(mineId, pick([safetyOfficerId, ...inspectorIds]), pick(['Near Miss', 'Hazard', 'PPE Compliance', 'Housekeeping']), 'Routine floor-level safety walk observation.', ppe ? 1 : 0, pick(['Open', 'Closed']));
  }
});

console.log('Seeding environmental records...');
const envParams = [
  { p: 'Air Quality', unit: 'µg/m³', threshold: 100 },
  { p: 'Dust', unit: 'mg/Nm³', threshold: 100 },
  { p: 'Water Quality', unit: 'pH x10', threshold: 85 },
  { p: 'Noise', unit: 'dB', threshold: 85 },
  { p: 'Waste', unit: 'tons/day', threshold: 50 }
];
mineIds.forEach(mineId => {
  for (let d = 0; d < 12; d++) {
    envParams.forEach(ep => {
      const value = Math.round(ep.threshold * (0.6 + Math.random() * 0.55));
      const status = value > ep.threshold ? 'Breach' : value > ep.threshold * 0.85 ? 'Warning' : 'Normal';
      db.prepare(`
        INSERT INTO environmental_records (mine_id, parameter, value, unit, threshold, status, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(mineId, ep.p, value, ep.unit, ep.threshold, status, daysAgo(d * 7));
    });
  }
});

console.log('Seeding production records...');
mineIds.forEach((mineId, idx) => {
  const capacity = mineDefs[idx].cap;
  for (let d = 59; d >= 0; d--) {
    const target = Math.round(capacity / 30);
    const actual = Math.round(target * (0.8 + Math.random() * 0.35));
    db.prepare(`INSERT INTO production_records (mine_id, date, target, actual, dispatch) VALUES (?, ?, ?, ?, ?)`)
      .run(mineId, daysAgo(d), target, actual, Math.round(actual * (0.9 + Math.random() * 0.15)));
  }
  const avgActual = db.prepare(`SELECT AVG(actual) AS a FROM production_records WHERE mine_id = ?`).get(mineId).a;
  db.prepare(`UPDATE mines SET current_production = ? WHERE id = ?`).run(Math.round(avgActual), mineId);
});

console.log('Seeding grievances...');
const grievanceCategories = ['Wages', 'Working Conditions', 'Safety Equipment', 'Harassment', 'Transport', 'Medical Facilities'];
let grievanceCount = 0;
mineIds.forEach(mineId => {
  for (let i = 0; i < rand(1, 3); i++) {
    grievanceCount++;
    db.prepare(`
      INSERT INTO grievances (grievance_code, mine_id, submitted_by, anonymous, category, description, priority, assigned_officer, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(`GRV-${String(grievanceCount).padStart(4, '0')}`, mineId, Math.random() < 0.3 ? null : workerDemoId, Math.random() < 0.3 ? 1 : 0,
      pick(grievanceCategories), 'Worker raised a concern during routine grievance collection drive.', pick(['Low', 'Medium', 'High']),
      pick(managerNames), pick(['Submitted', 'Assigned', 'Under Review', 'Action Taken', 'Resolved', 'Closed']));
  }
});

console.log('Calculating compliance % per mine from seeded data...');
mineIds.forEach(mineId => {
  const items = db.prepare(`SELECT status FROM compliance_items WHERE mine_id = ?`).all(mineId);
  const pct = items.length ? Math.round((items.filter(i => i.status === 'Compliant').length / items.length) * 1000) / 10 : 90;
  db.prepare(`UPDATE mines SET compliance_pct = ? WHERE id = ?`).run(pct, mineId);
});

console.log('Calculating AI risk scores...');
recalculateAllRisk();

console.log('Seeding a few starter notifications...');
db.prepare(`INSERT INTO notifications (role_target, type, priority, message, module) VALUES (?, ?, ?, ?, ?)`)
  .run('leadership', 'System', 'Low', 'Welcome to CoalGov AI. Demo data has been loaded successfully.', 'system');

console.log('\n✅ Seed complete.');
console.log(`   Mines: ${mineIds.length}, Compliance items: ${complianceCount}, Inspections: ${inspectionCount}, Violations: ${violationCount}`);
console.log(`   Corrective actions: ${actionCount}, Workers: ${workerIds.length}, Contractors: ${contractorIds.length}`);
console.log('\nDemo login password for every account: Demo@123\n');
