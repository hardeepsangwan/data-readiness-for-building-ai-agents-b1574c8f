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
  resources?: { label: string; url: string }[];
}

export interface Dimension {
  id: string;
  name: string;
  short: string;
  icon: string;
  color: string;
  description: string;
  questions: Question[];
}

export const MATURITY_LEVELS: { level: MaturityLevel; name: string; description: string }[] = [
  { level: 0, name: "No Capability", description: "The organization is either not aware or has any processes, tools or resources to support this capability." },
  { level: 1, name: "Limited Awareness", description: "Some tools and processes may exist. However, there is limited awareness for the importance of managing this capability across the Data and Analytics solution." },
  { level: 2, name: "Foundational", description: "Foundations of tools and technologies to manage this capability exist and are operational. There is very limited implementation or minor initiatives that demonstrate the organizations' capability to sustain this across the Data and Analytics solution." },
  { level: 3, name: "Developing", description: "Comprehensive awareness exists. Tools, technology to support the capability exist. Some resource contention. However, the implementation of the capability is not widely deployed. Implementation varied between various business areas in the Data and Analytics solution as well not across the enterprise and not enforced by policies." },
  { level: 4, name: "Established", description: "Tools, technology, processes and resources exist. Standards are defined. The capability is enforced through all business areas in the Data and Analytics solution, and enforced by policy throughout new implementations. However, there is no transformational change due to the implementation of this capability." },
  { level: 5, name: "Transformational", description: "The capability is fully implemented and enforced throughout the Data and Analytics solution. The deployment of this capability is considered as transforming the analytical business as well as expanding the analytics capability that could not be achieved prior to this deployment." },
];

const std = (specifics: [string, string, string, string, string, string]): MaturityOption[] => [
  { level: 0, label: "No capability yet", description: specifics[0] },
  { level: 1, label: "Limited awareness", description: specifics[1] },
  { level: 2, label: "Foundational", description: specifics[2] },
  { level: 3, label: "Developing", description: specifics[3] },
  { level: 4, label: "Established", description: specifics[4] },
  { level: 5, label: "Transformational", description: specifics[5] },
];

