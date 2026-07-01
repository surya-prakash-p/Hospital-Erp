# Thangam Hospital - Integrated Hospital ERP Portal

An integrated single-page application (SPA) portal for Thangam Hospital's clinical workflow. It supports reception desks, clinical consultation desks, lab diagnostics, pharmacy dispensation, and patient billing counters. 

## Features
- **Reception Desk**: Patient registry, search history, walk-in slot booking.
- **Doctor Consultation**: Clinical diagnosis notes, prescriptions, and routing rules.
- **Lab Station**: Log diagnostic/lab findings.
- **Pharmacy Counter**: Regimen dispensation and summary review.
- **Billing & Pay**: Invoice generation, itemized receipt breakdown, and counter payment recording.
- **Record Inspector**: Live JSON database viewer for patients and walk-ins.
- **Frappe Database Proxy**: Seamless connection with local Frappe Bench or fallback offline simulator DB.

## Architecture
- **Backend**: Node.js Express server (`server.js`) that serves static client assets and proxies API calls `/api/*` to the local Frappe Bench at `http://localhost:8000`.
- **Frontend**: Clean, semantic HTML5, Vanilla CSS3 (reusing HSL gradients and glassmorphism styling), and Vanilla JS (`public/app.js`).
- **Icons**: Lucide vector icons loaded via CDN.

## Installation & Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm run dev
   ```
   The application will start running on [http://localhost:3000](http://localhost:3000).

## Running in VS Code
A configuration is included in `.vscode/launch.json`. Open the root folder in VS Code, go to the **Run and Debug** sidebar, select **Launch Hospital ERP Server**, and press **F5** to start.
