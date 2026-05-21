// Shared types for AI-generated assessment findings.
// Produced by the reasoning model (Lovable AI Gateway) from the user's
// open-text + maturity self-ratings, scoped to one workstream at a time.

export interface AiDimension {
  name: string;          // full dimension name (no truncation)
  currentScore: number;  // 0..5
  targetScore: number;   // 0..5
  rationale: string;     // why the model scored it this way
}

export interface AiPainPoint {
  id: string;              // "P1", "P2", ...
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  affectedDimensions: string[]; // dimension names
  evidence: string;        // quoted/paraphrased from the user's answers
}

export interface AiAction {
  id: string;              // "A1", ...
  title: string;
  addressesPainPoints: string[]; // ["P1","P3"]
  cafPillar: string;       // e.g. "CAF · Govern & Secure"
  owner: string;           // suggested owner role
  effort: "S" | "M" | "L";
  steps: string[];         // 3-6 prescriptive steps grounded in Azure CAF
}

export interface AiWorkstreamResult {
  workstreamId: string;
  summary: string;         // 2-4 sentence exec summary
  dimensions: AiDimension[];
  painPoints: AiPainPoint[];
  actions: AiAction[];
  generatedAt: string;     // ISO timestamp
  model: string;
}

export interface ProcessContext {
  organisation: string;
  businessFunction: string;   // e.g. "Finance & FP&A"
  businessProcess: string;    // e.g. "Service Charge Accounting"
  executiveSponsor: string;
  inScopeSystems: string;     // free text list
  successDefinition: string;
  timeline: string;
}