export const DIMENSIONS: Dimension[] = [
  {
    id: "ingestion",
    name: "Data Ingestion",
    short: "Ingestion",
    icon: "Download",
    color: "oklch(0.55 0.18 255)",
    description: "Ability to ingest data from disparate sources (Excel, Anaplan, D365 F&O, and future systems) into Microsoft Fabric using a reusable, metadata-driven framework.",
    questions: [
      {
        id: "ing-1",
        text: "For the business process being assessed (e.g. FP&A), from which source systems are you picking data — and is it ingested into OneLake via a metadata-driven framework?",
        relevance: "AI agents for a business process need to know exactly which systems hold the source of truth (e.g. Anaplan for planning, D365 F&O for actuals, Excel for FP&A working files). Landing all of these in OneLake through a metadata-driven framework is the prerequisite to applying data quality rules and building an ontology layer for agent grounding.",
        options: std([
          "Sources are not catalogued. Data lives in spreadsheets / source apps. Nothing in OneLake.",
          "We know the sources informally (Anaplan, D365 F&O, Excel) but ingest them ad-hoc per request; no OneLake landing zone.",
          "One source (e.g. Excel for FP&A) is ingested into OneLake with a hand-built pipeline. Others still siloed.",
          "All three sources (Anaplan, D365 F&O, Excel) are catalogued and landed in OneLake; pipelines are reusable but not fully metadata-driven.",
          "Enterprise metadata-driven framework lands every business-process source into OneLake with standard patterns, monitoring and lineage; new sources added by config.",
          "Self-service: business owners register a new source for a process; the framework auto-deploys pipelines, monitoring and lineage into OneLake ready for ontology + agent grounding.",
        ]),
      },
      {
        id: "ing-2",
        text: "How are ingestion patterns (full load, incremental, CDC) standardised across sources?",
        relevance: "AI workloads need predictable freshness and history. Standard load patterns enable trustworthy time-travel queries and reproducible model training sets.",
        options: std([
          "Loads are ad-hoc. No notion of full vs incremental.",
          "Mostly full loads; incremental is hand-coded per pipeline.",
          "A documented pattern exists for incremental loads but not consistently applied.",
          "Standard patterns exist for full / incremental / CDC and are applied to most pipelines.",
          "All pipelines use the standard patterns, governed by templates and reviewed at design time.",
          "Patterns are auto-selected by the framework based on source metadata; CDC is the default where supported.",
        ]),
      },
      {
        id: "ing-3",
        text: "How is ingestion monitoring, alerting and reprocessing handled?",
        relevance: "Reliable ingestion telemetry is foundational for AI agents that depend on fresh, complete data.",
        options: std([
          "No monitoring; failures are discovered by users.",
          "Manual checks by the engineering team.",
          "Basic Fabric pipeline run history is reviewed.",
          "Centralised dashboards exist but reprocessing is manual.",
          "Standard alerting + automated retry / reprocessing is in place across the platform.",
          "Self-healing pipelines with proactive anomaly detection on volumes and SLAs.",
        ]),
      },
      {
        id: "ing-4",
        text: "Are unstructured / semi-structured sources (SharePoint, Teams, email, PDFs, images) ingested into Fabric OneLake or indexed in Foundry IQ for agent grounding?",
        relevance: "Copilot Studio and M365 agents working with Work IQ rely heavily on unstructured content. Without controlled ingestion into OneLake / Foundry IQ indexes, agents either miss context or pull ungoverned content.",
        options: std([
          "No unstructured ingestion; agents would scrape ad-hoc.",
          "A few documents are uploaded manually for a pilot.",
          "Selected SharePoint sites are indexed for one use case.",
          "Multiple unstructured sources ingested but not unified across Fabric IQ / Foundry IQ.",
          "Enterprise pattern ingests unstructured content into OneLake and Foundry IQ indexes with governance.",
          "Unified Fabric IQ + Foundry IQ indexing with auto-classification, label inheritance and incremental refresh feeding all agents.",
        ]),
      },
      {
        id: "ing-5",
        text: "Is ingestion latency / freshness aligned to the SLAs required by your AI agents (e.g. near-real-time vs daily)?",
        relevance: "Agents grounded on stale data will give wrong answers. Freshness SLAs must be explicit per use case (Copilot, Foundry, M365 agents).",
        options: std([
          "No freshness SLAs are defined.",
          "Freshness is whatever the batch happens to deliver.",
          "Critical tables have informal freshness targets.",
          "Freshness SLAs documented per domain; partially monitored.",
          "Freshness SLAs are contractual per agent use case and monitored centrally.",
          "Mixed batch + streaming + CDC patterns auto-selected per agent SLA, with breach alerts to the agent owner.",
        ]),
      },
      {
        id: "ing-6",
        text: "Does ingestion preserve source-system identity, sensitivity labels and permissions metadata so they can be honoured downstream by Copilot / Foundry / M365 agents?",
        relevance: "If the user/owner, sensitivity label and source ACLs are dropped at ingestion, downstream access control and Agent 365 policies cannot be enforced.",
        options: std([
          "Source identity and labels are stripped on ingest.",
          "Some metadata is captured inconsistently.",
          "Owner and source system are captured for selected pipelines.",
          "Identity, owner and labels captured for most pipelines; ACLs partially preserved.",
          "Full metadata (owner, label, source ACL, lineage) preserved enterprise-wide.",
          "Metadata flows end-to-end into Purview, Fabric IQ and Foundry IQ and drives runtime access decisions for agents.",
        ]),
      },
      {
        id: "ing-7",
        text: "For the FP&A pilot, is finance-grade reconciliation done at ingestion (Anaplan plan vs D365 F&O actuals vs Excel adjustments) before data is exposed to AI agents?",
        relevance: "FP&A agents must not give answers that disagree with the closed books. Reconciliation at ingestion prevents agents quoting numbers that conflict between planning, ERP and working files.",
        options: std([
          "No reconciliation; agents could read any source.",
          "Reconciliation done manually outside the platform; not enforced for AI surfaces.",
          "Reconciliation rules exist for one or two accounts; gaps not surfaced.",
          "Reconciliation runs for most FP&A entities; breaks are reported but agents still see unreconciled data.",
          "Reconciliation gates the gold layer; agents only see reconciled FP&A facts.",
          "Continuous reconciliation with auto-explained variances surfaced as grounded context to the agent.",
        ]),
      },
    ],
  },
  {
    id: "processing",
    name: "Data Processing",
    short: "Processing",
    icon: "Cpu",
    color: "oklch(0.60 0.20 30)",
    description: "Reusable transformation patterns inside Fabric (notebooks, pipelines, dataflows) including SCD Type 2, technical metadata, and natural keys.",
    questions: [
      {
        id: "proc-1",
        text: "Do you have reusable Fabric notebooks (or equivalent templates) to implement SCD Type 2 across your dimensional models?",
        relevance: "SCD Type 2 preserves history that AI agents need for time-aware reasoning (e.g. 'what did this customer look like 6 months ago').",
        options: std([
          "No SCD logic in place; dimensions are overwritten.",
          "SCD is hand-coded per table.",
          "A prototype reusable notebook exists for one or two dimensions.",
          "A reusable SCD2 notebook is used across most dimensions but with variation.",
          "Standardised SCD2 framework applied enterprise-wide and governed.",
          "Metadata-driven SCD2: change behaviour is declared per attribute and the framework applies it automatically.",
        ]),
      },
      {
        id: "proc-2",
        text: "Do you maintain technical metadata that explicitly identifies the natural keys used to detect change for each entity?",
        relevance: "Without documented natural keys, SCD2 and merge logic cannot be parameterised, and AI features built on those entities risk silent drift.",
        options: std([
          "No technical metadata; keys are tribal knowledge.",
          "Some keys are documented in spreadsheets.",
          "A central catalog records natural keys for a few entities.",
          "Most entities have natural keys captured in a metadata store but not enforced.",
          "Natural keys are mandatory metadata for any entity onboarded; enforced in CI.",
          "Natural keys are versioned, lineage-aware and consumed directly by the SCD2 / merge framework.",
        ]),
      },
      {
        id: "proc-3",
        text: "How standardised are your medallion (Bronze / Silver / Gold) layers in OneLake?",
        relevance: "A clean medallion architecture is what AI agents (Copilot Studio, Foundry) consume — inconsistency leads to wrong answers.",
        options: std([
          "No medallion structure.",
          "Medallion exists in name only; layers are inconsistent.",
          "Bronze and Silver are reasonably defined; Gold is ad-hoc.",
          "Medallion is documented and followed for new work but legacy varies.",
          "Medallion is enforced enterprise-wide with naming, schemas and contracts.",
          "Layer contracts are versioned and consumed via certified semantic models for AI.",
        ]),
      },
      {
        id: "proc-4",
        text: "Are vector embeddings, chunking strategies and refresh pipelines for unstructured content standardised and reusable across agents?",
        relevance: "Foundry IQ / Fabric IQ agents depend on consistent chunking and embeddings. Ad-hoc embedding pipelines produce inconsistent retrieval quality across agents.",
        options: std([
          "No embedding pipelines exist.",
          "Embeddings generated ad-hoc per pilot.",
          "A reusable notebook exists for one content type.",
          "Standard chunking + embedding patterns used for several agents.",
          "Enterprise embedding framework with versioned models and incremental refresh.",
          "Metadata-driven embedding factory: chunking, model, refresh and eval declared per content set and auto-deployed.",
        ]),
      },
      {
        id: "proc-5",
        text: "Is data lineage captured end-to-end (source → bronze → silver → gold → semantic model → agent) and visible in Purview / Fabric?",
        relevance: "Agent 365 governance, impact analysis and trust in AI outputs require full lineage from raw source to the agent surface.",
        options: std([
          "No lineage captured.",
          "Lineage exists in tribal knowledge / diagrams.",
          "Pipeline-level lineage in Fabric only.",
          "Lineage in Purview for most pipelines and semantic models.",
          "End-to-end lineage including agent grounding sources, governed in Purview.",
          "Lineage feeds automated impact analysis and notifies agent owners on upstream changes.",
        ]),
      },
      {
        id: "proc-6",
        text: "Are PII / sensitive fields detected, masked or tokenised during processing before reaching layers consumed by AI agents?",
        relevance: "Copilot, Foundry and M365 agents may inadvertently surface PII. Masking at processing time is a key control before Agent 365 access policies apply.",
        options: std([
          "No PII handling.",
          "PII is sometimes removed manually.",
          "Masking applied to a few known fields.",
          "PII detection + masking applied to most certified datasets.",
          "Enterprise PII framework with policy-driven masking aligned to sensitivity labels.",
          "Dynamic masking / tokenisation driven by Purview labels and the consuming agent's clearance.",
        ]),
      },
    ],
  },
  {
    id: "consumption",
    name: "Data Consumption",
    short: "Consumption",
    icon: "Sparkles",
    color: "oklch(0.55 0.20 290)",
    description: "Readiness of the consumption layer (semantic models, ontology, APIs) to be safely surfaced to AI agents in Copilot Studio and Microsoft Foundry.",
    questions: [
      {
        id: "con-1",
        text: "Do you have an ontology / semantic layer that defines business entities, relationships and metrics for AI consumption?",
        relevance: "AI agents need a shared semantic vocabulary to answer business questions consistently. Without an ontology, agents return inconsistent or wrong answers.",
        options: std([
          "No semantic or ontology layer exists.",
          "Definitions live in dashboards and spreadsheets; inconsistent.",
          "A semantic model exists for one domain (e.g. Finance).",
          "Multiple semantic models exist but not a unified ontology.",
          "An enterprise semantic layer / ontology covers core domains and is governed.",
          "Ontology is the single source of truth, queryable by agents with grounded retrieval.",
        ]),
      },
      {
        id: "con-2",
        text: "Are certified Power BI / Direct Lake semantic models available for AI agents to ground on?",
        relevance: "Copilot and Foundry agents perform best when grounded on certified, well-modelled datasets rather than raw tables.",
        options: std([
          "No certified models.",
          "Some models exist but none are certified or curated for AI.",
          "A few certified models exist but not aligned to AI use cases.",
          "Certified models cover most domains; AI grounding is being piloted.",
          "Certified Direct Lake models are the standard surface for agents.",
          "Models are continuously evaluated against AI quality metrics and re-certified.",
        ]),
      },
      {
        id: "con-3",
        text: "Are business-friendly descriptions, synonyms and glossary terms attached to fields/measures for natural language Q&A?",
        relevance: "Copilot relies on descriptions and synonyms to map user language to the correct fields. Missing metadata = missed or wrong answers.",
        options: std([
          "No descriptions or synonyms.",
          "Some fields have descriptions; coverage is patchy.",
          "Core measures have descriptions; synonyms are missing.",
          "Most fields have descriptions and some synonyms; not enforced.",
          "Descriptions and synonyms are mandatory and reviewed; glossary is integrated.",
          "Glossary, synonyms and descriptions are auto-validated against agent eval suites.",
        ]),
      },
      {
        id: "con-4",
        text: "Are Fabric IQ data agents and / or Foundry IQ knowledge sources configured so that AI agents can retrieve grounded context?",
        relevance: "Fabric IQ exposes Fabric data to agents; Foundry IQ provides indexed knowledge. Without these, Copilot Studio / Foundry agents cannot reliably ground on enterprise data.",
        options: std([
          "Neither Fabric IQ nor Foundry IQ is configured.",
          "Awareness only; no agents wired to enterprise data.",
          "One pilot agent grounded on a single Fabric IQ dataset or Foundry IQ index.",
          "Several agents grounded on Fabric IQ / Foundry IQ for selected domains.",
          "Standard pattern: every certified domain exposes a Fabric IQ data agent and Foundry IQ index.",
          "Agents dynamically discover and compose Fabric IQ + Foundry IQ sources via a governed registry.",
        ]),
      },
      {
        id: "con-5",
        text: "Are M365 Copilot / Work IQ connectors configured so agents can reason over Teams, SharePoint, Outlook and Loop content with the right scoping?",
        relevance: "M365 agents using Work IQ depend on properly scoped Graph connectors and content sources. Misconfiguration causes oversharing or missing context.",
        options: std([
          "No M365 / Work IQ connectors configured.",
          "Default Copilot only; no custom connectors.",
          "A few Graph connectors configured for one team.",
          "Multiple connectors for several business areas; scoping reviewed manually.",
          "Enterprise pattern for Work IQ connectors with scoping aligned to sensitivity labels.",
          "Connectors are governed centrally, auto-scoped by label/ownership and audited continuously.",
        ]),
      },
      {
        id: "con-6",
        text: "Are agent prompts, tools and grounding sources versioned, evaluated and promoted through a controlled lifecycle?",
        relevance: "Agents in Copilot Studio and Foundry must be treated as products: changes to prompts, tools or grounding can degrade quality and leak data.",
        options: std([
          "Prompts and tools are edited live in production.",
          "Some agents are exported manually as backups.",
          "Versioning exists for one or two agents.",
          "Most agents are version-controlled; eval is informal.",
          "All agents follow a release lifecycle with eval suites before promotion.",
          "Continuous eval: regressions in grounding or accuracy block promotion automatically.",
        ]),
      },
    ],
  },
  {
    id: "quality",
    name: "Data Quality",
    short: "Quality",
    icon: "ShieldCheck",
    color: "oklch(0.62 0.16 155)",
    description: "Profiling, rules, monitoring and remediation processes that ensure data feeding AI workloads is fit-for-purpose.",
    questions: [
      {
        id: "dq-1",
        text: "Do you have data quality rules (completeness, uniqueness, validity, freshness) defined and executed against data feeding AI?",
        relevance: "AI hallucinations and bad recommendations often trace back to silent data-quality issues.",
        options: std([
          "No DQ rules.",
          "Rules exist informally for a few critical tables.",
          "DQ rules are coded inside pipelines for some entities.",
          "A DQ tool / framework is used for several domains; coverage is partial.",
          "Enterprise DQ framework covers all certified datasets with SLAs.",
          "DQ rules are versioned, executed at every layer, and AI surfaces are blocked if quality SLAs are breached.",
        ]),
      },
      {
        id: "dq-2",
        text: "Are data quality results monitored, alerted on and visible to data owners?",
        relevance: "Quality must be observable and actionable, not buried in logs.",
        options: std([
          "No DQ monitoring.",
          "Logs exist but no one watches them.",
          "A basic DQ dashboard exists for one or two domains.",
          "Dashboards exist; alerts are partially in place.",
          "Centralised DQ scorecards with alerting are in place per domain.",
          "Anomaly detection on DQ metrics with auto-tickets to the data owner.",
        ]),
      },
      {
        id: "dq-3",
        text: "Is there a defined remediation process when data quality issues are detected?",
        relevance: "Detection without remediation produces alert fatigue and erodes trust in AI outputs.",
        options: std([
          "No remediation process.",
          "Issues are fixed reactively when business complains.",
          "Issues are tracked in a backlog by the engineering team.",
          "A documented process exists; SLAs are loose.",
          "Remediation SLAs by severity are enforced for all certified datasets.",
          "Closed-loop remediation: rules, fixes and root-cause are tracked end-to-end.",
        ]),
      },
      {
        id: "dq-4",
        text: "Is duplicate detection and entity resolution (golden records / MDM) in place for the entities consumed by agents (customer, product, employee)?",
        relevance: "Agents that see duplicates or unresolved entities give contradictory answers. Golden records are foundational for trustworthy AI responses.",
        options: std([
          "No de-duplication or MDM.",
          "Manual de-duping in spreadsheets.",
          "De-duplication logic in selected pipelines.",
          "MDM exists for one or two domains.",
          "Enterprise MDM with golden records for all core entities.",
          "Real-time entity resolution surfaced through Fabric IQ for agents.",
        ]),
      },
      {
        id: "dq-5",
        text: "Is the quality and groundedness of unstructured content used by agents (documents, knowledge articles) actively curated?",
        relevance: "Foundry IQ / Work IQ agents will faithfully retrieve outdated, duplicate or contradictory documents. Curating the corpus is a data-quality activity.",
        options: std([
          "No curation; all documents are indexed.",
          "Owners occasionally clean up SharePoint.",
          "A pilot index has a curated content set.",
          "Curation guidelines exist; partially followed.",
          "Content owners certify documents for AI use; stale content is removed automatically.",
          "Continuous content evaluation: low-quality / contradictory documents are flagged and excluded from grounding.",
        ]),
      },
      {
        id: "dq-6",
        text: "Are AI agent outputs evaluated against quality metrics (groundedness, accuracy, harmful content) and fed back into data quality fixes?",
        relevance: "Agent eval signals are the most direct measure of data readiness. Without feedback loops, root-cause data issues stay invisible.",
        options: std([
          "No agent output evaluation.",
          "Ad-hoc spot checks by developers.",
          "Manual eval for one agent in pilot.",
          "Standard eval harness used at release for several agents.",
          "Continuous evals tied back to data owners with remediation SLAs.",
          "Agent telemetry drives auto-tickets to source data owners with root-cause links.",
        ]),
      },
    ],
  },
  {
    id: "governance",
    name: "Data Governance",
    short: "Governance",
    icon: "Lock",
    color: "oklch(0.50 0.15 145)",
    description: "Security, ownership, classification and stewardship in Microsoft Purview — including roles required for AI grounding and DLP.",
    questions: [
      {
        id: "gov-1",
        text: "Are data ownership and stewardship roles defined and assigned in Microsoft Purview for the datasets that will feed AI?",
        relevance: "AI access decisions need an accountable owner. Without owners, sensitive data ends up grounded into agents without approval.",
        options: std([
          "No owners or stewards defined.",
          "Owners exist informally for a few datasets.",
          "Owners are recorded in Purview for some critical assets.",
          "Most certified datasets have owners and stewards in Purview.",
          "Owners and stewards are mandatory and reviewed; coverage is enterprise-wide.",
          "Ownership drives automated access workflows for AI grounding requests.",
        ]),
      },
      {
        id: "gov-2",
        text: "Is sensitive data classified and labelled in Purview (sensitivity labels, data classifications)?",
        relevance: "Classification and labelling drive DLP and Copilot's ability to honour 'do not ground on this data' decisions.",
        options: std([
          "No classification.",
          "Manual tagging on a few assets.",
          "Auto-classification piloted on selected sources.",
          "Most sources are scanned and classified; labels are mostly correct.",
          "Enterprise classification + sensitivity labels are applied and enforced.",
          "Labels propagate end-to-end (lake → semantic model → Copilot) and drive access decisions automatically.",
        ]),
      },
      {
        id: "gov-3",
        text: "Are access controls (RLS, OLS, workspace permissions) implemented and aligned to least-privilege for AI consumers?",
        relevance: "Copilot inherits the user's permissions — over-permissioned datasets cause oversharing through AI.",
        options: std([
          "Permissions are broad; no RLS/OLS.",
          "Some workspaces have basic permissions.",
          "RLS exists for one or two key models.",
          "RLS/OLS implemented across most certified models; reviewed periodically.",
          "Least-privilege enforced enterprise-wide with periodic access reviews.",
          "Just-in-time access + automated reviews driven by sensitivity labels and ownership.",
        ]),
      },
      {
        id: "gov-4",
        text: "Is there a central agent registry (Microsoft Agent 365) recording every agent, its owner, purpose, data sources, tools and risk tier?",
        relevance: "Agent 365 Registry is the control plane for governing all Copilot Studio, Foundry and M365 agents. Without a registry, shadow agents proliferate and access cannot be governed.",
        options: std([
          "No registry; agents are built ad-hoc.",
          "An informal list of agents in a spreadsheet.",
          "A pilot registry exists for one team.",
          "Most production agents are registered with owner and purpose.",
          "Agent 365 Registry is mandatory for all agents enterprise-wide.",
          "Registry is the source of truth and gates deployment, access, monitoring and decommissioning.",
        ]),
      },
      {
        id: "gov-5",
        text: "Are access control policies for agents centrally defined and enforced through Microsoft Agent 365 (identity, scopes, data sources, tools)?",
        relevance: "Agent 365 Access Control ensures the agent can only act on the data and tools its caller is entitled to. Policies must be applied at the agent, source, tool and user level.",
        options: std([
          "No central policy; each agent configures its own access.",
          "Workspace-level permissions only.",
          "Some agents use Entra app roles for scoping.",
          "Most agents inherit caller identity; tool scopes reviewed.",
          "Agent 365 policies enforce identity, data scope and tool access for all agents.",
          "Adaptive, risk-based policies (label, sensitivity, location, role) applied at runtime to every agent invocation.",
        ]),
      },
      {
        id: "gov-6",
        text: "Are agent activity, prompts, tool calls and grounded sources logged and visualised for security and compliance monitoring?",
        relevance: "Agent 365 Visualization / observability is required to detect oversharing, prompt injection, policy violations and data exfiltration through agents.",
        options: std([
          "No agent telemetry collected.",
          "Basic Copilot usage logs reviewed occasionally.",
          "Logs exist for one agent; no central view.",
          "Centralised dashboards for several agents; alerting partial.",
          "Agent 365 visualisation in place enterprise-wide with SOC integration.",
          "Real-time anomaly detection on agent behaviour with auto-response (suspend agent, revoke tool).",
        ]),
      },
      {
        id: "gov-7",
        text: "Is interoperability between agents, tools and data sources (Fabric IQ, Foundry IQ, M365, third-party) governed via standards (OAuth scopes, MCP, Graph connectors)?",
        relevance: "Agents increasingly call other agents and tools. Interoperability standards govern how identity, scope and data flow between them safely.",
        options: std([
          "No interoperability standards.",
          "Agents call tools with shared secrets / service accounts.",
          "OAuth used for some integrations.",
          "Standard patterns (OAuth on-behalf-of, MCP, Graph) used for most integrations.",
          "All agent-to-agent and agent-to-tool calls follow enterprise interop standards governed centrally.",
          "Interop is policy-driven via Agent 365: scopes, tools and downstream calls validated at runtime.",
        ]),
      },
      {
        id: "gov-8",
        text: "Are security controls for agents (prompt injection defence, content filters, data exfiltration prevention, jailbreak monitoring) implemented and tested?",
        relevance: "Agent 365 Security covers the agent-specific threat model. Standard data security is necessary but not sufficient for AI agents.",
        options: std([
          "No agent-specific security controls.",
          "Default Azure OpenAI / Foundry content filters only.",
          "Some agents tested against basic jailbreaks.",
          "Standard prompt-shield + content filters applied to most agents.",
          "Enterprise security baseline (prompt shields, XPIA, DLP, exfiltration controls) applied to all agents.",
          "Continuous red-teaming + adaptive defences governed via Agent 365 with SOC playbooks.",
        ]),
      },
    ],
  },
  {
    id: "cicd",
    name: "Code Promotion (CI/CD)",
    short: "CI/CD",
    icon: "GitBranch",
    color: "oklch(0.55 0.18 35)",
    description: "Promotion of Fabric artefacts (notebooks, pipelines, semantic models, agents) from Dev → Test → Prod using Azure DevOps or Fabric deployment pipelines.",
    questions: [
      {
        id: "cicd-1",
        text: "What tools do you use to promote Fabric / data artefacts across environments (Dev → Test → Prod)?",
        relevance: "AI use cases require repeatable, auditable releases of data + agent artefacts. Manual promotion blocks scale.",
        options: std([
          "Manual copy/paste between workspaces.",
          "Some artefacts exported/imported manually with no source control.",
          "Fabric deployment pipelines used for some workspaces.",
          "Azure DevOps + Git integration used for most artefacts; some manual steps remain.",
          "Full Azure DevOps CI/CD with Fabric Git integration for all artefact types, gated approvals.",
          "Fully automated trunk-based CI/CD with policy-as-code, automated tests and rollbacks.",
        ]),
      },
      {
        id: "cicd-2",
        text: "Are notebooks, pipelines and semantic models stored in source control (Git) with branching strategy?",
        relevance: "Source control is the baseline for reviewable, reversible changes in an AI-grade platform.",
        options: std([
          "Nothing is in Git.",
          "Some notebooks are in Git ad-hoc.",
          "Most notebooks are in Git; pipelines and models are not.",
          "All artefacts in Git with a branching strategy; not always followed.",
          "Branching strategy and PR reviews enforced enterprise-wide.",
          "Trunk-based development with automated quality gates and preview environments.",
        ]),
      },
      {
        id: "cicd-3",
        text: "Are automated tests (unit / integration / data tests) executed in your CI/CD pipeline before promotion?",
        relevance: "Tests catch regressions in data contracts that would silently break grounded AI agents.",
        options: std([
          "No automated tests.",
          "A few unit tests exist locally.",
          "Some unit tests run in CI for selected notebooks.",
          "Unit + basic data tests run in CI for most artefacts.",
          "Comprehensive test pyramid (unit, integration, data contract) gates every promotion.",
          "Tests include AI-eval suites that validate downstream agent quality before release.",
        ]),
      },
      {
        id: "cicd-4",
        text: "Are Copilot Studio / Foundry agent definitions (prompts, tools, knowledge sources, connectors) deployed via CI/CD rather than hand-edited per environment?",
        relevance: "Agents are now first-class artefacts. Promoting them via CI/CD is required for repeatability, audit and rollback.",
        options: std([
          "Agents are built and edited directly in Prod.",
          "Agents are exported manually between environments.",
          "Some agents have an export / import script.",
          "Most agents are deployed via pipelines; some manual steps remain.",
          "All agents (Copilot Studio, Foundry, M365) deployed through CI/CD with approvals.",
          "Agent definitions, evals and policies deployed as code with automated rollback on regression.",
        ]),
      },
      {
        id: "cicd-5",
        text: "Are environments (Dev / Test / Prod) properly isolated for data, identities, agents and secrets?",
        relevance: "Without isolated environments, test agents can read prod data or vice-versa, breaking governance and Agent 365 access policies.",
        options: std([
          "Single environment for everything.",
          "Dev and Prod exist but share data / identities.",
          "Separate workspaces; secrets sometimes shared.",
          "Isolated environments for most workloads; some exceptions.",
          "Strict isolation for data, identities, agents and secrets across all environments.",
          "Ephemeral preview environments per change with synthetic / masked data and scoped agents.",
        ]),
      },
      {
        id: "cicd-6",
        text: "Are agent evaluation suites (groundedness, accuracy, safety, regression) run automatically as a release gate before promoting to Prod?",
        relevance: "AI-grade CI/CD requires AI-grade quality gates. Without automated agent evals, regressions in data or prompts ship straight to users.",
        options: std([
          "No agent evals.",
          "Manual eval before some releases.",
          "Eval scripts exist but run on demand.",
          "Eval runs in CI for selected agents.",
          "Eval suite is a mandatory release gate for all agents.",
          "Evals tied to production telemetry, with auto-rollback when groundedness/safety drops.",
        ]),
      },
    ],
  },
];

export const TOTAL_QUESTIONS = DIMENSIONS.reduce((s, d) => s + d.questions.length, 0);
