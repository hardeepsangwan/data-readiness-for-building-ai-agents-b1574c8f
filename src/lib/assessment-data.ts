// Data Blueprint assessment model — 4 workstreams × 6 steps × 2 questions
// Sequenced per Indurent Data Blueprint v1.0; questions grounded in
// Azure CAF for AI Agents (Plan / Govern & Secure / Build / Operate).

export type MaturityLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface MaturityOption {
  level: MaturityLevel;
  label: string;
  description: string;
}

export interface Question {
  id: string;
  text: string;
  relevance: string;
  options: MaturityOption[];
}

export interface Step {
  id: string;
  name: string;
  short: string;
  description: string;
  questions: Question[];
}

export interface Workstream {
  id: string;
  name: string;
  short: string;
  color: string;
  description: string;
  keyOutput: string; // ★ star deliverable
  templates: string[]; // T-XX-NN deliverable templates
  gateCriteria: string[]; // GATE checklist
  handshakeTo: string; // next workstream short
  handshakeOutputs: string[]; // controlled outputs passed forward
  steps: Step[];
}

export const MATURITY_LEVELS: { level: MaturityLevel; name: string; description: string }[] = [
  { level: 0, name: "No Capability", description: "Not aware or no processes, tools or resources to support this capability." },
  { level: 1, name: "Limited Awareness", description: "Some tools or processes may exist; limited awareness of the capability's importance." },
  { level: 2, name: "Foundational", description: "Foundational tools and technologies exist and are operational; very limited implementation." },
  { level: 3, name: "Developing", description: "Comprehensive awareness; tools exist; implementation is not widely deployed across the enterprise." },
  { level: 4, name: "Established", description: "Tools, technology, processes and resources exist; standards defined and enforced through policy." },
  { level: 5, name: "Transformational", description: "Capability is fully implemented, enforced and considered transformational to the business." },
];

const std = (specifics: [string, string, string, string, string, string]): MaturityOption[] => [
  { level: 0, label: "No capability yet", description: specifics[0] },
  { level: 1, label: "Limited awareness", description: specifics[1] },
  { level: 2, label: "Foundational", description: specifics[2] },
  { level: 3, label: "Developing", description: specifics[3] },
  { level: 4, label: "Established", description: specifics[4] },
  { level: 5, label: "Transformational", description: specifics[5] },
];

