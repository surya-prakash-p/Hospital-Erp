# Small-clinic application audit

Date: 4 September 2026

## Scope and limits

This is a source-based product, workflow, accessibility, and reliability audit of the current working tree, supported by the screenshots supplied in this conversation. It covers the shared navigation/header, dashboard, reception, patient registry, consultation, pharmacy, billing, finance, supporting modules, data services, and authentication boundaries. It incorporates the recent compact cards, removed titles, Quick Actions menu, hidden walk-in flow, and transaction modal.

This is not a completed authenticated browser acceptance test, penetration test, or clinical/regulatory certification. The earlier browser preview reached the login screen. No patient records were created, payments processed, or access controls exercised. The latest implementation builds passed, with lint warnings; this does not establish workflow correctness. No application behavior was changed during this audit.

Confirmed scope: consultations and an in-house pharmacy. Daily users: a nurse and receptionist. Doctor count and patient volume were not supplied. Who records/approves consultation notes, issues prescriptions, dispenses medicines, and collects payment still needs operational confirmation. Recommendations are proposals, not approved implementation changes.

## Overall finding

The interface has become visually simpler, but its structure still reflects a hospital with separate departments. Staff must understand several modules to complete one patient visit. The highest-value improvement is to organize the product around the visit, with optional services appearing only when needed.

The product also has trust issues that should be corrected before relying on it for live clinic operations: unauthenticated server entry points, cookie-based authorization fallbacks, mixed demo/local/server data, and premature save confirmations.

## Priority findings

| Priority | Finding and source evidence | Effect on clinic staff | Recommended change |
|---|---|---|---|
| Before pilot | `app/api/finance/transactions/route.js` has no authentication check on GET/POST/DELETE. `app/api/[...path]/route.js` forwards requests with configured backend credentials without a session check. Middleware skips API routes. | UI role restrictions do not establish protection of records. | Authenticate every server entry point, enforce resource/action permissions, restrict the proxy to intended operations, and verify with unauthenticated and role-based tests. |
| Before pilot | `lib/auth-guard.js` accepts JSON from cookies as a fallback user identity and reads authorization roles from it. The custom login handler writes JSON profiles to session cookies. | Account identity and permission decisions lack a consistent verified session boundary. | Use verified server sessions and load roles/active status from trusted server records; remove unsigned identity fallbacks and fuzzy permission matching. |
| Before pilot | The proxy logs request headers after adding backend authorization, request bodies, and response bodies. | Credentials and patient information can enter operational logs. | Remove payload/header logging; retain redacted request IDs, method, safe endpoint labels, status, and timings. Investigate log access and rotate credentials if exposure is confirmed. |
| Before pilot | `lib/hospital-service.js` switches/falls back to browser storage; several supporting pages use seeded state. `lib/server-finance-store.js` can start with seed transactions. | A screen can look usable while data is local, temporary, or illustrative. | Separate demo and production modes explicitly. Never silently substitute demonstration data for operational records. Show unavailable data as unavailable, not zero. |
| High | Dashboard weekly flow generates pseudo historical counts when no data is found, but displays a Live Sync badge (`app/page.js`). | Staff cannot reliably distinguish actual activity from generated values. | Remove generated values from operational charts. Show an empty state or actual history with an explicit reporting period. |
| High | Finance clears its form, closes the modal, and announces success before awaiting the save; failures only warn in the console (`app/finance/page.js`). | A user believes an expense is saved when persistence may have failed. | Await a confirmed save, prevent duplicate submission, keep the draft on failure, show inline recovery, and close only after success. |
| High | Consultation clears the active patient and form before save completion; failure restores the queue but not all form input (`app/consultation/page.js`). | Interrupted saves can lose the clinician's working context. | Retain the selected patient and draft until confirmation; provide a clear retry state. |
| High | Reception and Patient Registry overlap, but check-in is now disabled through `lib/feature-flags.js`; appointments is absent from the main sidebar. | Registering a patient is not the same as starting a visit, and the normal entry point is currently hidden. | Keep the requested pause. Before pilot, agree on one replacement Add Visit entry point and test how a new and returning patient reach the doctor. Do not silently restore walk-in. |
| High | Sidebar, middleware, server guard, and Quick Actions use different permission rules; Quick Actions is not role-filtered. | Staff may see unusable links or miss screens they are allowed to use. | Use one explicit permission model for links and server actions; hide irrelevant shortcuts and provide role-appropriate landing pages. |
| High | Patient creation and local lookup use mobile number as a key (`lib/hospital-service.js`). | Family members sharing a phone can be confused or an existing record returned for a new person. | Give every patient an immutable patient ID; phone is searchable contact information, not identity. Show name, age/date of birth, and another identifier when selecting a patient. |
| Medium | The default sidebar exposes ten module links to administrators. Pharmacy has five major tabs and a large medicine-entry form. | Staff must decide where to go before they can act. | Use a small role-specific menu and hide setup/advanced tasks behind secondary menus. |
| Medium | Many labels and controls use 9–11px text; fixed table heights create nested scrolling; the sidebar remains a fixed-width panel. | Dense screens can be difficult on smaller laptops, tablets, zoomed browsers, and for staff with reduced vision. | Keep compact spacing but improve readable text, focus indicators, responsive tables, touch targets, and mobile navigation. |
| Medium | Large titles and breadcrumbs were removed. Most pages now have limited page-level orientation, especially with a collapsed sidebar. | Users can lose track of where they are. | Add a small current-page label in the header, not another large banner. Give each page a semantic heading, visually hidden if appropriate. |

