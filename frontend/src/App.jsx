import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

import Home from './pages/Public/Home';
import Transparency from './pages/Public/Transparency';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';

import AdminDashboard from './pages/Dashboards/AdminDashboard';
import LeadershipDashboard from './pages/Dashboards/LeadershipDashboard';
import ManagerDashboard from './pages/Dashboards/ManagerDashboard';
import InspectorDashboard from './pages/Dashboards/InspectorDashboard';
import ContractorDashboard from './pages/Dashboards/ContractorDashboard';
import RegulatorDashboard from './pages/Dashboards/RegulatorDashboard';
import WorkerDashboard from './pages/Dashboards/WorkerDashboard';

import MineList from './pages/Mines/MineList';
import MineDetail from './pages/Mines/MineDetail';
import GISMap from './pages/Mines/GISMap';

import InspectionList from './pages/Inspections/InspectionList';
import InspectionDetail from './pages/Inspections/InspectionDetail';

import Compliance from './pages/Modules/Compliance';
import Violations from './pages/Modules/Violations';
import CorrectiveActions from './pages/Modules/CorrectiveActions';
import Safety from './pages/Modules/Safety';
import SafetyObservations from './pages/Modules/SafetyObservations';
import Environment from './pages/Modules/Environment';
import Production from './pages/Modules/Production';
import Workers from './pages/Modules/Workers';
import Attendance from './pages/Modules/Attendance';
import Contractors from './pages/Modules/Contractors';
import ContractorDetail from './pages/Modules/ContractorDetail';
import Grievances from './pages/Modules/Grievances';
import Notifications from './pages/Modules/Notifications';

import ContractorDetails from './pages/Contractor/ContractorDetails';

import AIAnalytics from './pages/AIAnalytics/AIAnalytics';
import Reports from './pages/Reports/Reports';
import Profile from './pages/Profile';

import Users from './pages/Admin/Users';
import Subsidiaries from './pages/Admin/Subsidiaries';
import AuditLogs from './pages/Admin/AuditLogs';

import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';

const ALL_ROLES = ['super_admin', 'leadership', 'mine_manager', 'safety_officer', 'environmental_officer', 'field_inspector', 'contractor', 'worker', 'regulator'];

