import {
  LayoutDashboard, Mountain, Factory, Users, ShieldCheck, ClipboardList, HardHat, Leaf,
  HandCoins, MessageSquareWarning, FileBarChart, Bell, UserCircle, Map, AlertTriangle,
  Wrench, BadgeCheck, Building2, Settings, Brain, History, CalendarCheck, ListChecks, FileWarning
} from 'lucide-react';

export const NAV_BY_ROLE = {
  super_admin: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
    { label: 'Users', icon: Users, to: '/admin/users' },
    { label: 'Mines', icon: Mountain, to: '/mines' },
    { label: 'Subsidiaries', icon: Building2, to: '/admin/subsidiaries' },
    { label: 'Contractors', icon: HandCoins, to: '/contractors' },
    { label: 'AI Analytics', icon: Brain, to: '/ai-analytics' },
    { label: 'Reports', icon: FileBarChart, to: '/reports' },
    { label: 'Notifications', icon: Bell, to: '/notifications' },
    { label: 'Audit Logs', icon: History, to: '/admin/audit-logs' },
    { label: 'Profile', icon: UserCircle, to: '/profile' }
  ],
  leadership: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/leadership/dashboard' },
    { label: 'Mines Overview', icon: Mountain, to: '/mines' },
    { label: 'Production', icon: Factory, to: '/production' },
    { label: 'Safety', icon: HardHat, to: '/safety' },
    { label: 'Environment', icon: Leaf, to: '/environment' },
    { label: 'Compliance', icon: ShieldCheck, to: '/compliance' },
    { label: 'Contractors', icon: HandCoins, to: '/contractors' },
    { label: 'Reports', icon: FileBarChart, to: '/reports' },
    { label: 'AI Analytics', icon: Brain, to: '/ai-analytics' },
    { label: 'Notifications', icon: Bell, to: '/notifications' },
    { label: 'Profile', icon: UserCircle, to: '/profile' }
  ],
  mine_manager: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/manager/dashboard' },
    { label: 'Mines', icon: Mountain, to: '/mines' },
    { label: 'Production', icon: Factory, to: '/production' },
    { label: 'Workforce', icon: Users, to: '/workers' },
    { label: 'Compliance', icon: ShieldCheck, to: '/compliance' },
    { label: 'Inspections', icon: ClipboardList, to: '/inspections' },
    { label: 'Safety', icon: HardHat, to: '/safety' },
    { label: 'Environment', icon: Leaf, to: '/environment' },
    { label: 'Contractors', icon: HandCoins, to: '/contractors' },
    { label: 'Grievances', icon: MessageSquareWarning, to: '/grievances' },
    { label: 'Reports', icon: FileBarChart, to: '/reports' },
    { label: 'Notifications', icon: Bell, to: '/notifications' },
    { label: 'Profile', icon: UserCircle, to: '/profile' }
  ],
  safety_officer: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/manager/dashboard' },
    { label: 'Safety Incidents', icon: AlertTriangle, to: '/safety/incidents' },
    { label: 'Observations', icon: HardHat, to: '/safety/observations' },
    { label: 'Inspections', icon: ClipboardList, to: '/inspections' },
    { label: 'Corrective Actions', icon: Wrench, to: '/corrective-actions' },
    { label: 'Reports', icon: FileBarChart, to: '/reports' },
    { label: 'Notifications', icon: Bell, to: '/notifications' },
    { label: 'Profile', icon: UserCircle, to: '/profile' }
  ],
  environmental_officer: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/manager/dashboard' },
    { label: 'Environment', icon: Leaf, to: '/environment' },
    { label: 'Compliance', icon: ShieldCheck, to: '/compliance' },
    { label: 'Inspections', icon: ClipboardList, to: '/inspections' },
    { label: 'Corrective Actions', icon: Wrench, to: '/corrective-actions' },
    { label: 'Reports', icon: FileBarChart, to: '/reports' },
    { label: 'Notifications', icon: Bell, to: '/notifications' },
    { label: 'Profile', icon: UserCircle, to: '/profile' }
  ],
  field_inspector: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/inspector/dashboard' },
    { label: 'Inspection Tasks', icon: ClipboardList, to: '/inspections' },
    { label: 'Violations', icon: FileWarning, to: '/violations' },
    { label: 'Corrective Actions', icon: Wrench, to: '/corrective-actions' },
    { label: 'Safety Observations', icon: HardHat, to: '/safety/observations' },
    { label: 'Map View', icon: Map, to: '/gis-map' },
    { label: 'Reports', icon: FileBarChart, to: '/reports' },
    { label: 'Profile', icon: UserCircle, to: '/profile' }
  ],
  contractor: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/contractor/dashboard' },
    { label: 'Contract Details', icon: BadgeCheck, to: '/contractor/details' },
    { label: 'Workers', icon: Users, to: '/workers' },
    { label: 'Compliance', icon: ShieldCheck, to: '/compliance' },
    { label: 'Attendance', icon: CalendarCheck, to: '/attendance' },
    { label: 'Grievances', icon: MessageSquareWarning, to: '/grievances' },
    { label: 'Reports', icon: FileBarChart, to: '/reports' },
    { label: 'Profile', icon: UserCircle, to: '/profile' }
  ],
  worker: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/worker/dashboard' },
    { label: 'Attendance', icon: CalendarCheck, to: '/attendance' },
    { label: 'Grievances', icon: MessageSquareWarning, to: '/grievances' },
    { label: 'Profile', icon: UserCircle, to: '/profile' }
  ],
  regulator: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/regulator/dashboard' },
    { label: 'Mine Compliance', icon: ShieldCheck, to: '/compliance' },
    { label: 'Inspections', icon: ClipboardList, to: '/inspections' },
    { label: 'Violations', icon: FileWarning, to: '/violations' },
    { label: 'Corrective Actions', icon: Wrench, to: '/corrective-actions' },
    { label: 'Reports', icon: FileBarChart, to: '/reports' },
    { label: 'Audit Trail', icon: History, to: '/admin/audit-logs' },
    { label: 'Profile', icon: UserCircle, to: '/profile' }
  ]
};

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  leadership: 'Corporate Management',
  mine_manager: 'Mine Official',
  safety_officer: 'Safety Officer',
  environmental_officer: 'Environmental Officer',
  field_inspector: 'Field Inspector',
  contractor: 'Contractor',
  worker: 'Worker',
  regulator: 'Regulatory Authority'
};

export const DASHBOARD_PATH_BY_ROLE = {
  super_admin: '/admin/dashboard',
  leadership: '/leadership/dashboard',
  mine_manager: '/manager/dashboard',
  safety_officer: '/manager/dashboard',
  environmental_officer: '/manager/dashboard',
  field_inspector: '/inspector/dashboard',
  contractor: '/contractor/dashboard',
  worker: '/worker/dashboard',
  regulator: '/regulator/dashboard'
};
