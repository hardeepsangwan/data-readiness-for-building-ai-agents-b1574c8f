// Open-text discovery questions per workstream sub-category (step).
// Sourced from the Data Blueprint Assessment Templates workbook.
// Phrased generically — placeholders {function} / {process} are rendered
// at runtime from the Process Context the user fills in.

export interface OpenQuestion {
  id: string;       // unique within the assessment, e.g. "coe-1-open-1"
  prompt: string;   // shown to the user (may contain {function}/{process})
  placeholder?: string;
}

export type OpenQuestionMap = Record<string, OpenQuestion[]>;

// Keys are existing step IDs from assessment-data.ts.
export const OPEN_QUESTIONS_BY_STEP: OpenQuestionMap = {
  // ── Foundations CoE ────────────────────────────────────────────────
  "coe-1": [
    { id: "coe-1-open-1", prompt: "Which business functions and specific processes are in scope for Phase 1? What is explicitly out of scope?", placeholder: "e.g. {function} — starting with {process}; out of scope: HR, full R2R…" },
    { id: "coe-1-open-2", prompt: "Who is the executive sponsor and decision authority at each gate? What is the target completion date for the Data Blueprint + pilots?" },
    { id: "coe-1-open-3", prompt: "How will success be defined at the end of the programme? Give a specific, measurable outcome for {process}.", placeholder: "e.g. {process} cycle reduced from 3 days to <4 hours; 0 manual GL corrections" },
  ],
  "coe-2": [
    { id: "coe-2-open-1", prompt: "Which business decisions in {process} will AI / automation assist with, and could any disadvantage tenants, customers or employees?" },
    { id: "coe-2-open-2", prompt: "What FP&A / {function} data contains personal or commercially sensitive data? How is it currently protected and is a DPIA in place?" },
    { id: "coe-2-open-3", prompt: "Who is accountable if an agent produces an incorrect output in {process}? Name the role and the audit trail required." },
  ],
  "coe-3": [
    { id: "coe-3-open-1", prompt: "What RBAC / PII tagging / data residency / retention / DLP controls already exist that AI agents must comply with?" },
    { id: "coe-3-open-2", prompt: "How is sensitive data classified today (Purview labels, sensitivity tiers) and what is the gap to certified Gold-layer use by agents?" },
  ],
  "coe-4": [
    { id: "coe-4-open-1", prompt: "Define at least 3 kill-switch trigger conditions for agents operating in {process} (error rate, value anomaly, data freshness, etc.)." },
    { id: "coe-4-open-2", prompt: "Which steps in {process} MUST have a human-in-the-loop review regardless of agent confidence? Why?" },
    { id: "coe-4-open-3", prompt: "List 5 things an agent must NOT be allowed to do in the {function} context." },
  ],
  "coe-5": [
    { id: "coe-5-open-1", prompt: "What regulatory / audit requirements apply to {process} (e.g. EU AI Act, GDPR, sector codes)? Which planned use cases could be classed as 'high risk'?" },
    { id: "coe-5-open-2", prompt: "Current state of pen-testing, encryption, audit logging and Defender for Cloud AI coverage for the platform that will host the agents?" },
  ],
  "coe-6": [
    { id: "coe-6-open-1", prompt: "Which MCP servers, A2A protocols, OAuth / Entra Agent ID patterns and approved connectors are standard today? What's missing?" },
    { id: "coe-6-open-2", prompt: "Where will the Tech Guardrail Playbook v1.0 be published, and how will it be socialised to BT, FD and AF teams BEFORE any build?" },
  ],

  // ── Business Transformation ────────────────────────────────────────
  "bt-1": [
    { id: "bt-1-open-1", prompt: "What does {function} need to look like in 3 years to serve the business's growth ambitions? What's different from today?" },
    { id: "bt-1-open-2", prompt: "Top 3 inefficiencies in {process} that cost the most time or money today — quantify (FTE-hours / month, error rate, rework)." },
    { id: "bt-1-open-3", prompt: "Where do you feel least confident in the accuracy or timeliness of {process} outputs today? What are the consequences of errors?" },
  ],
  "bt-2": [
    { id: "bt-2-open-1", prompt: "Walk through the AS-IS {process}: cycle time end-to-end, FTE effort per cycle, systems touched, manual / copy-paste steps." },
    { id: "bt-2-open-2", prompt: "Which steps are entirely manual (no system support) and which involve extracting data from one system and re-entering elsewhere?" },
    { id: "bt-2-open-3", prompt: "How are outputs approved today? Who approves, how long does it take, and is there an audit trail?" },
  ],
  "bt-3": [
    { id: "bt-3-open-1", prompt: "Describe the TO-BE TOM for {process} in a Data & AI-first world — new roles, RACI, controls, automation classification per step." },
    { id: "bt-3-open-2", prompt: "Which steps will be Assist / Automate / Eliminate? Which require human-in-the-loop?" },
  ],
  "bt-4": [
    { id: "bt-4-open-1", prompt: "List the gaps between current-state and target TOM across process, data, technology, skills and governance — order by severity." },
    { id: "bt-4-open-2", prompt: "Score the top use cases on Business Impact, User Desirability and Technical Feasibility (1-5 each). Which is the highest priority and why?" },
  ],
  "bt-5": [
    { id: "bt-5-open-1", prompt: "Which roles in {function} are impacted by the proposed automation? What retraining / change-management is needed per persona?" },
    { id: "bt-5-open-2", prompt: "What is the change-appetite of the {process} team (1=very resistant, 5=very open) and what are the blockers?" },
  ],
  "bt-6": [
    { id: "bt-6-open-1", prompt: "What KPIs / success metrics will be tracked post-deployment (baseline + target)? Who owns each metric?" },
    { id: "bt-6-open-2", prompt: "Confirm the signed-off Use Case Backlog handed to Foundations Data — which use case is the lighthouse for {process}?" },
  ],

  // ── Foundations Data (step IDs in assessment-data.ts are db-*) ─────
  "db-1": [
    { id: "db-1-open-1", prompt: "How is the data for {process} produced today? For every source (ERP, planning tool, spreadsheets, files, APIs) capture: system name, business owner, technical owner, domain, refresh frequency, format and how {function} accesses it." , placeholder: "e.g. F&O — Finance Systems Mgr, daily, DB export; Anaplan — FP&A Mgr, monthly, manual export; Excel trackers — FP&A Analyst, ad-hoc…"},
    { id: "db-1-open-2", prompt: "Which of those sources are already landed in Data Hive (Fabric / OneLake) and at which Medallion layer (Bronze / Silver / Gold)? Which are NOT in Data Hive yet?" },
    { id: "db-1-open-3", prompt: "How is {process} data managed today — who curates it, what transformations live in Excel / Anaplan vs in Data Hive, and what is the long-term integrate-vs-migrate decision for Anaplan / legacy planning tools?" },
    { id: "db-1-open-4", prompt: "Which sources contain PII or commercially sensitive data, and what Purview sensitivity labels / DLP controls are applied today?" },
  ],
  "db-2": [
    { id: "db-2-open-1", prompt: "For each critical source feeding {process}, quantify Data Quality on the 5 dimensions: COMPLETENESS (% records with mandatory fields), ACCURACY (error rate of the most critical field, e.g. GL code), CONSISTENCY (system A vs system B), TIMELINESS (freshness vs SLA), UNIQUENESS (duplicate rate).", placeholder: "Use the DQ profiling results from your Fabric data profiling run." },
    { id: "db-2-open-2", prompt: "Per layer, what DQ thresholds are enforced? Does Bronze accept raw, Silver enforce validation, and Gold gate analytics & AI consumption? What happens when a dataset breaches threshold — is it quarantined?" },
    { id: "db-2-open-3", prompt: "Would you trust the Gold-layer data to drive an automated output for {process} WITHOUT human review? If not, which specific dimension blocks you and what would need to be true?" },
  ],
  "db-3": [
    { id: "db-3-open-1", prompt: "Can every critical field used in {process} be traced end-to-end (source → Bronze → Silver → Gold → semantic model → agent grounding)? Where are the lineage BREAKS (manual copy/paste, Excel reformatting, email handoffs)?" },
    { id: "db-3-open-2", prompt: "What is the current state of Microsoft Purview coverage for {process} data — domains registered, business glossary terms, lineage scans, sensitivity labels?" },
  ],
  "db-4": [
    { id: "db-4-open-1", prompt: "Classify each known data gap for the lighthouse {process} use case as BLOCKER (must fix before agent build) / CONDITIONAL (fix before scale) / WATCH (monitor). Note owner and impact for each." },
    { id: "db-4-open-2", prompt: "Which gaps have privacy / consent / residency implications (GDPR, EU AI Act) that must be remediated before any AI use?" },
  ],
  "db-5": [
    { id: "db-5-open-1", prompt: "For the top 5 gaps: name the owner, effort, target date and the Bronze→Silver→Gold milestone that closes them. Which transformations currently live in Excel / Anaplan that must shift LEFT into Data Hive (Fabric)?" },
    { id: "db-5-open-2", prompt: "What Purview configuration (domains, glossary, lineage scan, DLP, certified datasets) and Fabric pipeline work is required to deliver the remediation plan?" },
  ],
  "db-6": [
    { id: "db-6-open-1", prompt: "Does an ONTOLOGY / semantic model exist for {function} (e.g. a Fabric IQ / Foundry IQ semantic layer) so autonomous agents reason on business concepts (Property, Tenancy, Service Charge Head-of-Expenditure, Budget) rather than raw tables? If not, what's the plan to build it?" },
    { id: "db-6-open-2", prompt: "Provide a RAG-rated Data Readiness Scorecard for the lighthouse {process} use case and confirm the retrieval strategy (Foundry IQ / Fabric IQ / MCP servers) the agent will use." },
    { id: "db-6-open-3", prompt: "Outline the integration roadmap (sequencing of source onboarding into Data Hive / OneLake, including Anaplan) for the next 2 quarters." },
  ],

  // ── Agents Factory ─────────────────────────────────────────────────
  "af-1": [
    { id: "af-1-open-1", prompt: "Draft the Agent Charter for the {process} lighthouse: scope boundaries, prohibited actions, instruction set, orchestration pattern (single / multi-agent)." },
    { id: "af-1-open-2", prompt: "Which approved tools / actions / MCP servers will the agent use? Which are explicitly out of scope?" },
  ],
  "af-2": [
    { id: "af-2-open-1", prompt: "Which model(s) will be selected and on what criteria (task complexity, data residency, cost, latency, evaluation results)?" },
    { id: "af-2-open-2", prompt: "How will model performance be validated against a representative gold-set for {process} before sign-off?" },
  ],
  "af-3": [
    { id: "af-3-open-1", prompt: "Describe the retrieval strategy (Foundry IQ / Fabric IQ, search indexes), the tool governance model and the memory architecture for the agent." },
    { id: "af-3-open-2", prompt: "Which knowledge sources are certified Gold and which are conditional? How will groundedness be enforced?" },
  ],
  "af-4": [
    { id: "af-4-open-1", prompt: "Outline the unit / integration test plan, CI/CD pipeline (dev→test→prod) and acceptance criteria for {process}." },
    { id: "af-4-open-2", prompt: "What defects / risks have been logged so far and what is the TDA sign-off path?" },
  ],
  "af-5": [
    { id: "af-5-open-1", prompt: "Describe the guardrail validation, observability (traces, evals) and red-team approach (PyRIT, OWASP LLM Top 10) planned for the agent." },
    { id: "af-5-open-2", prompt: "What residual risks are documented and accepted by the sponsor before go-live?" },
  ],
  "af-6": [
    { id: "af-6-open-1", prompt: "Deployment runbook: environment, Agent 365 registration, monitoring (Azure Monitor / App Insights / Foundry observability), Defender for Cloud AI alerts, on-call." },
    { id: "af-6-open-2", prompt: "What lessons learned from {process} will be fed back into the Master Data Blueprint Playbook for reuse on the next function / process?" },
  ],
};

export function renderPrompt(prompt: string, ctx: { businessFunction?: string; businessProcess?: string }): string {
  const fn = ctx.businessFunction?.trim() || "your business function";
  const pr = ctx.businessProcess?.trim() || "your business process";
  return prompt.replaceAll("{function}", fn).replaceAll("{process}", pr);
}

export function getOpenQuestions(stepId: string): OpenQuestion[] {
  return OPEN_QUESTIONS_BY_STEP[stepId] ?? [];
}
