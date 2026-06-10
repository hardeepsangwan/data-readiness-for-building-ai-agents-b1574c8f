// Seed data extracted from Indurent_DataBlueprint_Workbook_v4.xlsx
// (WS2-B AS-IS Process, WS3-A Data Assets) for the FP&A Service Charge
// process. Loaded via the "Load Service Charge example" button so users
// can see a fully-worked example for any process they document.

import type {
  ProcessStep,
  DataAsset,
  DownstreamAsset,
  DataHiveAnswers,
  TargetTOM,
  ProcessContext,
} from "./blueprint-schema";

export const SERVICE_CHARGE_CONTEXT: ProcessContext = {
  organisation: "Indurent",
  businessFunction: "Finance & FP&A",
  businessProcess: "Service Charge Accounting",
  sponsor: "CFO",
  cycleVolume: "200 properties × annual reconciliation",
  baselineEffort: "~500 FTE hours per cycle (budget pack alone)",
  timeline: "2026 phased delivery; Gate C blockers cleared by Aug 2026",
  valueDrivers: "Cut manual GL reconciliation effort, eliminate Word/Excel/PDF budget-pack assembly, reduce customer disputes from inconsistent allocation, accelerate EOY close.",
  kpis: "FTE hours per cycle; % budget packs produced auto; GL allocation error rate; days to reconcile; customer dispute volume.",
  complianceConstraints: "Tenant-level financial data, lease PII; UK GDPR; audit trail retention 7 years; sensitivity-labelled documents.",
  decisionsSupported: "Annual budget approval per property; year-end reconciliation true-up to customers; variance investigation; cost recoverability assessment.",
};

export const SERVICE_CHARGE_STEPS: ProcessStep[] = [
  { id: "BS-01", stepNumber: 1, subProcess: "Budget Setting", description: "FM/AMs set the budget and communicate it to the customer and the service charge team", role: "FM / Asset Manager", systemTool: "Excel / Email", dataInput: "Property budgets, customer contracts", dataOutput: "Budget communicated to SC team", time: "2-4 weeks", frequency: "8 weeks before year end", painPoint: true, painPointDescription: "", automationOpportunity: "RETAIN", priority: "L", dataAssetRef: "" },
  { id: "BS-02", stepNumber: 2, subProcess: "Budget Setting", description: "Data is entered into F&O manually by SC team", role: "SC Accountant", systemTool: "F&O Cost Allocation", dataInput: "Budget from Excel spreadsheet", dataOutput: "Budget entered in F&O", time: "Variable", frequency: "8 wks before year end", painPoint: true, painPointDescription: "Manual entry — error-prone. Excel → F&O copy-paste.", automationOpportunity: "AUTOMATE+HUMAN", priority: "H", dataAssetRef: "DA-01" },
  { id: "BS-05", stepNumber: 5, subProcess: "Budget Setting", description: "Download voucher transactions from F&O GL (code 500,000)", role: "SC Accountant", systemTool: "F&O — GL module", dataInput: "GL transactions for code 500,000", dataOutput: "GL export (Excel)", time: "30-60 mins", frequency: "Per cycle", painPoint: true, painPointDescription: "Manual download. GL code errors on EVERY cycle.", automationOpportunity: "AUTOMATE FULL", priority: "H", dataAssetRef: "DA-02" },
  { id: "BS-06", stepNumber: 6, subProcess: "Budget Setting", description: "Review that right expenditure is allocated to right GL code", role: "SC Accountant", systemTool: "F&O + Excel", dataInput: "GL export, cost allocation data", dataOutput: "Verified allocation or exception list", time: "1h-0.5 days", frequency: "Per cycle", painPoint: true, painPointDescription: "GL rec process 1h-0.5 days. GL codes wrong on EVERY cycle.", automationOpportunity: "AUTOMATE+HUMAN", priority: "H", dataAssetRef: "DA-01" },
  { id: "BS-15", stepNumber: 15, subProcess: "Budget Setting", description: "Complete Word document template per property — budget pack", role: "Lara + Assistants", systemTool: "Word + Excel + PDF", dataInput: "Budget data, property details", dataOutput: "Budget pack PDF per property", time: "2-2.5 hrs × 200 props", frequency: "Annual", painPoint: true, painPointDescription: "200 properties × 2.5h = 500 FTE hours.", automationOpportunity: "AUTOMATE FULL", priority: "H", dataAssetRef: "DA-03" },
  { id: "RC-01", stepNumber: 1, subProcess: "EOY Reconciliation", description: "Create Occupancy Report: Download from CE + convert with Copilot script", role: "Lara (SC Admin)", systemTool: "CE + Excel + Copilot Script", dataInput: "CE lease export", dataOutput: "Occupancy report in required format", time: "1-2 hrs", frequency: "Annual", painPoint: true, painPointDescription: "CE export in wrong format. Existing Copilot script converts — AI already in use here.", automationOpportunity: "AUTOMATE FULL", priority: "H", dataAssetRef: "DA-10" },
  { id: "TAB-8", stepNumber: 6, subProcess: "EOY Reconciliation", description: "Apportionment Detail — most painful tab: complex SUMIFS across F&O + lease data", role: "SC Accountant", systemTool: "F&O + Excel (complex SUMIFS)", dataInput: "Expense Pools from F&O; lease data; caps", dataOutput: "Tab 8 — Apportionment detail per property", time: "Full day+ per property", frequency: "Annual", painPoint: true, painPointDescription: "Most NB tab — Also most painful tab (verbatim). Complex SUMIFS. Entire day per property.", automationOpportunity: "AUTOMATE+HUMAN", priority: "H", dataAssetRef: "DA-01" },
  { id: "RC-10", stepNumber: 7, subProcess: "EOY Reconciliation", description: "Attach pack to Cases in CE → RFM, AAM, AM review and approve", role: "SC + RFM + AAM + AM", systemTool: "CE (Cases)", dataInput: "Full reconciliation pack", dataOutput: "Case with review/approval", time: "Weeks — untracked", frequency: "Annual", painPoint: true, painPointDescription: "Cannot track how long sitting at each stage (verbatim). No SLA tracking.", automationOpportunity: "AUTOMATE+HUMAN", priority: "H", dataAssetRef: "DA-11" },
];

