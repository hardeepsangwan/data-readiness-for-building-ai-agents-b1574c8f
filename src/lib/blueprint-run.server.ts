// Server-only runner for blueprint generation. Calls the configured Azure
// OpenAI endpoint and returns the structured BlueprintResult.

import type { BlueprintResult } from "./blueprint-schema";

const SYSTEM_PROMPT = `You are a Microsoft Chief Enterprise Data & AI Architect advising on the Data Blueprint. The TARGET STATE platform is Data Hive — built on Microsoft Fabric — with these mandatory patterns:

DATA HIVE TARGET PLATFORM (Microsoft Fabric):
- Ingestion: ALL source systems land in OneLake via REUSABLE INGESTION PATTERNS (parameterised Fabric Data Factory pipelines / Dataflows Gen2 / Mirroring / Shortcuts). No bespoke per-source code; new sources are onboarded by config.
- Processing: REUSABLE DATA PROCESSING FRAMEWORK using Fabric notebooks / Spark with standard SCD Type 1 (overwrite) and SCD Type 2 (history-tracked) merge templates that handle both INITIAL LOAD and INCREMENTAL LOAD into Bronze → Silver.
- Curation: Gold layer modelled as conformed data products (star schema / one-big-table) with business-friendly names and certified measures.
- Ontology / Semantic layer: business ontology published on top of Gold (Fabric semantic model + Purview business glossary + OneLake catalog) so autonomous agents and Copilot get governed context.
- Consumption: Power BI Direct Lake, Copilot in Fabric, Fabric Data Agents / Foundry IQ retrieval over the ontology, APIs over the semantic layer.
- Governance: Microsoft Purview (lineage, classification, sensitivity labels, access policies), Entra Agent ID for agent identity, Defender for Cloud AI, workspace-level RBAC, data contracts between Hub and Spoke.
- Quality: Fabric DQ rules + Purview DQ + observability dashboards; DQ exceptions routed to Spoke owners via Power Automate.

OPERATING MODEL — HUB-AND-SPOKE:
HUB (central Data & AI CoE on Data Hive / Fabric): owns OneLake, reusable ingestion + SCD frameworks, Gold + ontology, agent platform, Purview governance, DQ monitoring, MLOps / AgentOps.
SPOKE (business domain): owns process steps, business rules, KPIs, source-of-truth definitions, HITL approvals, exception handling, last-mile reporting.
HANDSHAKES: data contracts, Power Automate exception SLAs, joint backlog, gate reviews.

YOUR JOB — produce executive-grade guidance that proves how Data & AI will (a) IMPROVE OPERATIONS, (b) DELIVER VALUE against the stated KPIs and (c) MEET GOVERNANCE STANDARDS, covering FOUR dimensions for the given business process:
1. HOW DATA IS PRODUCED — map each source system to the reusable Fabric ingestion pattern (Mirroring vs Pipelines vs Shortcuts), Bronze landing, schema contract, initial+incremental SCD strategy (Type 1 vs Type 2), refresh cadence, owner.
2. HOW DATA IS CONSUMED — call out the Silver/Gold data products required, semantic-model measures, ontology entities, downstream Copilot / agent / Power BI surfaces per process step, and HITL touchpoints — tied to the decisions the business must make.
3. HOW DATA IS GOVERNED — Purview classifications, sensitivity labels, lineage, access policies, data contracts, agent identity (Entra Agent ID), audit, retention; explicitly address the stated compliance constraints.
4. STEPS TO ADDRESS DATA QUALITY ISSUES — for every asset with a weak DAMA dimension (≤3), prescribe concrete remediation: profiling, rule authorship in Fabric/Purview DQ, source-side fix vs Silver cleanse, owner, monitoring metric, exit criteria.

The hubSpokeActivities array MUST describe the concrete activities the organisation needs to perform to MOVE to hub-and-spoke ways of working — stand up the hub CoE, federate spoke ownership, sign data contracts, establish exception SLAs, run gate reviews, build agent factory, etc. Sequence them in adoption order.

Then synthesise: per-step Data & AI interventions with hub/spoke ownership, a gap register vs target, prioritised use-case backlog, hub-and-spoke activity backlog, and a 6-axis radar (current vs target).

Be specific. Quote pain points verbatim. Reference DA-xx asset IDs. Cite Fabric / OneLake / Purview / Copilot Studio / Fabric Data Agents components by name. Every step recommendation MUST reference the Fabric pattern (e.g. "Mirror Yardi via Fabric Mirroring → Bronze, SCD2 merge into Silver dim_property, surface via Gold fact_service_charge ontology entity") rather than generic advice.

The executiveSummary MUST be a SHORT bullet list (8–12 lines, one idea per line, prefixed with "- ") organised under: Operations uplift, Value delivered (referencing the stated KPIs), Governance posture (referencing the stated compliance constraints), and Top risks / next moves.`;

