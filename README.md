# CoalGov AI

**AI-Based Smart Governance and Compliance Monitoring System for Coal Mines**
Smart India Hackathon Prototype — Problem Statement PS 26024

A centralized platform for statutory compliance, inspections, safety, environmental monitoring, production, labour, contractor management, grievances, AI-based risk analytics, and audit trail across coal mining operations — built with a real Express + SQLite backend and a React + Tailwind frontend.

---

## ⚠️ Before you start — please read

This project was generated in a sandboxed environment **with no internet access**, so `npm install` could not be run or verified end-to-end here. The code has been written carefully and syntax-checked, but you are the first one to actually boot it. If you hit an error on first run, it's most likely a small dependency-version or path issue — see **Troubleshooting** below. Please don't hesitate to paste any error back for a fix.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + React Router + Recharts + Axios |
| Backend | Node.js + Express.js |
| Database | SQLite (via `better-sqlite3`) — designed to be portable to PostgreSQL later |
| Auth | JWT + bcrypt |
| File uploads | Multer |
| Validation | Zod |
| PDF export | pdfkit |

---

## 2. Project Structure

```
coalgov-ai/
├── backend/
│   ├── src/
│   │   ├── server.js            # Express entry point
│   │   ├── db/
│   │   │   ├── db.js            # SQLite schema (25 tables)
│   │   │   └── seed.js          # Realistic demo data generator
│   │   ├── middleware/          # auth (JWT+RBAC), upload, error handler
│   │   ├── routes/               # one file per module (mines, inspections, ...)
│   │   └── utils/                # ai.js (risk engine), audit.js, crudFactory.js
│   ├── uploads/                  # uploaded evidence/documents land here
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Public, Auth, Dashboards, Mines, Inspections, Modules, Admin...
│   │   ├── components/            # Sidebar, Topbar, UI kit, ModulePage (generic CRUD), Charts
│   │   ├── context/                # Auth + Toast
│   │   ├── services/api.js         # Axios instance
│   │   └── config/nav.js            # Role → sidebar navigation
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 3. Setup — Step by Step (Windows / macOS / Linux)

### Prerequisites
- **Node.js 18+** installed (check with `node -v`)
- npm (comes with Node)

### Step 1 — Backend

```bash
cd backend
npm install
copy .env.example .env      # Windows (PowerShell/cmd)
# cp .env.example .env      # macOS/Linux
npm run seed                # creates database/coalgov.db and fills it with demo data
npm run dev                 # starts the API on http://localhost:5000
```

You should see:
```
🚀 CoalGov AI backend running on http://localhost:5000
```

Leave this terminal running.

### Step 2 — Frontend (open a **second** terminal)

```bash
cd frontend
npm install
npm run dev
```

Vite will print a local URL — open **http://localhost:5173** in your browser.
The frontend is pre-configured (`vite.config.js`) to proxy `/api` and `/uploads` to `http://localhost:5000`, so you don't need to change anything.

### Step 3 — Log in

Go to `http://localhost:5173/login` and either type an email below or click one of the **quick demo login** buttons on the page.

---

## 4. Demo Credentials

**Password for every account: `Demo@123`**

| Role | Email |
|---|---|
| Super Admin | admin@coalgov.demo |
| Corporate / Leadership | leadership@coalgov.demo |
| Mine Manager | manager@coalgov.demo |
| Safety Officer | safety@coalgov.demo |
| Environmental Officer | environment@coalgov.demo |
| Field Inspector | inspector@coalgov.demo |
| Contractor | contractor@coalgov.demo |
| Worker | worker@coalgov.demo |
| Regulatory Authority | regulator@coalgov.demo |

---

## 5. Re-seeding the database

If you want a clean slate at any point:
```bash
cd backend
npm run seed
```
This wipes and regenerates all demo data (12 real Indian coalfield mines, 6 subsidiaries, ~9 operational users, 30+ inspections, 40+ compliance items, contractors, workers, attendance, environmental readings, production history, grievances) and recalculates AI risk scores.

---

## 6. SIH Demo Workflow (what to click through)

1. **Login as Leadership** → see the Corporate Dashboard (mine-wise compliance, risk distribution, production trend).
2. Go to **AI Analytics** → click **Run Analysis** → see the top high-risk mine and the transparent "why is this mine high risk?" factor breakdown.
3. Go to **Mines** → open the flagged high-risk mine → view its compliance, inspections and violations.
4. **Logout, login as Field Inspector** → open an assigned inspection → **Add Finding** (with photo evidence) → tick "raise a violation".
5. **Logout, login as Mine Manager or Safety Officer** → go to **Corrective Actions** → create/track the action → **Upload Evidence** → moves to "Submitted for Verification".
6. Verify & close the action (Verify icon → Approve → Close icon).
7. Back in **AI Analytics**, click **Run Analysis** again — the mine's risk score updates live from the new data.
8. Check **Notifications** — a notification was generated automatically when the risk level changed / evidence was submitted / a document expired.
9. Go to **Reports** → export a Compliance or Safety report as **PDF** or **CSV**.
10. **Login as Super Admin** → **Audit Logs** → see every action above recorded with who/what/when.