export const SERVICE_CHARGE_ASSETS: DataAsset[] = [
  { id: "DA-01", source: "F&O — Cost Allocation Actuals (GL Transactions)", domain: "FP&A / Finance", entities: "GL postings, cost lines, property allocations", accessMethod: "Manual export → Excel", businessOwner: "FP&A Manager", technicalOwner: "Finance Systems", refresh: "On demand", pii: false, dataHiveStatus: "None", bronzeFit: "Amber", silverFit: "Red", goldFit: "Red", overallRag: "Amber", notes: "GL code errors on every cycle; export format wrong" },
  { id: "DA-02", source: "F&O — GL Module (voucher transactions)", domain: "Finance", entities: "Voucher headers/lines", accessMethod: "Manual download", businessOwner: "SC Accountant", technicalOwner: "Finance Systems", refresh: "Per cycle", pii: false, dataHiveStatus: "None", bronzeFit: "Amber", silverFit: "Red", goldFit: "Red", overallRag: "Amber", notes: "" },
  { id: "DA-08", source: "F&O — Leases / Prepayment journals", domain: "Finance", entities: "Lease lines, prepayment schedules", accessMethod: "F&O native", businessOwner: "SC Accountant", technicalOwner: "Finance Systems", refresh: "Monthly", pii: false, dataHiveStatus: "None", bronzeFit: "Amber", silverFit: "Red", goldFit: "Red", overallRag: "Amber", notes: "" },
  { id: "DA-09", source: "Anaplan — Budget", domain: "FP&A", entities: "Budget by HoE, scenarios", accessMethod: "Anaplan exports", businessOwner: "FP&A Manager", technicalOwner: "FP&A Systems", refresh: "Variable", pii: false, dataHiveStatus: "None", bronzeFit: "Red", silverFit: "Red", goldFit: "Red", overallRag: "Red", notes: "Sometimes stale — no Data Hive integration" },
  { id: "DA-10", source: "CE (Customer Engagement) — Lease/Occupancy", domain: "Property", entities: "Leases, occupancy, tenants", accessMethod: "CE export + Copilot script", businessOwner: "Asset Mgmt", technicalOwner: "ICT", refresh: "Per cycle", pii: true, dataHiveStatus: "None", bronzeFit: "Amber", silverFit: "Red", goldFit: "Red", overallRag: "Amber", notes: "" },
  { id: "DA-11", source: "CE (Cases) — workflow & approvals", domain: "Operations", entities: "Cases, approvals", accessMethod: "CE native", businessOwner: "Ops", technicalOwner: "ICT", refresh: "Real-time", pii: true, dataHiveStatus: "None", bronzeFit: "Amber", silverFit: "Red", goldFit: "Red", overallRag: "Amber", notes: "No SLA tracking on approvals" },
  { id: "DA-14", source: "YAVICA (balancing charge logic)", domain: "Finance", entities: "Balancing charge calculations", accessMethod: "YAVICA UI", businessOwner: "SC Accountant", technicalOwner: "YAVICA vendor", refresh: "Per cycle", pii: false, dataHiveStatus: "None", bronzeFit: "Red", silverFit: "Red", goldFit: "Red", overallRag: "Red", notes: "Logic mismatch with internal calc" },
];

