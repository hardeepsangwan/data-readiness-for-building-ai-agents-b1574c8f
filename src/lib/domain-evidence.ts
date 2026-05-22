// Domain evidence — seed findings derived from the user-supplied
// "Data_Blueprint_Framework_FPA_ServiceCharge" + "Data_Blueprint_Assessment_Templates"
// workbooks. When the assessment context matches a known business function /
// process, this evidence is passed to the AI reasoning model as
// additional grounded context so its pain points and next-best actions
// cite the *actual* findings from the source workbooks (not generic
// boilerplate).
//
// Add a new entry per (function, process, workstream) trio as more
// processes are onboarded. Keys are matched case-insensitively against
// the user-supplied Process Context.

export interface DomainEvidenceEntry {
  workstreamId: string; // coe | bt | db | af
  title: string;
  bullets: string[];
}

export interface DomainEvidencePack {
  functionMatch: RegExp;   // matches context.businessFunction
  processMatch: RegExp;    // matches context.businessProcess
  source: string;          // human-readable source name shown to the AI
  entries: DomainEvidenceEntry[];
}

// ──────────────────────────────────────────────────────────────────────
// FP&A × Service Charge (Indurent reference workbooks)
// ──────────────────────────────────────────────────────────────────────
const FPA_SERVICE_CHARGE: DomainEvidencePack = {
  functionMatch: /fp\s*&?\s*a|finance|financial planning/i,
  processMatch: /service\s*charge/i,
  source:
    "Data_Blueprint_Framework_FPA_ServiceCharge.xlsx + Data_Blueprint_Assessment_Templates.xlsx (Indurent reference workbooks)",
  entries: [
    {
      workstreamId: "bt",
      title: "AS-IS process map (Service Charge) — verbatim baseline findings",
      bullets: [
        "Cycle time ~3 working days per monthly cycle; 15 mapped steps SC-01..SC-15.",
        "SC-02/03: F&O export not in usable format — requires copy/paste into Excel every cycle.",
        "SC-04: CRITICAL lineage break — copy/paste of F&O export into Excel tracker; one tab per property.",
        "SC-05: 2-4 hrs manual line-item check against supplier invoices; no automated matching.",
        "SC-06/07: GL code errors occur on EVERY cycle → avg 3 working days of rework, Finance Systems Mgr involvement required.",
        "SC-08/09: Budget pulled from Anaplan / Excel Budget Pack and copy-pasted — lineage to Anaplan lost.",
        "SC-11: Variance exceptions handled by email; no structured workflow, no audit trail.",
        "SC-12: Service charge statements built manually in Excel per property; template inconsistency.",
        "SC-13: FM review/approval via email (1-5 days variable); no workflow, no audit trail.",
      ],
    },
    {
      workstreamId: "bt",
      title: "Signed-off use case backlog (problem-led scoring)",
      bullets: [
        "UC-01 GL Code Validation & Auto-correction Pipeline — score 11/15, Priority 1, Fabric pipeline (NOT agent), AMBER data readiness.",
        "UC-02 Service Charge Statement Draft Generation — score 10/15, Copilot Studio agent, CONDITIONAL on UC-01.",
        "UC-03 Anaplan→Data Hive Budget Integration — score 11/15, Fabric pipeline.",
        "UC-04 FM Approval Workflow — score 11/15, Power Automate (process change first, GREEN data).",
        "UC-05 KPI Dashboard for Service Charge — Power BI, GREEN.",
      ],
    },
    {
      workstreamId: "db",
      title: "Foundations Data — known DQ findings & gaps (Service Charge)",
      bullets: [
        "G-01 BLOCKER: F&O actuals export is manual — no automated Bronze pipeline into Data Hive (OneLake).",
        "G-02 BLOCKER: GL code errors on every cycle → ~3 days rework; no automated GL validation rule in Silver layer; GL master data needs remediation.",
        "G-03 CONDITIONAL: Anaplan budget data not integrated with Data Hive; manual export breaks lineage; reconciliation errors between Anaplan and F&O.",
        "G-05 BLOCKER: No Gold-layer semantic / ontology model for service charge reconciliation — analysts hand-build Excel reconciliations.",
        "G-06 CONDITIONAL: Service charge statement built manually; no template standardisation; high formatting error risk.",
        "G-09 CONDITIONAL: Tenancy data dependency not clearly mapped; service charge scope at risk if tenancy data unreliable.",
        "Data Hive platform = Microsoft Fabric (Bronze/Silver/Gold Medallion in OneLake); Purview for governance.",
        "Ontology layer for FP&A (Property × Tenancy × Cost Centre × Head-of-Expenditure × Budget) does NOT yet exist — required before any grounded agent.",
        "Excel & Anaplan currently host transformation logic that must shift LEFT into Fabric per the target architecture.",
      ],
    },
    {
      workstreamId: "coe",
      title: "Tech CoE — guardrail decisions required for Service Charge",
      bullets: [
        "Outputs sent to tenants MUST have FM approval (HITL checkpoint).",
        "Kill-switch triggers proposed: GL error rate >5%, value anomaly >£X, data freshness >24h.",
        "RICS code of practice for service charges applies — audit trail required for every statement.",
        "EU AI Act and GDPR explicitly in scope; DPIA needed where tenant personal data is processed.",
      ],
    },
    {
      workstreamId: "af",
      title: "Agents Factory — lighthouse agent shape implied by the backlog",
      bullets: [
        "Lighthouse agent = UC-02 Service Charge Statement Draft Generation, built on Copilot Studio.",
        "Hard dependency on UC-01 (GL validation pipeline) and Gold semantic layer (UC handover from Foundations Data).",
        "Must register in Microsoft Agent 365; Entra Agent ID; Defender for Cloud AI monitoring; red-team clearance required before deploy.",
      ],
    },
  ],
};

const PACKS: DomainEvidencePack[] = [FPA_SERVICE_CHARGE];

export interface DomainEvidenceForAi {
  source: string;
  bulletText: string; // pre-formatted text block to include in the AI prompt
}

export function getDomainEvidence(
  context: { businessFunction?: string; businessProcess?: string },
  workstreamId: string,
): DomainEvidenceForAi | null {
  const fn = context.businessFunction || "";
  const pr = context.businessProcess || "";
  for (const pack of PACKS) {
    if (!pack.functionMatch.test(fn) || !pack.processMatch.test(pr)) continue;
    const entries = pack.entries.filter((e) => e.workstreamId === workstreamId);
    if (entries.length === 0) return null;
    const bulletText = entries
      .map((e) => `### ${e.title}\n${e.bullets.map((b) => `- ${b}`).join("\n")}`)
      .join("\n\n");
    return { source: pack.source, bulletText };
  }
  return null;
}