// ────────────────────────────────────────────────────────────────────────────
// 1. FOUNDATIONS CoE / TECH GOVERNANCE
// ────────────────────────────────────────────────────────────────────────────
const COE: Workstream = {
  id: "coe",
  name: "Foundations CoE — Tech Governance",
  short: "Foundations CoE",
  color: "oklch(0.50 0.14 195)",
  description:
    "CoE establishes guardrails BEFORE any agent is built. Aligned to Azure CAF: Responsible AI, Governance & Security, Prepare Environment.",
  keyOutput: "Tech Guardrail Playbook v1.0",
  templates: [
    "T-TG-01 AI Ethics & Risk Policy",
    "T-TG-02 Data Governance Standards",
    "T-TG-03 Agent Guardrail Framework",
    "T-TG-04 Security & Compliance Checklist",
    "T-TG-05 Integration & API Standards",
    "Tech Guardrail Playbook v1.0",
  ],
  gateCriteria: [
    "Signed Guardrail Framework is published.",
    "Tech Guardrail Playbook v1.0 is released to BT, DB and AF.",
    "Entra Agent Identity model is defined; no agent is built without an assigned identity.",
  ],
  handshakeTo: "Business Transformation",
  handshakeOutputs: [
    "Guardrail Framework",
    "Data Standards Register",
    "Compliance Checklist",
    "Entra Identity Model",
    "MCP / A2A Standards",
  ],
  steps: [
    {
      id: "coe-1",
      name: "CoE Mandate & Scope",
      short: "Mandate",
      description: "Executive sponsorship, programme scope, RACI for the AI agent CoE.",
      questions: [
        {
          id: "coe-1-1",
          text: "Is there an executive-sponsored AI Agent CoE with a documented mandate, scope and RACI covering Tech Governance, Business Transformation, Data and Agents Factory?",
          relevance: "CAF: Organizational readiness. Without a CoE mandate, agent work is fragmented and guardrails are inconsistently applied.",
          options: std([
            "No CoE; agent work happens ad-hoc per team.",
            "Informal working group; no executive sponsor.",
            "CoE is proposed; sponsor identified; scope not signed.",
            "CoE is operating with scope and sponsor; RACI partial.",
            "CoE is mandated enterprise-wide with signed RACI and funding.",
            "CoE governs every agent initiative; performance is reviewed at the exec level.",
          ]),
        },
        {
          id: "coe-1-2",
          text: "Does the CoE own a published operating model that defines how AI agent decisions, exceptions and escalations are handled?",
          relevance: "CAF: Govern agents across the organization. A clear operating model prevents shadow AI and disputes between functions.",
          options: std([
            "No operating model.",
            "Some processes documented per team.",
            "Draft operating model exists.",
            "Operating model published; partially followed.",
            "Operating model is the standard; exceptions are logged centrally.",
            "Operating model is continuously improved with lessons-learned feedback.",
          ]),
        },
        {
          id: 'coe-1-3',
          text: 'Has the CoE defined a reusable Data Blueprint template that can be applied per business domain (FP&A first, then Operations, Asset Mgmt, Customer) without re-inventing standards?',
          relevance: 'RFP §1.1 / 1.4: the Data Blueprint must be a reusable template across domains, not a one-off for FP&A.',
          options: std([
            'No template; each domain builds its own approach.',
            'Template idea discussed; no artefact.',
            'Draft template exists for one domain.',
            'Template piloted on FP&A.',
            'Template formally reusable and scheduled for the next domain.',
            'Template is version-controlled, governed by the CoE and adopted across all domains.',
          ]),
        },
      ],
    },
    {
      id: "coe-2",
      name: "AI Ethics & Risk Policy",
      short: "Ethics & Risk",
      description: "Microsoft Responsible AI: fairness, privacy, accountability, transparency.",
      questions: [
        {
          id: "coe-2-1",
          text: "Is there a board-approved AI Ethics & Risk Policy aligned to Microsoft Responsible AI principles (fairness, reliability, privacy, inclusiveness, transparency, accountability)?",
          relevance: "CAF: Responsible AI. The policy is the umbrella under which every agent must be designed and reviewed.",
          options: std([
            "No AI ethics policy.",
            "Generic IT policy mentions AI.",
            "Draft AI policy circulating.",
            "Policy approved; awareness training partial.",
            "Policy approved, enforced and trained enterprise-wide.",
            "Policy is reviewed annually with measurable adherence metrics.",
          ]),
        },
        {
          id: "coe-2-2",
          text: "Is an AI risk-tier classification (low / medium / high / unacceptable) defined and applied to every proposed use case?",
          relevance: "CAF: Responsible AI. Risk tiering drives the depth of review (red team, human-in-the-loop, audit).",
          options: std([
            "No risk tiering.",
            "Risk discussed informally per project.",
            "Tier definitions drafted.",
            "Tiering applied to most new use cases.",
            "Tiering is mandatory at intake for every use case.",
            "Tiering drives automated controls (HITL, logging, red team) at deployment.",
          ]),
        },
        {
          id: 'coe-2-3',
          text: 'Is alignment with the EU AI Act risk classification (prohibited / high-risk / limited / minimal) built into the AI Ethics & Risk Policy?',
          relevance: 'RFP §3.1.6 explicitly requires EU AI Act compliance for every deployment.',
          options: std([
            'EU AI Act not considered.',
            'Awareness exists; no mapping.',
            'Mapping drafted for one use case.',
            'Mapping applied to most new use cases.',
            'EU AI Act tier is a mandatory intake field.',
            'EU AI Act tier drives automated controls (logging, HITL, conformity assessment).',
          ]),
        },
      ],
    },
    {
      id: "coe-3",
      name: "Data Governance Standards",
      short: "Data Standards",
      description: "Data ownership, RBAC, PII tagging, DLP.",
      questions: [
        {
          id: "coe-3-1",
          text: "Are data ownership, RBAC and PII tagging standards published, with Purview as the system of record?",
          relevance: "CAF: Governance & Security. Standards must exist before agents can be granted scoped access to data.",
          options: std([
            "No standards.",
            "Standards exist informally per team.",
            "Draft standards in Purview.",
            "Standards published; coverage partial.",
            "Standards enforced enterprise-wide via Purview.",
            "Standards drive automated access workflows and access reviews.",
          ]),
        },
        {
          id: "coe-3-2",
          text: "Is a Data Loss Prevention (DLP) policy in place that covers AI grounding surfaces (Fabric IQ, Foundry IQ, M365 Work IQ)?",
          relevance: "CAF: Govern & secure agents. DLP for AI prevents oversharing of sensitive content through agents.",
          options: std([
            "No AI DLP policy.",
            "Standard M365 DLP only.",
            "DLP piloted for one agent.",
            "DLP applied to most agent surfaces.",
            "Enterprise DLP for every agent grounding source.",
            "Adaptive DLP driven by sensitivity labels and caller risk score.",
          ]),
        },
        {
          id: 'coe-3-3',
          text: 'Are GDPR lawful-basis, retention and data-subject-rights controls embedded in the data governance standards that AI agents must inherit?',
          relevance: 'RFP §3.1.6: GDPR compliance is mandatory for every agent that touches personal data.',
          options: std([
            'GDPR not addressed for agents.',
            'Generic GDPR policy with no agent guidance.',
            'Lawful basis assessed for one agent.',
            'Lawful basis assessed for most agents.',
            'GDPR controls (basis, retention, DSR) mandatory and enforced.',
            'GDPR controls auto-applied via Purview labels and policy-as-code.',
          ]),
        },
      ],
    },
    {
      id: "coe-4",
      name: "Agent Guardrail Framework",
      short: "Guardrails",
      description: "Scope boundaries, kill-switch, human-in-the-loop triggers.",
      questions: [
        {
          id: "coe-4-1",
          text: "Is there an Agent Guardrail Framework defining scope boundaries, prohibited actions and required Human-in-the-Loop (HITL) triggers per agent type (Productivity / Action / Automation)?",
          relevance: "CAF: Build agents. Guardrails prevent scope creep and constrain autonomy in line with risk tier.",
          options: std([
            "No guardrail framework.",
            "Guardrails decided per agent.",
            "Framework drafted; one agent uses it.",
            "Framework applied to most new agents.",
            "Framework is mandatory and reviewed at every release.",
            "Guardrails are policy-as-code, validated automatically at build and runtime.",
          ]),
        },
        {
          id: "coe-4-2",
          text: "Is a documented kill-switch / pause procedure available for every production agent?",
          relevance: "CAF: Operate agents. A working kill-switch is the minimum control for non-deterministic agent behaviour.",
          options: std([
            "No kill-switch.",
            "Manual disable per agent; not tested.",
            "Procedure documented for some agents.",
            "Kill-switch tested for most agents.",
            "Standard kill-switch for every agent; tested at release.",
            "One-click kill-switch with automated rollback and stakeholder notification.",
          ]),
        },
        {
          id: 'coe-4-3',
          text: 'Does the guardrail framework prescribe HITL checkpoints, approval workflows and timeout / fallback rules per agent action class?',
          relevance: 'RFP §3.1.3 + §3.2.1: AI deployments require approval workflows and clear human oversight.',
          options: std([
            'No HITL guidance.',
            'HITL discussed per agent.',
            'HITL designed for one agent.',
            'HITL designed for most agents.',
            'HITL standards mandatory and reviewed.',
            'HITL events instrumented and analysed for continuous tuning.',
          ]),
        },
      ],
    },
    {
      id: "coe-5",
      name: "Security & Compliance",
      short: "Sec & Compliance",
      description: "Pen-test requirements, encryption, audit logging.",
      questions: [
        {
          id: "coe-5-1",
          text: "Is an AI-specific Security & Compliance checklist (encryption, audit logging, pen-test, prompt-injection defence) mandatory before any agent goes live?",
          relevance: "CAF: Govern & secure agents. The checklist is the gate every agent must pass before deployment.",
          options: std([
            "No AI security checklist.",
            "Generic IT checklist re-used.",
            "AI checklist drafted.",
            "AI checklist applied to most agents.",
            "AI checklist mandatory and enforced for every agent.",
            "Automated controls verify checklist compliance at deployment time.",
          ]),
        },
        {
          id: "coe-5-2",
          text: "Are agent prompts, tool calls and grounding events logged centrally and retained for audit and Microsoft Defender for AI monitoring?",
          relevance: "CAF: Operate agents. Centralised agent telemetry is required for SOC integration and audit.",
          options: std([
            "No agent telemetry.",
            "Logs exist per agent; not centralised.",
            "Logs collected centrally for one agent.",
            "Most agents log centrally; retention partial.",
            "All agents log centrally with policy-driven retention.",
            "Telemetry feeds Defender for AI and SOC playbooks in real time.",
          ]),
        },
        {
          id: 'coe-5-3',
          text: 'Are pen-test, threat-model (STRIDE / MITRE ATLAS) and incident-response runbooks for agents owned by the SecOps team with named accountability?',
          relevance: 'RFP §3.1.4: pen-test, encryption and monitoring are mandatory for compliance and risk mitigation.',
          options: std([
            'No agent-specific security ownership.',
            'Owned informally by build team.',
            'SecOps named for one flagship agent.',
            'SecOps owns most agent runbooks.',
            'SecOps owns standards + runbooks enterprise-wide.',
            'Agent runbooks integrated into SOC playbooks and exercised regularly.',
          ]),
        },
      ],
    },
    {
      id: "coe-6",
      name: "Tech Guardrail Playbook v1.0 ★",
      short: "Tech Playbook",
      description: "API, MCP and integration standards; Entra identity; Agent 365 baseline.",
      questions: [
        {
          id: "coe-6-1",
          text: "Are API, MCP and integration standards (OAuth on-behalf-of, scopes, Graph connectors) published and used by every agent?",
          relevance: "CAF: Govern agents. Standards govern how identity, scope and data flow safely between agents and tools.",
          options: std([
            "No standards.",
            "Service accounts and shared secrets in use.",
            "OAuth used for some integrations.",
            "Standards used for most new integrations.",
            "Standards enforced enterprise-wide.",
            "Runtime validation of scopes and tool calls per agent invocation.",
          ]),
        },
        {
          id: "coe-6-2",
          text: "Is Microsoft Agent 365 (registry + access control + visualisation + security) established as the control plane for all agents?",
          relevance: "CAF: Govern & secure agents. Agent 365 is the system of record without which shadow agents proliferate.",
          options: std([
            "No central registry; ad-hoc agent builds.",
            "Spreadsheet of known agents.",
            "Agent 365 piloted for one team.",
            "Most production agents registered.",
            "Agent 365 is mandatory for every agent enterprise-wide.",
            "Agent 365 gates deployment, access, monitoring and decommissioning automatically.",
          ]),
        },
        {
          id: 'coe-6-3',
          text: 'Are MCP server registration, A2A protocol standards and Graph connector approval embedded in the Tech Guardrail Playbook v1.0?',
          relevance: 'RFP §3.1.1 + §3.1.8 (Tool Usage Clarity): integration standards are required up-front.',
          options: std([
            'MCP / A2A / Graph standards not defined.',
            'Standards referenced in slides only.',
            'Draft standards used by one team.',
            'Standards used by most teams.',
            'Standards mandatory and published in the Playbook.',
            'Standards enforced via automated registration and runtime checks.',
          ]),
        },
      ],
    },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// 2. BUSINESS TRANSFORMATION
// ────────────────────────────────────────────────────────────────────────────
const BT: Workstream = {
  id: "bt",
  name: "Business Transformation",
  short: "Business Transformation",
  color: "oklch(0.55 0.18 255)",
  description:
    "Translate business outcomes into prioritised, sponsor-signed AI agent use cases. Aligned to Azure CAF: Business Plan, Technology Plan, Single-or-Multiple Agents.",
  keyOutput: "Signed-off Use Case Backlog v1.0",
  templates: [
    "T-BW-01 Business Outcome Statement",
    "T-BW-02 Use Case Decision Log",
    "T-BW-03 Prioritisation Matrix (scored & ranked)",
    "T-BW-04 Business Case per use case",
    "T-BW-05 Stakeholder Sponsor Register",
    "Signed-off Use Case Backlog v1.0",
  ],
  gateCriteria: [
    "Formal business sponsor sign-off recorded per use case.",
    "Guardrail validation check (from CoE Playbook) passed.",
    "KPIs and success metrics defined per use case.",
  ],
  handshakeTo: "Foundations Data",
  handshakeOutputs: [
    "Signed-off Use Case Backlog",
    "Business Cases",
    "KPI Sheets",
    "Prioritisation Matrix",
  ],
  steps: [
    {
      id: "bt-1",
      name: "Define Business Outcome",
      short: "Outcome",
      description: "Map to a measurable business objective and existing process map.",
      questions: [
        {
          id: "bt-1-1",
          text: "For the business function being assessed, is each candidate AI use case mapped to a measurable business outcome (cost, revenue, risk, cycle time)?",
          relevance: "CAF: Business plan. Outcomes are how AI investment is justified and how success is measured.",
          options: std([
            "Use cases described as 'we want AI'.",
            "Vague outcome statements per use case.",
            "Some use cases have a baseline metric.",
            "Most use cases have a measurable target.",
            "All use cases have a baseline + target + owner.",
            "Outcomes are tracked live against KPIs after deployment.",
          ]),
        },
        {
          id: "bt-1-2",
          text: "Is the current human process map (steps, decisions, data, systems) documented for each candidate use case?",
          relevance: "CAF: Business plan. You cannot automate or augment a process you have not mapped.",
          options: std([
            "No process maps.",
            "Tribal knowledge only.",
            "Some process maps exist in slides.",
            "Most use cases have a documented process map.",
            "Process maps standardised and signed by process owners.",
            "Process maps maintained live and linked to the agent design.",
          ]),
        },
        {
          id: 'bt-1-3',
          text: 'For the FP&A domain (Phase 2 of the RFP) is the existing process map covering Excel and Anaplan workflows, reconciliation effort and ad-hoc vs. regular outputs documented?',
          relevance: 'RFP §2.2.2 / §3.1.9: the FP&A discovery must capture process steps, manual effort and output categories.',
          options: std([
            'No FP&A process map.',
            'Tribal knowledge only.',
            'Some processes mapped at a high level.',
            'Most FP&A processes mapped with manual-effort estimates.',
            'All in-scope FP&A processes mapped, signed by process owners.',
            'Process maps maintained live and linked to agent automation targets.',
          ]),
        },
      ],
    },
    {
      id: "bt-2",
      name: "Apply CAF Agent Decision Tree",
      short: "Decision Tree",
      description: "Structured task? RAG? SaaS or custom build?",
      questions: [
        {
          id: "bt-2-1",
          text: "Is Microsoft's Cloud Adoption Framework Agent Decision Tree applied to determine whether each use case needs an agent at all (vs. workflow, RAG, or no AI)?",
          relevance: "CAF: When to use AI agents. Not every problem is an agent problem.",
          options: std([
            "Every problem is assumed to need an agent.",
            "Decision is left to the build team.",
            "Decision tree referenced for some use cases.",
            "Decision tree applied to most new use cases.",
            "Decision tree is mandatory at intake.",
            "Decision tree results are logged and audited.",
          ]),
        },
        {
          id: "bt-2-2",
          text: "Is the SaaS-vs-Custom build decision (M365 Copilot / Copilot Studio / Foundry / custom) made explicitly per use case using CAF guidance?",
          relevance: "CAF: Technology plan. Choosing the wrong platform inflates cost and delays delivery.",
          options: std([
            "No build-vs-buy assessment.",
            "Platform chosen by the loudest opinion.",
            "Assessment done for some flagship use cases.",
            "Assessment standard for most new use cases.",
            "Assessment mandatory with documented rationale.",
            "Platform decision is reviewed against post-launch outcomes.",
          ]),
        },
        {
          id: 'bt-2-3',
          text: 'Has the CAF Agent Decision Tree been applied to the candidate FP&A use case to confirm an agent (vs. RAG, workflow or M365 Copilot) is the right pattern?',
          relevance: 'RFP §2.1: validate that the Data Blueprint approach scales — the decision must be defensible per use case.',
          options: std([
            'Decision tree not used.',
            'Decision recorded informally.',
            'Decision tree applied for one use case.',
            'Decision tree applied for most use cases.',
            'Decision tree mandatory and recorded.',
            'Decision tree outputs are audited and revisited post-launch.',
          ]),
        },
      ],
    },
    {
      id: "bt-3",
      name: "Qualify Agent Type",
      short: "Agent Type",
      description: "Productivity · Action · Automation / Multi-agent.",
      questions: [
        {
          id: "bt-3-1",
          text: "Is each use case classified as Productivity / Action / Automation (CAF agent types) with the autonomy level explicitly chosen?",
          relevance: "CAF: Agent types. The type drives the depth of guardrails, HITL and red-teaming.",
          options: std([
            "No classification.",
            "Type discussed informally.",
            "Type recorded for some use cases.",
            "Type recorded for most use cases.",
            "Type is mandatory metadata at intake.",
            "Type drives automated controls applied at build and deploy.",
          ]),
        },
        {
          id: "bt-3-2",
          text: "Where multi-agent orchestration is proposed, is the orchestration pattern (planner, peer, hierarchical) documented and reviewed?",
          relevance: "CAF: Single or multiple agents. Multi-agent introduces fan-out risk and must be governed.",
          options: std([
            "No multi-agent decisions documented.",
            "Multi-agent built ad-hoc.",
            "Pattern recorded for one pilot.",
            "Pattern recorded for most multi-agent use cases.",
            "Pattern is reviewed and signed by architecture.",
            "Pattern is enforced via reference implementations and red team scenarios.",
          ]),
        },
        {
          id: 'bt-3-3',
          text: 'Is each agent classified for human oversight level — fully autonomous, supervised, advisor — with explicit business sponsor approval?',
          relevance: 'RFP §3.1.3 + EU AI Act: autonomy levels must be deliberate and approved.',
          options: std([
            'No autonomy classification.',
            'Autonomy assumed by build team.',
            'Autonomy classified for one use case.',
            'Autonomy classified for most use cases.',
            'Autonomy classification mandatory + sponsor approved.',
            'Autonomy classification drives runtime guardrails and reporting.',
          ]),
        },
      ],
    },
    {
      id: "bt-4",
      name: "Score & Prioritise (CAF 1–5)",
      short: "Prioritise",
      description: "Business Impact · User Desirability · Technical Feasibility.",
      questions: [
        {
          id: "bt-4-1",
          text: "Are use cases scored on CAF dimensions (Business Impact 1–5, User Desirability 1–5, Technical Feasibility 1–5) and ranked in a prioritisation matrix?",
          relevance: "CAF: Business plan. The matrix is the artefact that lets leadership decide what to fund.",
          options: std([
            "No scoring; FIFO backlog.",
            "Subjective ranking by sponsor.",
            "Scoring done for one cohort.",
            "Scoring done for most new use cases.",
            "Scoring + ranking is the standard intake artefact.",
            "Scoring is recalibrated quarterly with post-launch outcomes.",
          ]),
        },
        {
          id: "bt-4-2",
          text: "Are data readiness signals (RAG from the Foundations Data workstream) reflected in the prioritisation so use cases blocked on data are not promoted?",
          relevance: "Blueprint handshake: BT must not push use cases that Data Readiness flags as BLOCKER. Saves rework.",
          options: std([
            "Data readiness is not considered.",
            "Data is checked verbally per use case.",
            "Initial RAG score noted for some use cases.",
            "RAG score reflected for most use cases.",
            "RAG score is mandatory in the prioritisation matrix.",
            "BT and DB co-own the matrix; BLOCKER gaps automatically deprioritise.",
          ]),
        },
        {
          id: 'bt-4-3',
          text: "Is change-enablement effort (training, role redesign, comms, adoption) scored as part of the prioritisation matrix so 'tech-ready, people-not-ready' use cases are flagged?",
          relevance: 'RFP §1.1: workforce readiness is a stated success criterion alongside technology.',
          options: std([
            'Change effort not scored.',
            'Change risk noted narratively.',
            'Change effort scored for one use case.',
            'Change effort scored for most use cases.',
            'Change effort is a mandatory dimension in the matrix.',
            'Change effort outcomes are tracked and fed back into the matrix.',
          ]),
        },
      ],
    },
    {
      id: "bt-5",
      name: "Define KPIs & Business Value",
      short: "KPIs & Value",
      description: "Baseline metrics, business case, ROI model.",
      questions: [
        {
          id: "bt-5-1",
          text: "Is a business case (cost, benefit, payback, ROI) produced and approved for every prioritised use case?",
          relevance: "CAF: Business plan. No funding without a defensible business case.",
          options: std([
            "No business cases.",
            "Narrative business cases only.",
            "Quantified business case for flagship use cases.",
            "Quantified business case for most use cases.",
            "Business case is mandatory and Finance-approved.",
            "Business case is tracked vs. realised value post-launch.",
          ]),
        },
        {
          id: "bt-5-2",
          text: "Are KPIs (leading + lagging) defined and instrumented so post-launch agent value can be measured?",
          relevance: "CAF: Operate agents. Without KPIs, agents drift and value cannot be proven.",
          options: std([
            "No KPIs.",
            "KPIs discussed but not measured.",
            "KPI dashboards for one agent.",
            "KPIs measured for most agents.",
            "KPIs mandatory at deployment with owner accountability.",
            "KPI signals close the loop back to the prioritisation matrix.",
          ]),
        },
        {
          id: 'bt-5-3',
          text: 'Are baseline metrics (cycle time, FTE effort, error rate, $ value of avoided rework) captured BEFORE the agent is built so post-launch ROI can be proven?',
          relevance: 'RFP §2.1: efficiency gains must be measurable; without baselines, ROI is anecdotal.',
          options: std([
            'No baselines captured.',
            'Baselines estimated narratively.',
            'Baselines captured for flagship use case.',
            'Baselines captured for most use cases.',
            'Baselines mandatory and Finance-signed.',
            'Baselines tracked continuously with delta vs. live KPIs.',
          ]),
        },
      ],
    },
    {
      id: "bt-6",
      name: "Signed-off Use Case Backlog ★",
      short: "Signed Backlog",
      description: "Sponsor sign-off, guardrail check, KPIs set — the handshake to Data Readiness.",
      questions: [
        {
          id: "bt-6-1",
          text: "Is a single, signed-off Use Case Backlog v1.0 maintained and shared with the Data Blueprint and Agents Factory workstreams?",
          relevance: "Blueprint handshake: the backlog is the contract that triggers DB and AF work.",
          options: std([
            "No central backlog.",
            "Spreadsheet maintained per team.",
            "Backlog drafted but not signed.",
            "Backlog signed for current cohort.",
            "Backlog signed, versioned and shared with DB / AF.",
            "Backlog is the source of truth and gates downstream funding.",
          ]),
        },
        {
          id: "bt-6-2",
          text: "Is the GATE check (sponsor sign-off + guardrail validation + KPIs defined) enforced before a use case is handed to the Data Blueprint workstream?",
          relevance: "Blueprint: prevents downstream rework. CAF: Govern agents.",
          options: std([
            "No gate; anything moves forward.",
            "Gate checked verbally.",
            "Gate enforced for one use case.",
            "Gate enforced for most use cases.",
            "Gate is mandatory and audited.",
            "Gate evidence is captured in Agent 365 / governance tooling automatically.",
          ]),
        },
        {
          id: 'bt-6-3',
          text: 'Is the Data Blueprint deliverable set (Outcome, Decision Log, Prioritisation Matrix, Business Case, KPI Sheet, Backlog) packaged as a reusable kit that can be re-run for the next domain after FP&A?',
          relevance: 'RFP §1.1 + §2.1: the blueprint must validate a scalable approach across domains.',
          options: std([
            'Deliverables produced per project, not reusable.',
            'Deliverables stored on shared drives.',
            'Templates created for one or two artefacts.',
            'Templates created for most artefacts.',
            'Full kit templated and re-used for the next domain.',
            'Kit governed by CoE with versioning and continuous improvement.',
          ]),
        },
      ],
    },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// 3. FOUNDATIONS DATA  (Data Blueprint)
// ────────────────────────────────────────────────────────────────────────────
const DB: Workstream = {
  id: "db",
  name: "Foundations Data — Data Blueprint",
  short: "Foundations Data",
  color: "oklch(0.62 0.16 155)",
  description:
    "Map data assets, score quality across Bronze→Silver→Gold→Semantic→Ontology, identify gaps, remediate. Aligned to Azure CAF: Data Architecture, Fabric OneLake, Purview, Foundry IQ retrieval strategy.",
  keyOutput: "Data Readiness Scorecard v1.0 (RAG) + Retrieval Strategy",
  templates: [
    "T-DR-01 Data Asset Map per use case",
    "T-DR-02 Data Quality Scorecard (RAG)",
    "T-DR-03 Lineage & Provenance Map",
    "T-DR-04 Data Gap Register (BLOCKER / CONDITIONAL / WATCH)",
    "T-DR-05 Remediation Action Plan",
    "T-DR-06 Data Readiness Scorecard v1.0 + Retrieval Strategy",
  ],
  gateCriteria: [
    "BLOCKER gaps remediated before agent build.",
    "Bronze → Silver → Gold layers validated.",
    "Ontology layer exists for the in-scope domain.",
    "Retrieval strategy (Foundry IQ / Fabric IQ / MCP) documented and approved.",
  ],
  handshakeTo: "Agents Factory",
  handshakeOutputs: [
    "Data Readiness Scorecard (RAG)",
    "Gap Register",
    "Remediation Plan",
    "Target Data Architecture",
    "Confirmed Retrieval Strategy",
  ],
  steps: [
    {
      id: "db-1",
      name: "Map Data Assets per Use Case",
      short: "Asset Map",
      description: "Source, format, owner, OneLake domain mapping per use case.",
      questions: [
        {
          id: "db-1-1",
          text: "For each prioritised use case, are the source systems (Excel, Anaplan, D365 F&O, others) catalogued and mapped to an OneLake domain with a metadata-driven ingestion pattern?",
          relevance: "Blueprint: agents need a known source of truth landed in OneLake before quality and ontology work.",
          options: std([
            "Sources not catalogued; nothing in OneLake.",
            "Sources known informally; ad-hoc ingestion.",
            "One source landed in OneLake; others siloed.",
            "Multiple sources landed; pipelines reusable but not metadata-driven.",
            "All sources landed via a metadata-driven framework with standard patterns.",
            "Self-service onboarding: new sources auto-deployed by config into OneLake.",
          ]),
        },
        {
          id: "db-1-2",
          text: "Is the source-system identity, owner and sensitivity label preserved at ingestion so downstream Purview / Agent 365 controls can be honoured?",
          relevance: "CAF: Data architecture + Govern agents. If metadata is lost on ingestion, runtime access decisions break.",
          options: std([
            "Metadata stripped on ingest.",
            "Some metadata captured inconsistently.",
            "Owner and source captured for selected pipelines.",
            "Identity, owner, labels captured for most pipelines.",
            "Full metadata preserved enterprise-wide.",
            "Metadata flows into Purview / Fabric IQ / Foundry IQ and drives runtime access.",
          ]),
        },
        {
          id: 'db-1-3',
          text: 'Are all in-scope FP&A data sources (Excel, Anaplan, D365 F&O, Yardi / property systems, bank feeds) catalogued with a target Microsoft Fabric Medallion landing zone in Data Hive?',
          relevance: 'RFP §3.1.1 + §3.1.5: Medallion architecture in Fabric / Data Hive is the explicit target.',
          options: std([
            'No catalogue; Excel & Anaplan remain siloed.',
            'Source list maintained manually.',
            'Catalogue exists for one source landed in Bronze.',
            'Catalogue + Bronze landing for most sources.',
            'All sources catalogued and landing into Bronze via standard patterns.',
            'Catalogue is metadata-driven; new sources self-onboard into the Medallion.',
          ]),
        },
      ],
    },
    {
      id: "db-2",
      name: "Assess Data Quality (All Layers)",
      short: "DQ Scorecard",
      description: "Completeness · Accuracy · Consistency · Timeliness · Uniqueness across Bronze / Silver / Gold.",
      questions: [
        {
          id: "db-2-1",
          text: "Are data quality rules (completeness, accuracy, consistency, timeliness, uniqueness) defined and executed on the data feeding each agent?",
          relevance: "Blueprint + CAF: silent DQ issues are the #1 cause of wrong agent answers.",
          options: std([
            "No DQ rules.",
            "Informal checks on a few critical tables.",
            "DQ rules coded in some pipelines.",
            "DQ framework used for several domains; partial coverage.",
            "Enterprise DQ framework for all certified datasets with SLAs.",
            "DQ SLAs gate agent grounding surfaces automatically.",
          ]),
        },
        {
          id: "db-2-2",
          text: "Are layer contracts standardised across Bronze (raw) → Silver (curated/validated) → Gold (dim/fact)?",
          relevance: "CAF: Data architecture. Agents consume Gold; without contracts, the layers leak inconsistencies.",
          options: std([
            "No medallion structure.",
            "Medallion in name only.",
            "Bronze + Silver defined; Gold ad-hoc.",
            "Medallion documented; legacy varies.",
            "Medallion enforced enterprise-wide with naming and schemas.",
            "Layer contracts versioned and consumed via certified semantic models.",
          ]),
        },
        {
          id: 'db-2-3',
          text: 'Are DQ thresholds set per layer (Bronze accepts raw, Silver enforces validation, Gold gates analytics & AI consumption) and breached datasets blocked from agent grounding?',
          relevance: 'RFP §3.1.2 + §3.1.5: governance + medallion must guarantee agents consume trusted data.',
          options: std([
            'No layer-specific DQ thresholds.',
            'DQ checked at one layer only.',
            'Thresholds set for one critical dataset.',
            'Thresholds set for most certified datasets.',
            'Thresholds enforced per layer with quarantine of bad data.',
            'Thresholds gate Gold publication and AI grounding automatically.',
          ]),
        },
      ],
    },
    {
      id: "db-3",
      name: "Evaluate Lineage & Provenance",
      short: "Lineage",
      description: "End-to-end lineage in Purview, audit trail for AI grounding.",
      questions: [
        {
          id: "db-3-1",
          text: "Is end-to-end lineage (source → Bronze → Silver → Gold → semantic model → agent grounding) captured and visible in Purview / Fabric?",
          relevance: "Agent 365 governance, impact analysis and trust in AI outputs require full lineage.",
          options: std([
            "No lineage captured.",
            "Lineage in diagrams only.",
            "Pipeline-level lineage in Fabric.",
            "Lineage in Purview for most pipelines.",
            "End-to-end lineage including agent grounding sources.",
            "Lineage drives automated impact analysis and notifies agent owners.",
          ]),
        },
        {
          id: "db-3-2",
          text: "Are AI agent grounding events (which document, which row, which model version) traceable for audit?",
          relevance: "CAF: Operate agents. Provenance is required to defend agent answers.",
          options: std([
            "Grounding not traceable.",
            "Some logging in dev environments.",
            "Traceability for one agent.",
            "Traceability for most agents.",
            "Standard provenance capture across all agents.",
            "Provenance integrated with Defender for AI and audit.",
          ]),
        },
        {
          id: 'db-3-3',
          text: 'Is lineage captured in Microsoft Purview from source through Bronze→Silver→Gold→Semantic→Ontology so any agent answer can be traced to source records?',
          relevance: 'RFP §3.1.6: full auditability of data pipelines and AI workflows is mandatory.',
          options: std([
            'No Purview lineage.',
            'Lineage in diagrams only.',
            'Purview lineage for one pipeline.',
            'Purview lineage for most pipelines.',
            'End-to-end lineage including semantic and ontology layers.',
            'Lineage drives impact analysis and notifies agent owners on upstream change.',
          ]),
        },
      ],
    },
    {
      id: "db-4",
      name: "Identify Data Gaps & Risks",
      short: "Gap Register",
      description: "BLOCKER · CONDITIONAL · WATCH classification; privacy gaps.",
      questions: [
        {
          id: "db-4-1",
          text: "Is a Data Gap Register maintained per use case classifying gaps as BLOCKER / CONDITIONAL / WATCH with owner and impact?",
          relevance: "Blueprint: the register is the source of truth for what must be fixed before an agent goes live.",
          options: std([
            "No register.",
            "Issues tracked in tickets ad-hoc.",
            "Register exists for one use case.",
            "Register exists for most use cases.",
            "Register is mandatory and reviewed at gate meetings.",
            "Register integrates with the prioritisation matrix and remediation backlog.",
          ]),
        },
        {
          id: "db-4-2",
          text: "Are privacy / PII gaps (uncovered, mislabelled, over-shared) explicitly identified and risk-rated?",
          relevance: "CAF: Govern & secure agents. Privacy gaps are a frequent BLOCKER for Copilot-style agents.",
          options: std([
            "Privacy gaps not assessed.",
            "Privacy reviewed verbally.",
            "Privacy assessed for one pilot.",
            "Privacy assessed for most use cases.",
            "Privacy assessment is mandatory and signed by DPO.",
            "Privacy controls are policy-driven and validated at runtime.",
          ]),
        },
        {
          id: 'db-4-3',
          text: 'Is each FP&A gap explicitly classified as BLOCKER (must fix before build) / CONDITIONAL (fix before scale) / WATCH (monitor) with owner, ETA and dependency on the CoE Data Standards?',
          relevance: 'RFP §2.2.1 Gap Analysis: must be structured, owned and feed the remediation plan.',
          options: std([
            'No classification.',
            'Issues logged in tickets.',
            'Classification used for one use case.',
            'Classification used for most use cases.',
            'Classification mandatory with owner and ETA.',
            'Classification drives automated re-prioritisation in the backlog.',
          ]),
        },
      ],
    },
    {
      id: "db-5",
      name: "Remediation Action Plan",
      short: "Remediation",
      description: "Owners, timelines, Bronze→Silver→Gold remediation path.",
      questions: [
        {
          id: "db-5-1",
          text: "Is a Remediation Action Plan published per use case with owners, timelines and clear exit criteria for each BLOCKER?",
          relevance: "Blueprint gate: BLOCKER gaps must be remediated before agent build.",
          options: std([
            "No remediation plan.",
            "Issues fixed when business complains.",
            "Plan documented for one use case.",
            "Plan documented for most use cases.",
            "Plan with SLAs enforced for all certified datasets.",
            "Closed-loop remediation with auto-tickets and root-cause tracking.",
          ]),
        },
        {
          id: "db-5-2",
          text: "Is remediation progress reported to the BT / CoE governance forum so blocked use cases visibly slip in priority?",
          relevance: "Blueprint: prevents BLOCKER use cases being silently pushed forward.",
          options: std([
            "No reporting.",
            "Reported informally.",
            "Reported for flagship use cases.",
            "Reported in most governance meetings.",
            "Standard reporting cadence to BT / CoE.",
            "Live dashboard visible to exec sponsors.",
          ]),
        },
        {
          id: 'db-5-3',
          text: 'Does the remediation plan shift data transformation logic LEFT — out of Excel / Anaplan and into Data Hive (Fabric) — with retirement milestones for legacy logic?',
          relevance: 'RFP §3.1.5: explicitly mandates reducing reliance on Excel and Anaplan for transformation and storage.',
          options: std([
            'Excel / Anaplan logic frozen; no migration plan.',
            'Migration discussed informally.',
            'One workflow re-platformed onto Fabric.',
            'Multiple workflows migrated; legacy not yet retired.',
            'Migration plan with retirement milestones owned and tracked.',
            'Legacy logic decommissioned; Data Hive is the single source for transformation.',
          ]),
        },
      ],
    },
    {
      id: "db-6",
      name: "Data Readiness Scorecard (RAG) ★",
      short: "Readiness Scorecard",
      description: "RAG per use case + retrieval strategy confirmed.",
      questions: [
        {
          id: "db-6-1",
          text: "Is a Data Readiness Scorecard (RAG) produced per use case and signed by the data owner before handover to the Agents Factory?",
          relevance: "Blueprint key handshake. RED use cases cannot proceed without remediation.",
          options: std([
            "No scorecard.",
            "Verbal readiness statement.",
            "Scorecard for one use case.",
            "Scorecard for most use cases.",
            "Scorecard is mandatory at handover with owner sign-off.",
            "Scorecard is reviewed periodically post-launch and re-rated.",
          ]),
        },
        {
          id: "db-6-2",
          text: "Is the retrieval strategy (Foundry IQ / Fabric IQ / MCP servers) explicitly chosen and documented per use case?",
          relevance: "CAF: Data architecture. The retrieval strategy drives the agent's grounding pattern and access controls.",
          options: std([
            "Retrieval strategy not considered.",
            "Decided by the build team at the last minute.",
            "Documented for one use case.",
            "Documented for most use cases.",
            "Documented and reviewed by architecture for all use cases.",
            "Retrieval strategy is policy-driven and validated against eval suites.",
          ]),
        },
        {
          id: 'db-6-3',
          text: 'Does the Data Readiness Scorecard include an explicit Ontology layer assessment (Fabric IQ / Foundry IQ) so agents ground on business concepts, not raw tables?',
          relevance: 'Blueprint requires an ontology layer between Gold and agent consumption; agents that ground on raw tables hallucinate.',
          options: std([
            'No ontology layer.',
            'Ontology discussed as a future state.',
            'Ontology defined for one domain.',
            'Ontology defined for most in-scope domains.',
            'Ontology layer mandatory before agent build.',
            'Ontology layer governed, versioned and used by every grounded agent.',
          ]),
        },
      ],
    },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// 4. AGENTS FACTORY
// ────────────────────────────────────────────────────────────────────────────
const AF: Workstream = {
  id: "af",
  name: "Agents Factory",
  short: "Agents Factory",
  color: "oklch(0.55 0.18 35)",
  description:
    "Build, validate and operate agents on the foundations set by CoE, BT and DB. Aligned to Azure CAF: Build agents, Operate agents.",
  keyOutput: "Deployed Agent in Agent 365 + Monitoring Dashboard live",
  templates: [
    "T-AF-01 Agent Charter Document",
    "T-AF-02 Model Selection Record + validation",
    "T-AF-03 Knowledge Integration Spec + Tool Governance Register",
    "T-AF-04 Test Results & Defect Log",
    "T-AF-05 Guardrail Validation Report + AI Red Team Clearance Certificate",
    "T-AF-06 Deployed Agent in Agent 365 + Monitoring Dashboard",
  ],
  gateCriteria: [
    "Guardrail Validation Report signed off.",
    "UAT business sponsor acceptance recorded.",
    "AI Red Team clearance certificate issued.",
    "Agent registered in Microsoft Agent 365.",
  ],
  handshakeTo: "Continuous Improvement",
  handshakeOutputs: [
    "Lessons Learned",
    "Updated Master Data Blueprint Playbook",
    "Telemetry feedback to BT (KPI realisation) and DB (data fixes)",
  ],
  steps: [
    {
      id: "af-1",
      name: "Charter & Instructions",
      short: "Charter",
      description: "Agent scope, prohibited actions, orchestration model.",
      questions: [
        {
          id: "af-1-1",
          text: "Does every agent have a signed Agent Charter defining scope, prohibited actions, owner, risk tier and orchestration model?",
          relevance: "CAF: Build agents. The charter is the contract between business and engineering.",
          options: std([
            "No charters.",
            "Charter discussed informally.",
            "Charter for one flagship agent.",
            "Charter for most agents.",
            "Charter is mandatory and signed at intake.",
            "Charter is enforced via Agent 365 and validated at every release.",
          ]),
        },
        {
          id: "af-1-2",
          text: "Are agent instructions (system prompt, persona, refusal rules) versioned and reviewed at each release?",
          relevance: "CAF: Operate agents. Prompt drift silently changes agent behaviour.",
          options: std([
            "Prompts edited live in prod.",
            "Some prompts backed up manually.",
            "Versioning exists for one agent.",
            "Most agents version-controlled.",
            "All agents follow a release lifecycle.",
            "Prompt regressions are caught by automated eval at promotion.",
          ]),
        },
        {
          id: 'af-1-3',
          text: 'Does the Agent Charter explicitly forbid actions outside scope (e.g. an FP&A reporting agent cannot post journals or email customers) and codify the refusal behaviour?',
          relevance: 'RFP §3.1.3 + §3.1.8: agent behaviour must be predictable and tool usage clear.',
          options: std([
            'No prohibited-action list.',
            'Discussed informally with the builder.',
            'List captured for one agent.',
            'List captured for most agents.',
            'List mandatory and validated in tests.',
            'Prohibited actions enforced as policy-as-code at runtime.',
          ]),
        },
      ],
    },
    {
      id: "af-2",
      name: "Model Selection",
      short: "Model Select",
      description: "Match model to complexity; validate; use Model Router where appropriate.",
      questions: [
        {
          id: "af-2-1",
          text: "Is model selection driven by a documented matrix of task complexity, cost, latency and data residency rather than 'latest model wins'?",
          relevance: "CAF: Technology plan. Wrong model = wasted cost or unfit-for-purpose answers.",
          options: std([
            "No selection criteria.",
            "Default model used everywhere.",
            "Selection for flagship agents only.",
            "Selection for most new agents.",
            "Selection matrix is mandatory and reviewed.",
            "Model Router automates per-call selection with policy guardrails.",
          ]),
        },
        {
          id: "af-2-2",
          text: "Are selected models validated against representative tasks before being approved for production agents?",
          relevance: "CAF: Build agents. Model validation prevents quality surprises after launch.",
          options: std([
            "No validation.",
            "Spot-check by developer.",
            "Validation for one model.",
            "Validation for most models.",
            "Standard validation suite for every model decision.",
            "Continuous validation as new models / versions are released.",
          ]),
        },
        {
          id: 'af-2-3',
          text: 'Is data residency / sovereignty (UK / EU region for Indurent) a hard constraint in model selection and grounding sources?',
          relevance: 'RFP §3.1.6 + GDPR: data must stay in approved regions; some models can leak data across boundaries.',
          options: std([
            'Region not considered.',
            'Region considered for production only.',
            'Region pinned for one agent.',
            'Region pinned for most agents.',
            'Region is a mandatory deployment policy.',
            'Region pinning auto-enforced and audited per call.',
          ]),
        },
      ],
    },
    {
      id: "af-3",
      name: "Knowledge, Tools & Memory",
      short: "Knowledge & Tools",
      description: "Foundry IQ / Fabric IQ / MCP grounding; tool boundaries; HITL.",
      questions: [
        {
          id: "af-3-1",
          text: "Are agent tools registered, scoped (least-privilege) and approved before being attached to an agent?",
          relevance: "CAF: Govern & secure agents. Tools are the agent's hands; unscoped tools = uncontrolled actions.",
          options: std([
            "Tools added ad-hoc by the builder.",
            "Tools listed in design docs.",
            "Tool registry for one agent.",
            "Tool registry for most agents.",
            "Tool registry enforced enterprise-wide via Agent 365.",
            "Tool scopes validated at runtime per agent invocation.",
          ]),
        },
        {
          id: "af-3-2",
          text: "Is memory architecture (short-term / long-term / per-user) explicitly chosen and governed for each agent?",
          relevance: "CAF: Build agents. Memory leaks across users are a common privacy incident.",
          options: std([
            "No memory decisions documented.",
            "Default memory accepted.",
            "Memory designed for one agent.",
            "Memory designed for most agents.",
            "Memory architecture is a mandatory design artefact.",
            "Memory is policy-driven and audited continuously.",
          ]),
        },
        {
          id: 'af-3-3',
          text: 'Are agent tools and grounding connectors approved via the CoE Tool Governance Register before being attached, with sensitivity-aware DLP applied?',
          relevance: 'RFP §3.1.8 (Tool Usage Clarity) + §3.1.4: tool sprawl is the most common cause of data leakage.',
          options: std([
            'No tool approval process.',
            'Builder decides per agent.',
            'Approval for tools on one flagship agent.',
            'Approval for most agents.',
            'Approval mandatory; tools tagged with sensitivity.',
            'Approval enforced via Agent 365 / Purview at runtime.',
          ]),
        },
      ],
    },
    {
      id: "af-4",
      name: "Build & Unit Test",
      short: "Build & Test",
      description: "Build to charter; unit tests; CI/CD integration.",
      questions: [
        {
          id: "af-4-1",
          text: "Are agent artefacts (prompts, tools, knowledge sources, connectors) deployed via CI/CD rather than hand-edited per environment?",
          relevance: "CAF: Operate agents. CI/CD for agents is required for repeatability, audit and rollback.",
          options: std([
            "Agents built and edited in Prod.",
            "Manual export/import between environments.",
            "Some agents have a deploy script.",
            "Most agents deployed via pipelines.",
            "All agents deployed through CI/CD with approvals.",
            "Agent definitions + evals + policies deployed as code with auto-rollback.",
          ]),
        },
        {
          id: "af-4-2",
          text: "Are automated tests (unit, integration, data contract, agent eval) executed as a gate before promotion?",
          relevance: "CAF: Build agents. Tests catch regressions in data contracts that silently break grounded agents.",
          options: std([
            "No automated tests.",
            "A few unit tests run locally.",
            "Unit tests run in CI for selected artefacts.",
            "Unit + basic data tests in CI for most artefacts.",
            "Full test pyramid gates every promotion.",
            "Includes AI-eval suites validating agent quality before release.",
          ]),
        },
        {
          id: 'af-4-3',
          text: 'Are integration tests covering the full FP&A workflow (Excel/Anaplan inputs → Data Hive → semantic → agent → output) executed automatically before promotion?',
          relevance: 'RFP §3.1.5 + §2.2.2: end-to-end FP&A workflow must be reliably automatable.',
          options: std([
            'No integration tests.',
            'Manual smoke tests only.',
            'End-to-end test for one agent.',
            'End-to-end tests for most agents.',
            'Full E2E suite gates every promotion.',
            'E2E suite includes data-contract + AI-eval and runs continuously.',
          ]),
        },
      ],
    },
    {
      id: "af-5",
      name: "Guardrail Validation & Red Team",
      short: "Red Team",
      description: "Adversarial testing, prompt injection, red team clearance.",
      questions: [
        {
          id: "af-5-1",
          text: "Is every agent put through adversarial testing (prompt injection, jailbreak, data exfiltration) by an independent AI Red Team before go-live?",
          relevance: "CAF: Govern & secure agents. Red Team clearance is the deployment gate.",
          options: std([
            "No red teaming.",
            "Builder runs basic jailbreak prompts.",
            "Independent red team for one flagship agent.",
            "Independent red team for most agents.",
            "Red Team clearance certificate mandatory for production.",
            "Continuous red teaming with adaptive defences governed via Agent 365.",
          ]),
        },
        {
          id: "af-5-2",
          text: "Are guardrails (prompt shields, content filters, DLP, exfiltration controls) validated as effective for each agent's risk tier?",
          relevance: "CAF: Govern & secure agents. Generic controls are necessary but not sufficient.",
          options: std([
            "No guardrail validation.",
            "Default Foundry filters only.",
            "Validation for one pilot.",
            "Validation for most agents.",
            "Validation mandatory per release; results retained.",
            "Validation is automated and re-run on every change.",
          ]),
        },
        {
          id: 'af-5-3',
          text: 'Are agent outputs reviewed for fairness, bias and explainability against the AI Ethics Policy before sign-off — not just security?',
          relevance: 'RFP §1.4 + Microsoft Responsible AI: red-team must cover ethics, not only security.',
          options: std([
            'No ethics review at red team.',
            'Ad-hoc review by builder.',
            'Ethics review for one flagship agent.',
            'Ethics review for most agents.',
            'Ethics review mandatory and signed by ethics owner.',
            'Continuous ethics monitoring post-launch with feedback to policy.',
          ]),
        },
      ],
    },
    {
      id: "af-6",
      name: "Deploy, Monitor & Operate ★",
      short: "Deploy & Operate",
      description: "Agent 365 registered, monitoring live, lessons learned.",
      questions: [
        {
          id: "af-6-1",
          text: "Is the agent deployed via Microsoft Agent 365 with owner, scopes, kill-switch and monitoring dashboard live at go-live?",
          relevance: "CAF: Operate agents. Agent 365 is the production control plane.",
          options: std([
            "Agents deployed ad-hoc; no central control.",
            "Agents registered after-the-fact.",
            "One agent operating via Agent 365.",
            "Most production agents in Agent 365.",
            "Agent 365 is mandatory at deployment for every agent.",
            "Agent 365 gates production traffic, monitoring and decommissioning.",
          ]),
        },
        {
          id: "af-6-2",
          text: "Are lessons learned captured per agent and fed back into the Master Data Blueprint Playbook for the next cycle?",
          relevance: "Blueprint: continuous improvement closes the loop with CoE, BT and DB.",
          options: std([
            "No lessons captured.",
            "Lessons stored in team notes.",
            "Lessons captured for one agent.",
            "Lessons captured for most agents.",
            "Lessons feed quarterly Playbook updates.",
            "Lessons drive automated changes to standards and templates.",
          ]),
        },
        {
          id: 'af-6-3',
          text: 'Are post-deployment monitoring, drift alerts, helpdesk / Data & AI liaison routes and quarterly model-and-prompt review cadence in place for every live agent?',
          relevance: 'RFP §3.1.10: knowledge, training and ongoing support are explicit requirements.',
          options: std([
            'No monitoring or support after go-live.',
            'Reactive support only.',
            'Monitoring + support for one agent.',
            'Monitoring + support for most agents.',
            'Monitoring + support standard for every agent.',
            'Closed-loop: drift triggers retraining, model swap or charter update automatically.',
          ]),
        },
      ],
    },
  ],
};

export const WORKSTREAMS: Workstream[] = [COE, BT, DB, AF];

// Legacy DIMENSIONS shape — each workstream surfaces as one radar/chart axis
// for the high-level views. Components that need per-step detail use WORKSTREAMS.
export interface Dimension {
  id: string;
  name: string;
  short: string;
  icon: string;
  color: string;
  description: string;
  questions: Question[];
}

export const DIMENSIONS: Dimension[] = WORKSTREAMS.map((w) => ({
  id: w.id,
  name: w.name,
  short: w.short,
  icon: "Layers",
  color: w.color,
  description: w.description,
  questions: w.steps.flatMap((s) => s.questions),
}));

export const TOTAL_QUESTIONS = WORKSTREAMS.reduce(
  (acc, w) => acc + w.steps.reduce((a, s) => a + s.questions.length, 0),
  0,
);

export const TOTAL_STEPS = WORKSTREAMS.reduce((acc, w) => acc + w.steps.length, 0);

export function stepAverages(
  step: Step,
  answers: Record<string, { current: MaturityLevel; target: MaturityLevel }>,
) {
  const ans = step.questions.filter((q) => answers[q.id]);
  if (ans.length === 0) return { current: 0, target: 0, answered: 0, total: step.questions.length };
  const current = ans.reduce((s, q) => s + answers[q.id].current, 0) / ans.length;
  const target = ans.reduce((s, q) => s + answers[q.id].target, 0) / ans.length;
  return { current, target, answered: ans.length, total: step.questions.length };
}

export function workstreamAverages(
  ws: Workstream,
  answers: Record<string, { current: MaturityLevel; target: MaturityLevel }>,
) {
  const allQ = ws.steps.flatMap((s) => s.questions);
  const ans = allQ.filter((q) => answers[q.id]);
  if (ans.length === 0) return { current: 0, target: 0, answered: 0, total: allQ.length };
  const current = ans.reduce((s, q) => s + answers[q.id].current, 0) / ans.length;
  const target = ans.reduce((s, q) => s + answers[q.id].target, 0) / ans.length;
  return { current, target, answered: ans.length, total: allQ.length };
}