export const SERVICE_CHARGE_DOWNSTREAM: DownstreamAsset[] = [
  { id: "DP-01", name: "Service Charge Actuals (per property)", destination: "Operations Portal", consumerDomain: "Operations", format: "Parquet", deliveryMethod: "Direct Lake / API", refreshCadence: "Monthly", qualityExpectation: "Complete; <1 day lag; no null Cost Centres", dataContractExists: "Planned", targetHiveLayer: "Gold", classification: "Confidential", glossaryTerm: "Service Charge Actuals", dataOwner: "FP&A Manager", dataSteward: "SC Accountant", notes: "Feeds Ops dashboards reconciling actuals vs budget per property." },
  { id: "DP-02", name: "Annual Budget Pack (PDF + data)", destination: "Customer Portal / Asset Management", consumerDomain: "Property / Customer Comms", format: "PDF + Excel", deliveryMethod: "SharePoint / Email", refreshCadence: "Annual", qualityExpectation: "100% of properties produced before Gate C deadline", dataContractExists: "No", targetHiveLayer: "Gold", classification: "Confidential", glossaryTerm: "Budget Pack", dataOwner: "FP&A Manager", dataSteward: "Lara (SC Admin)", notes: "Currently produced manually in Word/Excel — target is auto-generation from Gold." },
  { id: "DP-03", name: "GL Reconciliation Exceptions", destination: "Finance Shared Services", consumerDomain: "Finance", format: "Excel / Power BI", deliveryMethod: "Power Automate workflow", refreshCadence: "Per cycle", qualityExpectation: "All GL code mismatches flagged within 1 day of GL export", dataContractExists: "Planned", targetHiveLayer: "Silver", classification: "Internal", glossaryTerm: "GL Exception", dataOwner: "FP&A Manager", dataSteward: "SC Accountant", notes: "Drives the GL rec review step (BS-06)." },
];

