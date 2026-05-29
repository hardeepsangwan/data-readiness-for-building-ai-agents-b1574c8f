
## Goal

Pivot the app from a maturity-scoring questionnaire into an **executable Data Blueprint framework**, generic across business processes, seeded with the FP&A Service Charge template (`Indurent_DataBlueprint_Workbook_v4.xlsx`). Business users build their own blueprint by entering process steps, mapping data assets, scoring data quality, and answering Data Hive consumption questions. Claude then produces gap analysis vs the hub-and-spoke target TOM and recommends where Data & AI applies at each step.

## What the user will do, end-to-end

1. **Process context** — name, function, process, sponsor, cycle volume, baseline effort, timeline.
2. **AS-IS Process Map (WS2-B)** — repeatable rows: Step Ref, #, Description, Role, System/Tool, Data In, Data Out, Time, Frequency, Pain?, Pain Point, Automation Opportunity, Priority. "Add step" / "Add sub-process" buttons. The Service Charge rows are available as a one-click "Load example".
3. **Data Asset Map (WS3-A)** — auto-seeded from unique `System/Tool` values entered in WS2-B. User fills Domain, Entities, Access Method, Business/Tech Owner, Refresh, PII, **Data Hive Status (None / Bronze / Silver / Gold)**, Bronze/Silver/Gold Fit, Overall RAG, Notes.
4. **Data Quality (WS3-B)** — per asset: Completeness, Accuracy, Consistency, Timeliness, Uniqueness, Validity (1–5 + evidence). Critical-step linkage to the steps that consume the asset.
5. **Data Hive readiness** — generic prompts: ingestion path to Fabric, ownership model (hub vs spoke), semantic / ontology layer, agent retrieval pattern, governance & access, observability.
6. **TO-BE TOM target** — pre-filled with the hub-and-spoke target architecture (editable). Used as the "target state" for the LLM.
7. **Generate Blueprint** — POSTs everything to a `createServerFn` that calls Claude via Lovable AI Gateway.

## What Claude returns (structured output)

For each AS-IS step:
- **Classification** — RETAIN / OPTIMISE / AUTOMATE+HUMAN / AUTOMATE FULL / CONTROL.
- **Data & AI intervention** — what to do at this step (e.g. "Fabric Bronze auto-ingest GL", "Copilot Studio exception agent", "Semantic Gold model for apportionment").
- **Hub vs Spoke ownership** — which moves to the central Data Hub, which stays in the business spoke.
- **Required data assets + DQ uplifts** referencing DA-xx and gap refs.
- **Governance gates** required before automation (HITL, controls).

Aggregate:
- **Gap Register (G-xx)** vs target TOM — Process / Data / Tech / People / Governance dimensions.
- **Use Case backlog** with Business Impact / Desirability / Feasibility (1–5) and solution type.
- **Hub-and-spoke activity list** — concrete activities to stand up federated ways of working.
- **Radar charts** (current vs target) for: Process automation, Data foundations, Data quality, Data Hive readiness, AI/Agent readiness, Governance.

Model: `anthropic/claude-sonnet-4` via Lovable AI Gateway (the user explicitly said "Claude"). Falls back to `google/gemini-3-flash-preview` if Anthropic unavailable.

## Files to change / add

**New**
- `src/lib/blueprint-schema.ts` — types for `ProcessStep`, `DataAsset`, `DataQualityScore`, `DataHiveAnswers`, `TargetTOM`, `BlueprintResult`.
- `src/lib/blueprint-template.ts` — Service Charge seed rows extracted from the workbook (steps, assets, gaps, TOM decisions) for "Load example".
- `src/lib/blueprint.functions.ts` — `generateBlueprint` server fn (Claude call + structured output via AI SDK `Output.object`).
- `src/routes/blueprint.tsx` — replaces/sits alongside `/assessment` with stepper: Context → AS-IS Steps → Data Assets → Data Quality → Data Hive → TO-BE TOM → Generate.
- `src/components/blueprint/steps-editor.tsx`, `assets-editor.tsx`, `dq-editor.tsx`, `hive-editor.tsx`, `tom-editor.tsx`, `blueprint-result.tsx` (renders per-step recommendations, gap register, hub-spoke activities, radar charts).

**Edit**
- `src/lib/assessment-store.ts` — add `blueprint` slice (steps[], assets[], dq[], hive, tom, result) persisted alongside existing state. Keep current maturity flow intact for backwards compatibility (do not break `/assessment`).
- `src/lib/excel-export.ts` — add sheets mirroring the original workbook: WS2-B, WS3-A, WS3-B, WS2-D Gap Register, plus an "AI Blueprint Output" sheet.
- `src/router.tsx` / route tree regen — register `/blueprint`.
- `src/routes/index.tsx` — primary CTA → `/blueprint` (keep `/assessment` link as "Maturity assessment").

**Unchanged**
- Auth, workshops store, admin/report routes (will keep working with the existing maturity data).

## Hub-and-spoke target TOM (default, editable)

Hard-coded default fed to Claude as the "target state":
- **Hub (central Data & AI CoE on Data Hive / Fabric):** Bronze→Silver→Gold pipelines, semantic/ontology layer, agent platform (Copilot Studio + Foundry/Fabric IQ), DQ monitoring, governance & access, MLOps/AgentOps.
- **Spoke (business domain, e.g. FP&A Service Charge):** owns process steps, business rules, KPIs, HITL approvals, exception handling, last-mile reporting.
- **Handshakes:** data contracts, SLAs, exception workflows via Power Automate, shared backlog.

## Technical notes

- Server fn lives in `src/lib/blueprint.functions.ts`, called via `useServerFn` from the Generate button (not from a public-route loader — `requireSupabaseAuth` is not used here; if added later, route must move under `_authenticated/`).
- Structured output via `Output.object` with a Zod schema mirroring `BlueprintResult`.
- Per-step recommendations are rendered inline next to each AS-IS row; aggregate views show gap register, hub/spoke activity board, and 6-axis radar (current vs target).
- Excel export reuses `exceljs` already in the project.
- Current `/assessment` page stays functional; once the new flow is validated we can deprecate it in a follow-up.

## Out of scope (next iterations)

- Multi-user collaboration / locking on a blueprint.
- Sharepoint / Teams export.
- Versioned snapshots of blueprints.