## Recommended clinic structure

For the confirmed scope, use three primary destinations:

1. **Today** — scheduled/current visits, waiting time, current stage, next action, and Add Visit when approved. This replaces the separate overview and reception landing pages.
2. **Patients** — one searchable patient list and one longitudinal patient workspace.
3. **Pharmacy** — prescriptions waiting to be dispensed, medicine search, and stock as a secondary tab.

Place payment in the active visit, with a secondary Daily Collections view for reconciliation. Put expenses/reports and staff/settings in a secondary menu with explicit access permissions. These should not compete with the three daily destinations.

Create explicit **Receptionist** and **Nurse** presets. Reception can handle patient details, approved visit scheduling, and collection if assigned. The nurse can record permitted observations/vitals and assist with the visit. Confirm who is authorized to enter/approve consultation findings, prescribe, and dispense; do not infer those permissions from a job title or give either account administrator access as a workaround. Current consultation middleware permits Doctor/Admin/System Manager, while the sidebar also lacks a Nurse-specific workflow. This is a concrete mismatch with the intended operators.

Lab, inpatient care, beds, rooms, OT, ambulance, blood bank, insurance, and radiology should be disabled in this clinic configuration. If external tests are ordered, record them as visit notes/orders without introducing an internal lab department. Preserve underlying code until the scope is settled, but remove unrelated stats, shortcuts, and route access from this clinic's operating experience.

The proposed visit path is: find patient → add/select visit → consultation record → prescribed medicines if any → payment → complete. It must also support unpaid completed visits, cancelled visits, partial dispensing, and delayed lab results without forcing an artificial linear route.

## Screen-by-screen changes

| Area | Recommended default | Details to move out of the primary view |
|---|---|---|
| Dashboard / Today | Four actionable counts: waiting, consultation in progress, medicines pending, completed; a patient queue immediately below. Define every count and date range. | Weekly charts and owner-level analysis belong in Reports. Do not reintroduce the revenue cards removed from the clinical dashboard. |
| Reception and Registry | One patient search; new-patient registration requires only the agreed essential fields. Patient selection then offers the approved visit action. | Emergency contact, detailed history, and other optional details can be completed later. Keep allergies prominent when known. |
| Patient workspace | Persistent patient identity, active visit, history, consultation, medicines/tests, and balance. Return to the same list position after closing a record. | Avoid repeatedly searching the same patient in each department screen. |
| Consultation | Doctor's queue first; selected patient beside the editor; symptoms, diagnosis, prescription, optional tests, and clear save state. | Advanced templates and history filters are secondary. Do not use a small modal for the full consultation. |
| Pharmacy | Waiting prescriptions first, then medicine search and quantity/dispense controls; retain compact stats. | Inventory dashboard, suppliers, purchase orders, and detailed registers become Stock/More views. Keep applicable dispensing safeguards available. |
| Medicine entry | Separate medicine catalog creation from receiving a batch. Reveal pack and pricing fields when their context requires them. | Do not force every supplier, catalog, batch, invoice, and replenishment decision into one initial form. |
| Billing | One patient balance with already-paid amounts, payment method, amount received, remaining balance, and receipt. | Keep owner expense accounting out of reception's daily checkout view. Verify that pharmacy/consultation collections are not counted twice. |
| Finance | Current compact stats and Add Transaction modal are appropriate. Add a reporting period and reliable save/retry behavior. | Clarify Gross Revenue versus collected cash and Net Operating Profit versus other accounting measures; confirm definitions with the clinic owner. |
| Lab | Pending tests, selected patient, result entry/upload, and completion. | Advanced dashboards and infrequently used filters become secondary. |
| Doctors / Staff | Owner settings with sensible role presets and clinic service prices. | Remove routine staff-profile administration from doctors' daily navigation. |
| AI | Optional assistance inside the current patient or task; user reviews any proposed action. | Standalone AI dashboards should not compete with the daily queue. |
| Rooms, beds, IPD, OT, blood bank, ambulance, insurance, radiology | Enable only if the clinic actually provides the service and the workflow is production-ready. | Several are outside the current main menu already; use explicit module configuration instead of merely hiding links. |
| General Inventory | Keep separate only if the clinic needs non-medicine stock management. | Its current local seeded state is not evidence of durable inventory tracking. Merge navigation under Stock if that matches staff responsibility. |

