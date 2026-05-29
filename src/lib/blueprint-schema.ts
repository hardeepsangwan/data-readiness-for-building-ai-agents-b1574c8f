// Shared types for the executable Data Blueprint.
// Business users enter their AS-IS process, data assets, DQ scores and
// Data Hive answers; the LLM returns per-step recommendations and an
// aggregate gap analysis vs the hub-and-spoke target TOM.

export type AutomationClass =
  | "RETAIN"
  | "OPTIMISE"
  | "AUTOMATE+HUMAN"
  | "AUTOMATE FULL"
  | "CONTROL";

export type HubSpoke = "Hub" | "Spoke" | "Shared";

export type DataHiveStatus = "None" | "Bronze" | "Silver" | "Gold";

export type RAG = "Red" | "Amber" | "Green";

export interface ProcessStep {
  id: string; // e.g. BS-01
  stepNumber: number;
  subProcess: string; // e.g. "Budget Setting"
  description: string;
  role: string;
  systemTool: string; // becomes a Data Asset row in WS3-A
  dataInput: string;
  dataOutput: string;
  time: string;
  frequency: string;
  painPoint: boolean;
  painPointDescription: string;
  automationOpportunity: AutomationClass | "";
  priority: "H" | "M" | "L" | "";
  dataAssetRef: string; // DA-xx
}

export interface DataAsset {
  id: string; // DA-01..
  source: string; // pre-filled from steps
  domain: string;
  entities: string;
  accessMethod: string;
  businessOwner: string;
  technicalOwner: string;
  refresh: string;
  pii: boolean;
  dataHiveStatus: DataHiveStatus;
  bronzeFit: RAG | "";
  silverFit: RAG | "";
  goldFit: RAG | "";
  overallRag: RAG | "";
  notes: string;
}

export interface DataQualityScore {
  assetId: string;
  completeness: number; // 1-5
  accuracy: number;
  consistency: number;
  timeliness: number;
  uniqueness: number;
  validity: number;
  evidence: string;
}

export interface DataHiveAnswers {
  ingestionPath: string;
  ownershipModel: string;
  semanticLayer: string;
  agentRetrieval: string;
  governanceAccess: string;
  observability: string;
}

export interface TargetTOM {
  hubCapabilities: string;
  spokeOwnership: string;
  handshakes: string;
  controls: string;
  successMetrics: string;
}

export interface ProcessContext {
  organisation: string;
  businessFunction: string;
  businessProcess: string;
  sponsor: string;
  cycleVolume: string;
  baselineEffort: string;
  timeline: string;
  // Critical inputs to ensure the blueprint speaks to Operations / Value / Governance
  valueDrivers: string;        // operational pain & opportunity (efficiency, cycle time, risk, revenue)
  kpis: string;                // value metrics the blueprint must move
  complianceConstraints: string; // regulatory / data residency / sensitivity / retention
  decisionsSupported: string;  // key business decisions / questions the data + AI must answer
}

// ── LLM output ──────────────────────────────────────────────────────────────

export interface StepRecommendation {
  stepId: string;
  classification: AutomationClass;
  dataAiIntervention: string;
  hubSpoke: HubSpoke;
  requiredAssets: string[]; // DA refs
  dqUplifts: string[];
  governance: string;
  rationale: string;
}

export interface GapEntry {
  id: string; // G-01..
  description: string;
  dimension: "Process" | "Data" | "Technology" | "People" | "Governance";
  classification: "BLOCKER" | "CONDITIONAL" | "WATCH";
  asIsRef: string;
  impact: string;
  remediation: string;
  owner: string;
  priority: "H" | "M" | "L";
}

export interface UseCaseBacklog {
  id: string;
  name: string;
  businessImpact: number;
  desirability: number;
  feasibility: number;
  total: number;
  solutionType: string;
  dataReadiness: RAG;
}

export interface HubSpokeActivity {
  id: string;
  pillar: "Hub" | "Spoke" | "Handshake";
  activity: string;
  description: string;
  owner: string;
  sequence: number;
}

export interface RadarAxis {
  axis: string;
  current: number; // 0-5
  target: number;
}

export interface BlueprintResult {
  generatedAt: string;
  model: string;
  executiveSummary: string;
  stepRecommendations: StepRecommendation[];
  gapRegister: GapEntry[];
  useCaseBacklog: UseCaseBacklog[];
  hubSpokeActivities: HubSpokeActivity[];
  radar: RadarAxis[]; // 6 axes
}