const TOOL_SCHEMA = {
  type: "object",
  properties: {
    executiveSummary: { type: "string" },
    stepRecommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          stepId: { type: "string" },
          classification: { type: "string", enum: ["RETAIN", "OPTIMISE", "AUTOMATE+HUMAN", "AUTOMATE FULL", "CONTROL"] },
          dataAiIntervention: { type: "string" },
          hubSpoke: { type: "string", enum: ["Hub", "Spoke", "Shared"] },
          requiredAssets: { type: "array", items: { type: "string" } },
          dqUplifts: { type: "array", items: { type: "string" } },
          governance: { type: "string" },
          rationale: { type: "string" },
        },
        required: ["stepId", "classification", "dataAiIntervention", "hubSpoke", "requiredAssets", "dqUplifts", "governance", "rationale"],
        additionalProperties: false,
      },
    },
    gapRegister: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          description: { type: "string" },
          dimension: { type: "string", enum: ["Process", "Data", "Technology", "People", "Governance"] },
          classification: { type: "string", enum: ["BLOCKER", "CONDITIONAL", "WATCH"] },
          asIsRef: { type: "string" },
          impact: { type: "string" },
          remediation: { type: "string" },
          owner: { type: "string" },
          priority: { type: "string", enum: ["H", "M", "L"] },
        },
        required: ["id", "description", "dimension", "classification", "asIsRef", "impact", "remediation", "owner", "priority"],
        additionalProperties: false,
      },
    },
    useCaseBacklog: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          businessImpact: { type: "number" },
          desirability: { type: "number" },
          feasibility: { type: "number" },
          total: { type: "number" },
          solutionType: { type: "string" },
          dataReadiness: { type: "string", enum: ["Red", "Amber", "Green"] },
        },
        required: ["id", "name", "businessImpact", "desirability", "feasibility", "total", "solutionType", "dataReadiness"],
        additionalProperties: false,
      },
    },
    hubSpokeActivities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          pillar: { type: "string", enum: ["Hub", "Spoke", "Handshake"] },
          activity: { type: "string" },
          description: { type: "string" },
          owner: { type: "string" },
          sequence: { type: "number" },
        },
        required: ["id", "pillar", "activity", "description", "owner", "sequence"],
        additionalProperties: false,
      },
    },
    radar: {
      type: "array",
      items: {
        type: "object",
        properties: {
          axis: { type: "string" },
          current: { type: "number", minimum: 0, maximum: 5 },
          target: { type: "number", minimum: 0, maximum: 5 },
        },
        required: ["axis", "current", "target"],
        additionalProperties: false,
      },
    },
  },
  required: ["executiveSummary", "stepRecommendations", "gapRegister", "useCaseBacklog", "hubSpokeActivities", "radar"],
  additionalProperties: false,
} as const;

function azureChatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  if (/\/openai\/v1$/i.test(trimmed)) return `${trimmed}/chat/completions`;
  if (/\/openai$/i.test(trimmed)) return `${trimmed}/v1/chat/completions`;
  return `${trimmed}/openai/v1/chat/completions`;
}

