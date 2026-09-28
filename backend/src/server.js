require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./db/db');
const buildCrudRouter = require('./utils/crudFactory');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const mineRoutes = require('./routes/mines');
const subsidiaryRoutes = require('./routes/subsidiaries');
const inspectionRoutes = require('./routes/inspections');
const complianceRoutes = require('./routes/compliance');
const violationRoutes = require('./routes/violations');
const correctiveActionRoutes = require('./routes/correctiveActions');
const safetyRoutes = require('./routes/safety');
const environmentRoutes = require('./routes/environment');
const { router: contractorRoutes } = require('./routes/contractors');
const grievanceRoutes = require('./routes/grievances');
const notificationRoutes = require('./routes/notifications');
const auditLogRoutes = require('./routes/auditLogs');
const dashboardRoutes = require('./routes/dashboard');
const analyticsRoutes = require('./routes/analytics');
const reportRoutes = require('./routes/reports');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mines', mineRoutes);
app.use('/api/subsidiaries', subsidiaryRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/corrective-actions', correctiveActionRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/environment', environmentRoutes);
app.use('/api/contractors', contractorRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);

// Generic, fully-functional CRUD modules built on the shared factory (real DB reads/writes, RBAC, audit trail).
app.use('/api/production', buildCrudRouter({
  table: 'production_records', module: 'production', searchable: [], mineScoped: true, defaultOrder: 'date DESC',
  readRoles: null, writeRoles: ['super_admin', 'mine_manager']
}));
app.use('/api/workers', buildCrudRouter({
  table: 'workers', module: 'workers', codePrefix: 'WRK', searchable: ['name', 'worker_code', 'designation'], mineScoped: true,
  readRoles: null, writeRoles: ['super_admin', 'mine_manager', 'contractor']
}));
app.use('/api/attendance', buildCrudRouter({
  table: 'attendance', module: 'attendance', searchable: [], mineScoped: false, defaultOrder: 'date DESC',
  readRoles: null, writeRoles: ['super_admin', 'mine_manager', 'contractor']
}));
app.use('/api/contractor-documents', buildCrudRouter({
  table: 'contractor_documents', module: 'contractor_documents', mineScoped: false,
  readRoles: null, writeRoles: ['super_admin', 'mine_manager', 'contractor']
}));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 CoalGov AI backend running on http://localhost:${PORT}`);
  console.log(`   Database: ${process.env.DB_PATH || './database/coalgov.db'}`);
  console.log(`   Run "npm run seed" first if you haven't already.\n`);
});

module.exports = app;
