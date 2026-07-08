# Thangam Hospital - Integrated EMR Portal

A React + shadcn/ui single-page EMR for Thangam Hospital's clinical workflow: reception, doctor consultation, lab diagnostics, pharmacy dispensation, billing, future appointment scheduling, dashboards, and a full audit trail.

## Features
- **Clinical Workflow**: Reception → Doctor Consultation → Lab Test → Pharmacy → Billing → Completed, with a live queue and per-stage routing.
- **Reception**: Patient search (mobile/name), registration with validation, walk-in queueing.
- **Doctor Consultation**: Diagnosis, prescription, lab test ordering (from catalog), pharmacy routing; patient history shown inline.
- **Lab Station**: Result entry against the ordered test.
- **Pharmacy**: Regimen review and dispensation.
- **Billing**: Itemized invoice (doctor fee + lab fee + pharmacy), Cash/Card/UPI payment recording, visit summary appended to medical history.
- **Appointments**: Future slot booking with calendar, check-in converts to a walk-in, cancellation.
- **Dashboard**: Patient/queue/revenue KPIs, queue-by-stage and revenue-by-doctor charts.
- **Audit Log** (Admin only): every clinical/billing mutation with role, action, and details.
- **Role-Based Access**: Admin, Receptionist, Doctor, Lab Technician, Pharmacist, Billing Staff — each role edits only its stage (client-side gating; enforce server-side via Frappe roles for production).
- **Dual database mode**: live Frappe Bench via `/api` proxy, or offline in-memory simulator.

## Architecture
- **Frontend**: React 18 + TypeScript + Vite, Tailwind CSS v4, default shadcn/ui components only, Lucide icons.
- **Backend**: Frappe Bench (`http://localhost:8000`) storing all DocTypes; `setup_doctypes.py` creates them (Hospital Patient, Hospital Doctor, Hospital Patient Walk In, Hospital Lab Test, Hospital Appointment, Hospital Audit Log) plus sample data.
- **Server**: `server.js` (Express) serves the built app from `dist/` and proxies `/api/*` to Frappe. In dev, Vite proxies `/api` directly.

## Running Locally

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
```

Production:

```bash
npm run build      # outputs dist/
npm start          # Express on http://localhost:3000 serving dist/ + /api proxy
```

Frappe setup (run inside your bench environment):

```bash
bench --site site1.local execute setup_doctypes  # or: python setup_doctypes.py
```

Then click **Connect Frappe** in the app header and sign in. Without Frappe, the app runs on the offline simulator database.
