# Repository Guidelines

## Project Structure & Module Organization

This hospital ERP uses Next.js 16, React 19, Tailwind CSS, and a Frappe backend. Treat `package.json` and current source as authoritative; the README's Vite/Express instructions are outdated.

- `app/`: App Router screens organized by workflow, such as `reception/`, `pharmacy/`, and `billing/`; server endpoints live in `app/api/`.
- `components/`: shared navigation and feature components; `components/ui/` contains reusable shadcn/Radix UI primitives.
- `lib/`: authentication, authorization, hospital services, user storage, and audit helpers. `hooks/` contains shared React hooks.
- `hospital_management/`: Python Frappe functionality, including pharmacy and the RAG/copilot modules. Root `setup_*.py` scripts provision DocTypes and users.
- `public/`: static assets. `.next/`, `dist/`, and `node_modules/` are generated directories; do not edit them.

## Build, Test, and Development Commands

- `npm ci`: install dependencies from the committed lockfile.
- `npm run dev`: start Next.js locally, normally at `http://localhost:3000`.
- `npm run build`: create the production build in `.next/`.
- `npm start`: serve an existing production build.
- `npm run lint`: run Oxlint with `.oxlintrc.json`, including React hook checks.

Run Frappe setup scripts only in the intended bench/site environment after reviewing their database changes.

## Coding Style & Naming Conventions

Match nearby code: generally two-space indentation for JavaScript/TypeScript and four spaces for Python. Preserve each file's quote and semicolon conventions; no formatter is configured. Use PascalCase React component names, camelCase functions and variables, and snake_case Python functions. Follow Next.js `page.js` and `route.js` naming. Prefer `@/` imports for repository-root modules and reuse existing UI primitives. Add `"use client"` where browser APIs or React client hooks require it.

## Testing Guidelines

No automated test runner, test naming convention, or coverage threshold is configured. Run lint and a production build before submitting changes. Manually verify affected workflows, including role access, validation, API failures, and audit recording. Use synthetic patient data and describe verification in the PR.

## Commit & Pull Request Guidelines

Follow the observed Conventional Commit pattern: `feat(pharmacy): add invoice validation` or `fix(audit): correct event filtering`. Keep commits focused. PRs should describe the problem, resulting behavior, verification, related issues when applicable, and configuration or DocType changes. Include screenshots for UI changes.

## Security & Configuration

Keep credentials server-side through environment variables such as `FRAPPE_SITE_URL`, `FRAPPE_API_KEY`, `FRAPPE_API_SECRET`, and `BETTER_AUTH_SECRET`. Never add secrets or patient records to commits, logs, or screenshots. Enforce permissions in server handlers and Frappe, alongside UI access controls.