export const DEFAULT_TARGET_TOM: TargetTOM = {
  hubCapabilities: [
    "Central Data & AI Centre of Excellence (CoE) owns ingestion from source systems → Bronze → Silver in Microsoft Fabric / OneLake",
    "Microsoft Purview is the governance, cataloguing, sensitivity-labelling and lineage layer across all domains",
    "Microsoft Agent 365 monitors, registers and audits ALL AI agents across the organisation",
    "CoE provides and operates the shared AI agent platform: Azure AI Foundry + Microsoft Copilot Studio",
    "CoE explores Data Mesh on Azure as the longer-term federated ownership model alongside hub-and-spoke",
  ].join("\n"),
  spokeOwnership: [
    "Each business domain (Finance, Legal, HR, FP&A, etc.) has its own dedicated Fabric workspace",
    "Domains read curated, conformed data from the Silver layer in OneLake (read-only access to the shared estate)",
    "Domains build and own their own data products in their workspace: reports, semantic models and AI agents",
    "Domain AI agents are built using Azure AI Foundry and Copilot Studio, then registered with Agent 365 for monitoring",
    "Domains own business rules, KPIs, source-of-truth definitions and HITL approvals for their data products",
  ].join("\n"),
  handshakes: [
    "CoE → Domain: Bronze/Silver data contracts (schema, freshness SLAs, DQ thresholds) published via Purview catalogue",
    "Domain → CoE: new source systems, agents and data products are registered centrally (Purview catalogue + Agent 365)",
    "Shared backlog: CoE builds and operates platform capability (ingestion, OneLake, Purview, Agent 365, Foundry/Copilot Studio); domains prioritise and build their own use cases on top",
    "Data Mesh evaluation: joint CoE + domain working group to assess moving to federated data product ownership on Azure",
  ].join("\n"),
  controls: [
    "Microsoft Purview enforces sensitivity labelling, access policies and lineage across Bronze/Silver/Gold",
    "Microsoft Agent 365 provides centralised monitoring, audit logging and replay of every AI agent's actions",
    "Mandatory HITL for any external customer-facing or financial-posting output produced by domain agents",
  ].join("\n"),
  successMetrics: [
    "100% of source-to-Silver ingestion owned and automated by the CoE (no manual domain ETL)",
    "Every AI agent registered and actively monitored in Agent 365 (zero unmonitored agents)",
    "All data assets catalogued and sensitivity-labelled in Purview",
    "Each domain (Finance, Legal, HR, FP&A) self-serving from Silver in OneLake within its own Fabric workspace",
    "Cycle time reduction ≥50%; GL error rate <1% of cost allocation lines",
    "Data Mesh readiness assessment completed with a go/no-go recommendation",
  ].join("\n"),
  dataIngestionApproach: "Centre of Excellence (CoE) owns all ingestion from source systems into Bronze, then conforms data into Silver — all within Microsoft Fabric / OneLake. Business domains never build their own ingestion pipelines; they consume from Silver.",
  computePlatform: "Compute sits entirely inside Microsoft Fabric (Lakehouse, Data Engineering / Spark, Data Pipelines, Warehouse). Each domain runs its compute within its own Fabric workspace against shared OneLake data.",
  storagePlatform: "OneLake is the single, shared storage layer for the whole organisation (Bronze / Silver / Gold). No domain-specific data lakes — all domains read Silver from OneLake into their own Fabric workspace to build Gold-layer data products.",
  dataGovernanceApproach: "Microsoft Purview is the governance platform: data catalogue, lineage, sensitivity labelling and access policies across Bronze/Silver/Gold and across all domain workspaces. Microsoft Agent 365 governs AI agents specifically — registration, monitoring and audit of every agent in use.",
  personaInteractions: [
    "Personas are defined per business domain using the pattern DH-[Domain]-<Role>, e.g. DH-Finance-DataOwner, DH-Legal-DataSteward, DH-HR-Analyst, DH-FPA-Champion:",
    "  • DH-[Domain]-DataOwner — accountable for the domain's data products and quality",
    "  • DH-[Domain]-DataSteward — day-to-day data quality, definitions and Purview metadata curation",
    "  • DH-[Domain]-Analyst — builds reports / semantic models from Silver in the domain's Fabric workspace",
    "  • DH-[Domain]-Champion — drives adoption and best practice within the domain",
    "  • DH-[Domain]-AgentUser — consumes AI agents built in Copilot Studio / Azure AI Foundry, monitored via Agent 365",
    "  • DH-[Domain]-DataContract-[Consumer] — represents a downstream consumer's data contract with the domain",
    "  • DH-[Domain]-DataEngineer — builds/maintains Fabric pipelines, Lakehouse and semantic models for the domain",
    "  • DH-[Domain]-DataScientist — builds models and AI agent logic in Azure AI Foundry for the domain",
  ].join("\n"),
  architecturePattern: "Hub-and-spoke medallion architecture on Microsoft Fabric / OneLake today (CoE hub owns Bronze→Silver; domain spokes own Silver→Gold and their data products), with Data Mesh on Azure being evaluated as the longer-term federated model for domain-owned data products and contracts.",
  targetPlatformDetails: "Domains in scope for dedicated Fabric workspaces: Finance, Legal, HR, FP&A (extensible to others). AI agents are built with Azure AI Foundry and Microsoft Copilot Studio and centrally monitored via Microsoft Agent 365. Microsoft Purview underpins governance across the whole estate. Data Mesh on Azure is under evaluation alongside this hub-and-spoke model.",
};

export const DEFAULT_DATA_HIVE_ANSWERS: DataHiveAnswers = {
  ingestionPath: "",
  ownershipModel: "",
  semanticLayer: "",
  agentRetrieval: "",
  governanceAccess: "",
  observability: "",
};

export const DATA_HIVE_PROMPTS: { key: keyof DataHiveAnswers; label: string; help: string }[] = [
  { key: "ingestionPath", label: "Ingestion to Data Hive (Fabric)", help: "How would source systems land into Bronze? Pipelines, connectors, frequency, who owns them." },
  { key: "ownershipModel", label: "Hub vs Spoke ownership", help: "Which capabilities should sit centrally vs in the business domain? Where are the seams?" },
  { key: "semanticLayer", label: "Semantic / ontology layer", help: "What business entities and relationships must be modelled in Gold to give context to agents?" },
  { key: "agentRetrieval", label: "Agent retrieval pattern", help: "How will agents retrieve grounded context — Foundry IQ, Fabric IQ, custom RAG, structured queries?" },
  { key: "governanceAccess", label: "Governance & access", help: "Purview cataloguing, Entra Agent ID, RBAC, sensitivity labelling, audit." },
  { key: "observability", label: "Observability & DQ monitoring", help: "How will you detect freshness/quality breaches and agent drift? Who is paged?" },
];
