## Goal

Pivot the Data Blueprint app from a fixed maturity-level picker into a **generic, process-agnostic assessment** whose questions come directly from the uploaded templates, and whose results (pain points, next-best actions, current-vs-target radar) are produced by a reasoning LLM from the user's free-text and structured answers. Service Charge in FP&A is the first instance; the framework must work for any process in any function.

## Scope of change

### 1. Process Context (new step)
Add a "Context" step at the top of the assessment capturing:
- Business Function (default: FP&A — editable)
- Business Process (default: Service Charge — editable)
- Executive sponsor, in-scope systems, success definition, timeline
This context is persisted and injected into every AI prompt so the reasoning model tailors findings to the chosen process.

### 2. Questions sourced from the templates
Replace the current 72 maturity-level questions with the actual structured discovery questions extracted from the uploaded workbooks, organised by the 4 workstreams and their sub-sections (e.g. WS1 → Programme Scope, AI Ethics, Guardrails, Compliance; WS2 → Business Problems, AS-IS, TO-BE, Gap & Use Case; WS3 → Data Assets, DQ, Lineage, Readiness; WS4 → Charter, Model, Build/Test, Deploy).
Each question supports a free-text answer plus an optional current-state / target-state self-rating (1–5) used to seed the radar before the AI refines it.

### 3. AI reasoning backend
- New `createServerFn` `analyzeWorkstream` that takes `{ context, workstream, answers }` and calls the Lovable AI Gateway with a strong reasoning model (`openai/gpt-5.5` with `reasoning.effort: "high"`) using tool-calling for structured JSON output.
- Schema returned per workstream:
  - `dimensions[]` → { name, currentScore (0-5), targetScore (0-5), rationale }
  - `painPoints[]` → { title, severity, evidence (quotes user answers), affectedDimensions }
  - `nextBestActions[]` → { title, addresses (painPoint refs), CAF pillar, owner, effort, prescriptiveSteps[] }
  - `summary` (3–5 lines)
- A second serverFn `analyzeProgramme` produces the cross-workstream executive view.
- Uses `LOVABLE_API_KEY` (auto-provisioned via Lovable Cloud).

### 4. Results UI rewrite
- Per-workstream tab shows:
  - **Radar chart** (current vs target) built from AI `dimensions` (full names, no truncation).
  - **Pain Points** card grouped by severity with evidence chips.
  - **Next Best Actions** list, each tagged to the pain point it addresses + CAF pillar.
- Programme view: cross-workstream radar, top pain points, gate-readiness summary.
- "Run analysis" button per workstream + "Analyse full programme" at top.
- Loading + error states (handle 429 / 402 from gateway).

### 5. Generic-by-design
- Strip all hardcoded FP&A / Service Charge phrasing from question text — instead use `{process}` / `{function}` placeholders rendered at runtime from Context.
- The Service Charge example becomes a *preset* (one-click "Load Service Charge example") rather than baked into questions.

### 6. Cleanup
- Keep `assessment-data.ts` for the question catalogue only; remove the static `CAF_GUIDANCE` map (AI now produces guidance dynamically).
- Replace `workstream-action-plan.tsx` with `ai-findings.tsx` (pain points + actions).
- Rewrite `workstream-radar.tsx` to consume AI `dimensions`.
- Update `excel-export.ts` to export answers + AI findings.

## Technical notes

- Enable Lovable Cloud (if not already) so `LOVABLE_API_KEY` is provisioned.
- Server function lives at `src/lib/analysis.functions.ts`; helper schema at `src/lib/analysis.schema.ts`.
- Cache AI results in `assessment-store.ts` keyed by `workstreamId + answersHash` so repeat renders don't re-bill.
- Model default `openai/gpt-5.5`, fallback `google/gemini-3-pro-preview` (configurable).
- Radar uses Recharts as today; full angle-tick labels (already wrapped).

## Files to add / change

Add:
- `src/routes/assessment.context.tsx` (or inline Context step in existing assessment route)
- `src/lib/analysis.functions.ts`
- `src/lib/analysis.schema.ts`
- `src/components/ai-findings.tsx`
- `src/components/programme-summary.tsx`

Change:
- `src/lib/assessment-data.ts` — replace question catalogue with template-driven questions; remove CAF_GUIDANCE.
- `src/lib/assessment-store.ts` — add context + aiResults state.
- `src/components/workstream-radar.tsx` — consume AI dimensions.
- `src/routes/assessment.tsx` — Context step, free-text answers, "Run AI analysis" CTA, render `<AiFindings>`.
- `src/lib/excel-export.ts` — include AI findings.
- Remove `src/components/workstream-action-plan.tsx` (superseded).

## Out of scope (this iteration)

- Persisting assessments to a database (currently lives in localStorage via assessment-store).
- Multi-user collaboration.
- Streaming the AI response (results delivered as a single structured payload).