## Interaction rules

- Use one primary action for the current task. Quick Actions is supplemental, not the only way to perform a frequent task.
- Use the same terms everywhere: Patients, Visits, Prescriptions, Stock, Payments. Replace “Book in,” “Fulfill Queue,” “Flow,” and “Registry” where plain terms are clearer.
- Preserve recent compact stat styling, but allow long currency values to stay legible. Important negative balances/statuses need clear text meaning rather than decorative color alone.
- Refresh data silently without blanking an empty dashboard every ten seconds. Preserve focus, text input, filters, scroll position, and selected patient.
- Use modals for short tasks such as adding an expense; use a full workspace or drawer for long clinical work. Retain drafts when a modal is dismissed and show explicit saving/error states.
- Keep a small page label and patient identity visible. Removing redundant large headings should not remove orientation or semantic structure.
- Use shared accessible toasts, form errors, menus, and dialogs. Announce saves and errors to assistive technology without unexpectedly moving focus.
- Default dates to the clinic's timezone. Review uses of UTC date slicing for “today,” particularly before 05:30 India time.

These principles align with W3C guidance on [consistent navigation](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html), [status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html), and [minimum target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Touch targets need to meet applicable sizing/spacing requirements; compact does not mean tiny.

## Delivery sequence

**1. Establish trust before pilot.** Fix API/session boundaries and sensitive logging. Make production/demo behavior explicit. Remove invented operational data. Confirm durable saves and failure recovery. Test shared-phone patient identities and billing reconciliation.

**2. Simplify the daily path.** Configure consultations and pharmacy only; create nurse/receptionist task presets; merge Reception/Registry navigation, agree on the currently paused visit-entry replacement, add role-specific Today screens, and make patient context persistent across handoffs.

**3. Standardize interactions.** Apply consistent terminology, short-task modals, role-filtered actions, readable typography, responsive navigation, accessible status messages, and draft retention.

**4. Validate with actual staff.** Use a synthetic-data pilot before adding more dashboards or AI features. Measure the baseline before estimating improvement.

## Acceptance tasks and proposed targets

These are proposed targets, not measured results:

- A returning patient can be found and a visit started in under 30 seconds once that flow is approved.
- A new patient with required details available can be registered in under one minute.
- A staff member completes one consultation-to-payment journey without re-searching the patient in another module.
- A pharmacy user dispenses an existing prescription without entering the stock-management workflow.
- Failed consultation or transaction saves retain the draft and provide a visible retry; repeated clicks do not create duplicates.
- A saved record appears on a second authorized device and survives refresh/restart.
- Empty data, failed load, demo mode, and saved production data are visually distinguishable.
- Keyboard-only operation covers search, patient selection, modal opening/closing, fields, dropdowns, and submission, with visible focus.
- At 200% zoom and on a clinic-sized tablet, navigation, forms, totals, and primary actions remain usable.
- Reception, doctor, pharmacy, and owner accounts see only permitted actions; direct API requests enforce the same rules.
- Family members sharing a phone remain distinct records.
- Partial payments, failed payments, refunds/corrections, and cross-department charges reconcile against one visit without duplication.

## Remaining questions

Services and daily operators are confirmed. Still confirm doctor/staff count, patient volume, appointment versus same-day visit model, devices, shared workstations, network reliability, who records/approves clinical content, who dispenses, and who collects each payment. Then observe the nurse and receptionist completing these tasks, and obtain the clinician/owner’s review of the clinical and payment boundaries. Those findings should determine the final navigation and field requirements.
