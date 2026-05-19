
# Data Blueprint Assessment — Restructure Plan

Based on `Data_blueprint_version_1.0_pdf.pdf` and `Indurent_DataBlueprint_ProcessFlow_v2.docx`, with questions framed against `azure-cloud-adoption-framework-ai-agents-2.pdf`.

## 1. New workstream model

Replace the current single 6-dimension assessment with **4 sequential workstreams**, each with 6 steps and a key handshake output that feeds the next workstream:

1. **Foundations CoE / Tech Governance** — Mandate & Scope · AI Ethics & Risk · Data Governance Standards · Agent Guardrail Framework · Security & Compliance · Tech Guardrail Playbook v1.0 ★
2. **Business Transformation** — Define Business Outcome · Apply CAF Agent Decision Tree · Qualify Agent Type · Score & Prioritise (CAF 1–5) · Define KPIs & Business Value · Signed-off Use Case Backlog ★
3. **Foundations Data (Data Blueprint)** — Map Data Assets · Assess Data Quality (Bronze/Silver/Gold/Ontology) · Lineage & Provenance · Identify Gaps & Risks · Remediation Plan · Data Readiness Scorecard (RAG) ★
4. **Agents Factory** — Charter & Instructions · Model Selection · Knowledge/Tools/Memory · Build & Unit Test · Guardrail Validation & Red Team · Deploy, Monitor & Operate ★

Each step uses the existing 6-level maturity scale (No Capability → Developing → Established → Transformational). Questions for each step are authored from the matching Azure CAF section (Responsible AI, Governance & Security, Business Plan, Technology Plan, Data Architecture, Build/Operate).

## 2. Handshakes and gates between workstreams

After each workstream the user sees a **Handshake screen** that:
- Shows the ★ key output(s) produced (e.g. `Tech Guardrail Playbook v1.0`, `Signed-off Use Case Backlog`, `Data Readiness Scorecard`).
- Lists the **GATE** criteria from the blueprint (e.g. "No use case enters Data Readiness without business sponsor sign-off, guardrail validation, KPIs defined").
- Requires the user to confirm gate sign-off before the next workstream unlocks.
- Carries scored outputs forward — e.g. BT prioritisation feeds Data Readiness mapping; Data RAG scorecard feeds Agents Factory prerequisites.

## 3. Progress bar

Replace the existing 6-dimension stepper with a **workstream stepper** showing the 4 workstreams plus a sub-progress bar for the current step within the active workstream. The header always shows the active workstream name (e.g. "Business Transformation · Step 3 of 6").

## 4. Per-stage Excel downloads

At the end of every workstream (and on the final report) add a "Download Excel" button:
- **CoE workbook** — AI Ethics Policy, Guardrail Framework, Data Standards Register, Security Checklist, Tech Playbook summary (one sheet each).
- **BT workbook** — Business Outcome, Decision Log, Prioritisation Matrix (scored), Business Case, KPI Sheet, Signed-off Backlog.
- **Data Blueprint workbook** — Asset Map, DQ Scorecard, Lineage Map, Gap Register (Blocker/Conditional/Watch), Remediation Plan, Readiness Scorecard.
- **Agents Factory workbook** — Charter, Model Selection, Knowledge/Tools/Memory, Test Results, Guardrail/Red Team Report, Deployment record.
- **Master Data Blueprint workbook** — consolidates all of the above with an Overview tab and a Gap Analysis tab (current vs target per dimension, priority, owner, timeline) and Use Case Prioritisation tab (CAF Business Impact / Desirability / Feasibility, agent type, platform recommendation).

## 5. Business function scoping

The business function / process captured on the intro screen (e.g. FP&A · Service Charge) is applied as a header to every workstream report and every Excel workbook, so the same blueprint can be re-run per function/process.

## 6. Final consolidated output (Report page)

Restructured to mirror the blueprint deliverables:
1. Executive summary (function, process, sponsor, date)
2. Workstream-by-workstream current vs target radar + horizontal stack chart
3. Gap Analysis table (per step: current, target, gap, priority, remediation, owner, timeline)
4. Use Case Prioritisation table (CAF scoring, agent type, platform)
5. FP&A Pilot Blueprint section (data sources, Bronze→Silver→Gold→Semantic→Ontology, retrieval strategy, agent design, risks, KPIs) — pre-filled from earlier answers
6. Handshake/Gate audit trail showing sign-offs
7. Download buttons: per-workstream Excel + Master Excel

## Technical implementation

- `src/lib/assessment-data.ts` — replace the current 6 dimensions with a `WORKSTREAMS` array of 4 workstreams × 6 steps; each step has CAF-derived questions, key output label, gate criteria, and handshake outputs.
- `src/lib/assessment-store.ts` — extend state with `workstreamIndex`, `stepIndex`, per-workstream `gateSignoff` flags, and a `useCaseBacklog` array (carried from BT into FD and AF).
- `src/routes/assessment.tsx` — rewrite stepper to render workstream + step; insert a `HandshakeStep` component between workstreams; one-question-at-a-time UX (Prev/Next) is retained.
- `src/components/workstream-stepper.tsx` (new) — replaces `horizontal-stepper.tsx` usage on assessment route.
- `src/components/handshake-card.tsx` (new) — displays ★ outputs, gate checklist, sign-off button.
- `src/lib/excel-export.ts` — split into `buildCoEWorkbook`, `buildBTWorkbook`, `buildFDWorkbook`, `buildAFWorkbook`, `buildMasterWorkbook` (all using `exceljs`, already installed and patched for the xlsx CVE).
- `src/routes/report.tsx` — add Gap Analysis table, Use Case Prioritisation table, FP&A Pilot Blueprint section, and 5 download buttons.
- Admin/facilitator route already lists submissions — no schema change needed; each submission now stores the workstream-shaped state.

## Out of scope (will keep current behaviour)

- Auth, facilitator audit dashboard, login flow, Azure deploy config — unchanged.
- Radar + horizontal stack charts — reused, now plotted across the 4-workstream / 24-step structure.
- One-question-per-screen Prev/Next pattern from the previous turn — retained.
