// Seed data extracted from Indurent_DataBlueprint_Workbook_v4.xlsx
// (WS2-B AS-IS Process, WS3-A Data Assets) for the FP&A Service Charge
// process. Loaded via the "Load Service Charge example" button so users
// can see a fully-worked example for any process they document.

import type {
  ProcessStep,
  DataAsset,
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

export const DEFAULT_TARGET_TOM: TargetTOM = {
  hubCapabilities: [
    "Central Data & AI CoE on Data Hive (Microsoft Fabric / OneLake)",
    "Bronze → Silver → Gold medallion pipelines with data contracts",
    "Semantic / ontology layer powering reuse across domains",
    "Agent platform: Copilot Studio + Foundry IQ / Fabric IQ for retrieval",
    "Data Quality monitoring (Purview + custom DQ rules)",
    "Governance: Purview catalogue, Entra Agent ID, Defender for Cloud AI",
    "MLOps / AgentOps: deployment, evaluation, drift monitoring",
  ].join("\n"),
  spokeOwnership: [
    "Business domain owns process steps, business rules and KPIs",
    "Domain SMEs author data contracts with the Hub",
    "HITL approvals and exception handling stay with the domain",
    "Last-mile reporting & customer comms owned by the domain",
  ].join("\n"),
  handshakes: [
    "Data contracts: schemas, freshness SLAs, DQ thresholds",
    "Power Automate exception workflows with tracked SLAs",
    "Shared backlog: Hub builds platform capability, Spoke prioritises use cases",
    "Joint gate reviews per use case (Gate A/B/C)",
  ].join("\n"),
  controls: [
    "Mandatory HITL for any external customer-facing output",
    "Treasury & journal posting require human authorisation",
    "Agent actions logged and replayable for audit",
  ].join("\n"),
  successMetrics: [
    "Cycle time reduction ≥50%",
    "GL error rate <1% of cost allocation lines",
    "Zero untracked approval queues",
    "100% of customer packs auto-generated from Gold layer",
  ].join("\n"),
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