function Protected({ roles, title, children }) {
  return (
    <ProtectedRoute roles={roles}>
      <DashboardLayout title={title}>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/transparency" element={<Transparency />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/403" element={<Forbidden />} />

      {/* Dashboards */}
      <Route path="/admin/dashboard" element={<Protected roles={['super_admin']} title="Admin Dashboard"><AdminDashboard /></Protected>} />
      <Route path="/leadership/dashboard" element={<Protected roles={['leadership']} title="Corporate Dashboard"><LeadershipDashboard /></Protected>} />
      <Route path="/manager/dashboard" element={<Protected roles={['mine_manager', 'safety_officer', 'environmental_officer']} title="Mine Dashboard"><ManagerDashboard /></Protected>} />
      <Route path="/inspector/dashboard" element={<Protected roles={['field_inspector']} title="Inspector Dashboard"><InspectorDashboard /></Protected>} />
      <Route path="/contractor/dashboard" element={<Protected roles={['contractor']} title="Contractor Dashboard"><ContractorDashboard /></Protected>} />
      <Route path="/regulator/dashboard" element={<Protected roles={['regulator']} title="Regulatory Dashboard"><RegulatorDashboard /></Protected>} />
      <Route path="/worker/dashboard" element={<Protected roles={['worker']} title="My Dashboard"><WorkerDashboard /></Protected>} />

      {/* Mines */}
      <Route path="/mines" element={<Protected roles={ALL_ROLES} title="Mines"><MineList /></Protected>} />
      <Route path="/mines/:id" element={<Protected roles={ALL_ROLES} title="Mine Details"><MineDetail /></Protected>} />
      <Route path="/gis-map" element={<Protected roles={ALL_ROLES} title="GIS Mine Map"><GISMap /></Protected>} />

      {/* Inspections */}
      <Route path="/inspections" element={<Protected roles={['super_admin', 'leadership', 'mine_manager', 'safety_officer', 'environmental_officer', 'field_inspector', 'regulator']} title="Inspections"><InspectionList /></Protected>} />
      <Route path="/inspections/:id" element={<Protected roles={['super_admin', 'leadership', 'mine_manager', 'safety_officer', 'environmental_officer', 'field_inspector', 'regulator']} title="Inspection Details"><InspectionDetail /></Protected>} />

      {/* Core modules */}
      <Route path="/compliance" element={<Protected roles={ALL_ROLES} title="Compliance"><Compliance /></Protected>} />
      <Route path="/violations" element={<Protected roles={['super_admin', 'leadership', 'mine_manager', 'safety_officer', 'environmental_officer', 'field_inspector', 'regulator']} title="Violations"><Violations /></Protected>} />
      <Route path="/corrective-actions" element={<Protected roles={['super_admin', 'leadership', 'mine_manager', 'safety_officer', 'environmental_officer', 'field_inspector', 'regulator']} title="Corrective Actions"><CorrectiveActions /></Protected>} />
      <Route path="/safety" element={<Protected roles={['super_admin', 'leadership', 'mine_manager']} title="Safety Management"><Safety /></Protected>} />
      <Route path="/safety/incidents" element={<Protected roles={['safety_officer']} title="Safety Incidents"><Safety /></Protected>} />
      <Route path="/safety/observations" element={<Protected roles={['field_inspector']} title="Safety Observations"><SafetyObservations /></Protected>} />
      <Route path="/environment" element={<Protected roles={['super_admin', 'leadership', 'mine_manager', 'environmental_officer']} title="Environmental Monitoring"><Environment /></Protected>} />
      <Route path="/production" element={<Protected roles={['super_admin', 'leadership', 'mine_manager']} title="Production"><Production /></Protected>} />
      <Route path="/workers" element={<Protected roles={['super_admin', 'mine_manager', 'contractor']} title="Workforce"><Workers /></Protected>} />
      <Route path="/attendance" element={<Protected roles={['super_admin', 'mine_manager', 'contractor', 'worker']} title="Attendance"><Attendance /></Protected>} />
      <Route path="/contractors" element={<Protected roles={['super_admin', 'leadership', 'mine_manager']} title="Contractors"><Contractors /></Protected>} />
      <Route path="/contractors/:id" element={<Protected roles={['super_admin', 'leadership', 'mine_manager']} title="Contractor Details"><ContractorDetail /></Protected>} />
      <Route path="/contractor/details" element={<Protected roles={['contractor']} title="Contract Details"><ContractorDetails /></Protected>} />
      <Route path="/grievances" element={<Protected roles={ALL_ROLES} title="Grievances"><Grievances /></Protected>} />
      <Route path="/notifications" element={<Protected roles={ALL_ROLES} title="Notifications"><Notifications /></Protected>} />

      {/* AI, Reports, Profile */}
      <Route path="/ai-analytics" element={<Protected roles={['super_admin', 'leadership', 'regulator']} title="AI Analytics"><AIAnalytics /></Protected>} />
      <Route path="/reports" element={<Protected roles={ALL_ROLES} title="Reports"><Reports /></Protected>} />
      <Route path="/profile" element={<Protected roles={ALL_ROLES} title="Profile"><Profile /></Protected>} />

      {/* Admin */}
      <Route path="/admin/users" element={<Protected roles={['super_admin']} title="Users"><Users /></Protected>} />
      <Route path="/admin/subsidiaries" element={<Protected roles={['super_admin']} title="Subsidiaries"><Subsidiaries /></Protected>} />
      <Route path="/admin/audit-logs" element={<Protected roles={['super_admin', 'leadership', 'regulator']} title="Audit Trail"><AuditLogs /></Protected>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