---

## 7. API Overview

Base URL: `http://localhost:5000/api`

```
POST   /auth/login | /auth/register | /auth/forgot-password
GET    /auth/me                      PUT /auth/profile | /auth/change-password

GET    /dashboard                     (role-specific payload)

GET/POST/PUT/DELETE  /mines           GET /mines/:id/overview
GET/POST/PUT         /inspections     POST /inspections/:id/findings   PUT /inspections/:id/status
GET/POST/PUT/DELETE  /compliance
GET/POST/PUT         /violations
GET/POST             /corrective-actions
POST                 /corrective-actions/:id/evidence
PUT                  /corrective-actions/:id/verify | /:id/close

GET/POST/PUT         /safety/incidents
GET/POST             /safety/observations
GET/POST             /environment      GET /environment/trend/:mineId
GET/POST/PUT/DELETE  /production
GET/POST/PUT/DELETE  /workers
GET/POST/PUT/DELETE  /attendance
GET/POST/PUT         /contractors     GET /contractors/:id   POST /contractors/:id/documents
GET/POST/PUT         /grievances
GET/POST/PUT/DELETE  /contractor-documents

GET    /notifications        PUT /notifications/:id/read | /read-all
GET    /audit-logs

GET    /analytics/risk                GET /analytics/risk?mine_id=1
POST   /analytics/risk/recalculate
GET    /analytics/recurring-violations | /anomalies | /recommendations | /insights

GET    /reports/summary
GET    /reports/:type/export?format=csv|pdf|json

GET/POST/PUT/DELETE  /users            (Super Admin only)
GET/POST             /subsidiaries
```

All endpoints except `/auth/login`, `/auth/register`, `/auth/forgot-password` and `GET /api/health` require `Authorization: Bearer <token>`.

---

## 8. Implemented Features

- JWT authentication, bcrypt password hashing, full RBAC across 9 roles
- Mine CRUD with detail/overview aggregation
- 7-stage inspection workflow (Created → Assigned → In Progress → Findings Recorded → Corrective Action → Verification → Closed) with photo evidence upload
- Compliance items with automatic overdue detection
- Violations linked to inspections and contractors
- Corrective actions with evidence upload → verify → close workflow, auto-overdue flagging
- Safety incidents/accidents + observations (near-miss, hazard, PPE)
- Environmental monitoring with automatic threshold-breach detection and alerts
- Production tracking (target vs actual vs dispatch)
- Worker & attendance management
- Contractor management with a live, formula-based compliance score (documents + safety + attendance) and document-expiry alerts
- Grievance workflow with anonymous submission option
- **Deterministic, transparent AI risk-scoring engine** (0–100, Low/Medium/High/Critical) with a documented weight breakdown, recurring-violation detection, production anomaly detection, and data-grounded recommendations
- Notification center (role-targeted and user-targeted)
- Full audit trail of every create/update/delete across the system
- CSV / PDF / JSON report export
- File upload validation (type + 10MB size limit)
- Global search, filters, sorting, pagination on every list
- Loading / empty / error states and toasts throughout
- Responsive layout (desktop/tablet/mobile)
- Public Home page and Public Transparency portal (no login required)

## 9. Known Limitations (being upfront)

- **Not verified end-to-end by running it** — this was built without network/npm access in the authoring environment; please report the first error you hit so it can be fixed quickly.
- GIS map is a lightweight custom-built projection (mine lat/lng plotted on a styled panel), not a full mapping library (Leaflet/Mapbox) — swap in one of those if you need real basemap tiles/zoom.
- "Departments", "Settings" and "AI Configuration" mentioned in the original UI references are not built as separate pages — Admin covers Users, Mines, Subsidiaries, Contractors and Audit instead.
- Email delivery for "Forgot Password" is a stub (returns a message, does not actually send email) — fine for an offline demo.
- Google OAuth button on the login screen is visual only (not wired to a real OAuth flow).

---

## 10. Troubleshooting

- **`better-sqlite3` fails to install / build error on Windows** → you need the Visual Studio Build Tools (or just run `npm install --global windows-build-tools` as admin), or switch Node to an LTS version (18/20).
- **Port already in use** → change `PORT` in `backend/.env`, and update the proxy target in `frontend/vite.config.js` to match.
- **"Cannot find module ..." on backend start** → you're missing `npm install` in `backend/`, or `npm run seed` was run before `npm install`.
- **Blank dashboard after login** → open the browser console/network tab; if `/api/dashboard` 401s, your token expired — log out and back in.
- **CORS errors** → make sure `CORS_ORIGIN` in `backend/.env` matches the frontend URL (default `http://localhost:5173`), or just rely on the Vite proxy (recommended, already configured) and don't call the backend directly from the browser.
- **File upload fails** → check `backend/uploads/` exists and is writable; it's auto-created on first run.

---

Built for SIH — happy demoing! 🇮🇳