function deploymentNameForAzure(model: string): string {
  return model.replace(/^openai\//i, "").trim();
}

export type BlueprintRunInput = {
  context: any;
  steps: any[];
  assets: any[];
  dq: any[];
  hive?: any;
  tom: any;
};

export async function runBlueprintGeneration(data: BlueprintRunInput): Promise<BlueprintResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("Azure OpenAI API key is not configured.");
  const baseUrl = process.env.XAI_BASE_URL || "https://foundry-sc-poc-hs.openai.azure.com/openai/v1";

  const userMessage = `BUSINESS PROCESS CONTEXT:
Organisation: ${data.context.organisation}
Business function: ${data.context.businessFunction}
Business process: ${data.context.businessProcess}
Sponsor: ${data.context.sponsor}
Cycle volume: ${data.context.cycleVolume}
Baseline effort: ${data.context.baselineEffort}
Timeline: ${data.context.timeline}

OPERATIONS — value drivers / pain & opportunity:
${data.context.valueDrivers || "(not provided)"}

VALUE — KPIs the blueprint must move:
${data.context.kpis || "(not provided)"}

DECISIONS the data + AI must support:
${data.context.decisionsSupported || "(not provided)"}

GOVERNANCE — compliance / sensitivity / retention constraints:
${data.context.complianceConstraints || "(not provided)"}

AS-IS PROCESS STEPS (${data.steps.length}):
${data.steps.map((s: any) => `${s.id} [${s.subProcess}] ${s.description} | role=${s.role} | system=${s.systemTool} | in=${s.dataInput} | out=${s.dataOutput} | time=${s.time} | freq=${s.frequency} | pain=${s.painPoint ? "Y" : "N"} ${s.painPointDescription ? "→ " + s.painPointDescription : ""} | proposed=${s.automationOpportunity || "?"} | DA=${s.dataAssetRef || "—"}`).join("\n")}

DATA ASSET MAP (${data.assets.length}):
${data.assets.map((a: any) => `${a.id} ${a.source} | domain=${a.domain} | entities=${a.entities} | owner=${a.businessOwner}/${a.technicalOwner} | refresh=${a.refresh} | PII=${a.pii} | currentLayer=${a.dataHiveStatus} | RAG=${a.overallRag} | notes=${a.notes}`).join("\n")}

DATA QUALITY SCORES (1-5, DAMA dimensions):
${data.dq.map((d: any) => `${d.assetId}: comp=${d.completeness} acc=${d.accuracy} cons=${d.consistency} time=${d.timeliness} uniq=${d.uniqueness} valid=${d.validity} | ${d.evidence}`).join("\n")}

TARGET TOM:
HUB capabilities:
${data.tom.hubCapabilities}

SPOKE ownership:
${data.tom.spokeOwnership}

HANDSHAKES:
${data.tom.handshakes}

CONTROLS:
${data.tom.controls}

SUCCESS METRICS:
${data.tom.successMetrics}

Call emit_blueprint with the structured analysis. Cover EVERY AS-IS step in stepRecommendations.`;

  const isAzure = /\.azure\.com/i.test(baseUrl);
  const model = deploymentNameForAzure(process.env.XAI_MODEL || "gpt-5.4");
  const body = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    tools: [{ type: "function", function: { name: "emit_blueprint", description: "Emit the executable Data Blueprint output.", parameters: TOOL_SCHEMA } }],
    tool_choice: { type: "function", function: { name: "emit_blueprint" } },
    stream: true,
  };

  const url = isAzure ? azureChatCompletionsUrl(baseUrl) : `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "text/event-stream" };
  if (isAzure) headers["api-key"] = apiKey; else headers["Authorization"] = `Bearer ${apiKey}`;

  const resp = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!resp.ok || !resp.body) {
    const text = await resp.text().catch(() => "");
    throw new Error(`AI gateway error ${resp.status}: ${text.slice(0, 400)}`);
  }

  // Stream the SSE response and accumulate tool_call arguments to avoid
  // Cloudflare's 100s idle timeout (524) on long generations.
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let argsAccum = "";
  let toolName = "";

  outer: while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nlIdx: number;
    while ((nlIdx = buffer.indexOf("\n")) !== -1) {
      const rawLine = buffer.slice(0, nlIdx).trim();
      buffer = buffer.slice(nlIdx + 1);
      if (!rawLine || !rawLine.startsWith("data:")) continue;
      const payload = rawLine.slice(5).trim();
      if (payload === "[DONE]") break outer;
      try {
        const evt = JSON.parse(payload);
        const delta = evt?.choices?.[0]?.delta;
        const tc = delta?.tool_calls?.[0];
        if (tc?.function?.name) toolName = tc.function.name;
        if (tc?.function?.arguments) argsAccum += tc.function.arguments;
      } catch {
        // ignore non-JSON keep-alives
      }
    }
  }

  if (!argsAccum) throw new Error("AI did not return a structured response.");
  let parsed: any;
  try {
    parsed = JSON.parse(argsAccum);
  } catch (e: any) {
    throw new Error(`Failed to parse AI structured response (${toolName || "tool_call"}): ${e?.message || "invalid JSON"}`);
  }

  return {
    generatedAt: new Date().toISOString(),
    model,
    executiveSummary: String(parsed.executiveSummary || ""),
    stepRecommendations: Array.isArray(parsed.stepRecommendations) ? parsed.stepRecommendations : [],
    gapRegister: Array.isArray(parsed.gapRegister) ? parsed.gapRegister : [],
    useCaseBacklog: Array.isArray(parsed.useCaseBacklog) ? parsed.useCaseBacklog : [],
    hubSpokeActivities: Array.isArray(parsed.hubSpokeActivities) ? parsed.hubSpokeActivities : [],
    radar: Array.isArray(parsed.radar) ? parsed.radar : [],
  };
}
