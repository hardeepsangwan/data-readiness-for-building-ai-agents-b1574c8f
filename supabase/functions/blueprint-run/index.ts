// Supabase Edge Function: blueprint-run
// Fire-and-forget runner that performs the long-running Azure OpenAI call
// for blueprint generation. Avoids Cloudflare's 100s 524 timeout that the
// previous TanStack server route hit when invoked from the Lovable frontend.
//
// Flow:
//   1. Client calls startBlueprintJob (creates job row, status=queued).
//   2. Client invokes this edge function with { jobId } (fire-and-forget).
//   3. This function streams the AI response, then updates the job row
//      with status=completed | error and the parsed result.
//   4. Client polls getBlueprintJob for status/result.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
};

const STEP_RECOMMENDATIONS_SCHEMA = {
  type: "object",
  properties: {
    stepRecommendations: TOOL_SCHEMA.properties.stepRecommendations,
  },
  required: ["stepRecommendations"],
  additionalProperties: false,
};

const SYNTHESIS_SCHEMA = {
  type: "object",
  properties: {
    executiveSummary: TOOL_SCHEMA.properties.executiveSummary,
    gapRegister: TOOL_SCHEMA.properties.gapRegister,
    useCaseBacklog: TOOL_SCHEMA.properties.useCaseBacklog,
    hubSpokeActivities: TOOL_SCHEMA.properties.hubSpokeActivities,
    radar: TOOL_SCHEMA.properties.radar,
  },
  required: ["executiveSummary", "gapRegister", "useCaseBacklog", "hubSpokeActivities", "radar"],
  additionalProperties: false,
};

function azureChatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  if (/\/openai\/v1$/i.test(trimmed)) return `${trimmed}/chat/completions`;
  if (/\/openai$/i.test(trimmed)) return `${trimmed}/v1/chat/completions`;
  return `${trimmed}/openai/v1/chat/completions`;
}

function deploymentNameForAzure(model: string): string {
  return model.replace(/^openai\//i, "").trim();
}

function buildUserMessage(data: any): string {
  return `BUSINESS PROCESS CONTEXT:
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
}

function clip(value: unknown, max = 360): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function currentModel(): string {
  return deploymentNameForAzure(Deno.env.get("XAI_MODEL") || "gpt-5.4");
}

function contextBrief(data: any): string {
  return [
    `Organisation=${clip(data.context?.organisation, 160)}`,
    `Function=${clip(data.context?.businessFunction, 160)}`,
    `Process=${clip(data.context?.businessProcess, 180)}`,
    `Sponsor=${clip(data.context?.sponsor, 120)}`,
    `Volume=${clip(data.context?.cycleVolume, 180)}`,
    `Effort=${clip(data.context?.baselineEffort, 180)}`,
    `Timeline=${clip(data.context?.timeline, 120)}`,
    `Value drivers=${clip(data.context?.valueDrivers, 700)}`,
    `KPIs=${clip(data.context?.kpis, 700)}`,
    `Decisions=${clip(data.context?.decisionsSupported, 700)}`,
    `Compliance=${clip(data.context?.complianceConstraints, 700)}`,
  ].join("\n");
}

function relatedAssetIds(steps: any[]): Set<string> {
  return new Set(steps.map((s) => String(s?.dataAssetRef || "").trim()).filter(Boolean));
}

function formatSteps(steps: any[]): string {
  return steps.map((s: any) => `${s.id} [${clip(s.subProcess, 80)}] ${clip(s.description, 260)} | role=${clip(s.role, 80)} | system=${clip(s.systemTool, 90)} | in=${clip(s.dataInput, 120)} | out=${clip(s.dataOutput, 120)} | time=${clip(s.time, 50)} | freq=${clip(s.frequency, 50)} | pain=${s.painPoint ? "Y" : "N"} ${s.painPointDescription ? "→ " + clip(s.painPointDescription, 220) : ""} | proposed=${clip(s.automationOpportunity || "?", 40)} | priority=${clip(s.priority || "?", 10)} | DA=${clip(s.dataAssetRef || "—", 30)}`).join("\n");
}

function formatAssets(assets: any[], ids?: Set<string>): string {
  const selected = ids?.size ? assets.filter((a: any) => ids.has(String(a?.id || ""))) : assets;
  return selected.map((a: any) => `${a.id} ${clip(a.source, 120)} | domain=${clip(a.domain, 80)} | entities=${clip(a.entities, 180)} | owners=${clip(a.businessOwner, 80)}/${clip(a.technicalOwner, 80)} | refresh=${clip(a.refresh, 50)} | PII=${a.pii ? "Y" : "N"} | layer=${clip(a.dataHiveStatus, 40)} | RAG=${clip(a.overallRag, 20)} | notes=${clip(a.notes, 180)}`).join("\n") || "(none)";
}

function formatDq(dq: any[], ids?: Set<string>): string {
  const selected = ids?.size ? dq.filter((d: any) => ids.has(String(d?.assetId || ""))) : dq;
  return selected.map((d: any) => `${d.assetId}: comp=${d.completeness} acc=${d.accuracy} cons=${d.consistency} time=${d.timeliness} uniq=${d.uniqueness} valid=${d.validity} | ${clip(d.evidence, 220)}`).join("\n") || "(none)";
}

function tomBrief(data: any): string {
  return `Hub=${clip(data.tom?.hubCapabilities, 900)}\nSpoke=${clip(data.tom?.spokeOwnership, 900)}\nHandshakes=${clip(data.tom?.handshakes, 900)}\nControls=${clip(data.tom?.controls, 900)}\nSuccess=${clip(data.tom?.successMetrics, 900)}`;
}

function buildStepBatchMessage(data: any, batchSteps: any[], batchNumber: number, totalBatches: number): string {
  const ids = relatedAssetIds(batchSteps);
  return `Generate Data Blueprint step recommendations for batch ${batchNumber}/${totalBatches}. Return ONLY the emit_step_recommendations tool call.\n\nCONTEXT:\n${contextBrief(data)}\n\nPROCESS STEPS IN THIS BATCH (${batchSteps.length}):\n${formatSteps(batchSteps)}\n\nRELATED DATA ASSETS:\n${formatAssets(data.assets || [], ids)}\n\nRELATED DATA QUALITY SCORES:\n${formatDq(data.dq || [], ids)}\n\nTARGET TOM:\n${tomBrief(data)}\n\nFor EVERY step in this batch, produce exactly one stepRecommendations item. Keep each text field concise but specific to Data Hive / Microsoft Fabric / Purview / Copilot patterns.`;
}

function buildSynthesisMessage(data: any, stepRecommendations: any[]): string {
  const recs = stepRecommendations.map((r: any) => `${r.stepId}: ${r.classification} | ${clip(r.dataAiIntervention, 220)} | owner=${r.hubSpoke} | assets=${Array.isArray(r.requiredAssets) ? r.requiredAssets.join(",") : ""} | dq=${Array.isArray(r.dqUplifts) ? r.dqUplifts.map((x: any) => clip(x, 80)).join("; ") : ""}`).join("\n");
  return `Generate the remaining executive Data Blueprint synthesis. Return ONLY the emit_blueprint_synthesis tool call.\n\nCONTEXT:\n${contextBrief(data)}\n\nALL STEP RECOMMENDATIONS ALREADY GENERATED (${stepRecommendations.length}):\n${recs}\n\nDATA ASSET MAP:\n${formatAssets(data.assets || [])}\n\nDATA QUALITY SCORES:\n${formatDq(data.dq || [])}\n\nTARGET TOM:\n${tomBrief(data)}\n\nCreate: executiveSummary, gapRegister, useCaseBacklog, hubSpokeActivities, and radar. Keep the output compact enough to complete reliably while still executive-grade and specific.`;
}

function fallbackRecommendations(steps: any[]): any[] {
  return steps.map((s: any) => ({
    stepId: String(s.id || ""),
    classification: s.automationOpportunity || "OPTIMISE",
    dataAiIntervention: `Apply the reusable Data Hive pattern for ${clip(s.description, 180)}: land ${clip(s.systemTool || s.dataInput, 120)} into OneLake Bronze, standardise in Silver, expose certified Gold entities and governed Copilot / agent retrieval for the supported decision.`,
    hubSpoke: "Shared",
    requiredAssets: s.dataAssetRef ? [String(s.dataAssetRef)] : [],
    dqUplifts: [`Profile ${s.dataAssetRef || "the related source"}, author Fabric/Purview DQ rules, route exceptions to the Spoke owner, and monitor the metric until stable.`],
    governance: "Use Purview lineage, classifications, sensitivity labels, data contract controls, workspace RBAC, and auditable agent access via Entra Agent ID.",
    rationale: s.painPointDescription || "Generated fallback recommendation because the AI batch did not complete in time.",
  }));
}

function ensureStepCoverage(input: any, recs: any[]): any[] {
  const byStep = new Map(recs.filter((r: any) => r?.stepId).map((r: any) => [String(r.stepId), r]));
  for (const step of input.steps || []) {
    if (!byStep.has(String(step.id))) byStep.set(String(step.id), fallbackRecommendations([step])[0]);
  }
  return Array.from(byStep.values());
}

function fallbackSynthesis(input: any, stepRecommendations: any[]): any {
  const highPain = (input.steps || []).filter((s: any) => s.painPoint).slice(0, 4).map((s: any) => s.id).join(", ") || "the highest-volume steps";
  return {
    executiveSummary: `- Operations uplift: prioritise Data Hive ingestion, Silver standardisation, Gold semantic products, and agent-assisted execution across ${stepRecommendations.length} mapped process steps.\n- Value delivered: target the stated KPIs through cycle-time reduction, exception automation, better decision latency, and reusable Fabric patterns.\n- Governance posture: apply Purview lineage, classifications, sensitivity labels, data contracts, and audited agent identity for the stated compliance constraints.\n- Top risks / next moves: validate source quality for ${highPain}, confirm owners, and sequence delivery through hub-and-spoke gate reviews.`,
    gapRegister: [{ id: "G-01", description: "Long-context AI synthesis fallback: validate detailed gaps during the first hub-and-spoke design review.", dimension: "Governance", classification: "WATCH", asIsRef: highPain, impact: "May require refinement before delivery planning.", remediation: "Run a focused review of source readiness, DQ issues, and controls with Hub and Spoke owners.", owner: "Shared", priority: "M" }],
    useCaseBacklog: [{ id: "UC-01", name: "Reusable Data Hive automation for priority process steps", businessImpact: 4, desirability: 4, feasibility: 3, total: 11, solutionType: "Fabric data product + governed AI assistant", dataReadiness: "Amber" }],
    hubSpokeActivities: [
      { id: "HSA-01", pillar: "Hub", activity: "Stand up reusable Data Hive delivery patterns", description: "Publish ingestion, SCD, Gold semantic, DQ, and observability templates for the process.", owner: "Hub Data & AI CoE", sequence: 1 },
      { id: "HSA-02", pillar: "Spoke", activity: "Confirm business ownership and rules", description: "Nominate data owners, stewards, KPIs, HITL approvals, and source-side remediation owners.", owner: "Business Spoke", sequence: 2 },
      { id: "HSA-03", pillar: "Handshake", activity: "Sign data contracts and exception SLAs", description: "Agree refresh, quality, controls, escalation paths, and gate-review cadence.", owner: "Shared", sequence: 3 },
    ],
    radar: ["Data production", "Data consumption", "Governance", "Data quality", "Operating model", "AI readiness"].map((axis) => ({ axis, current: 2, target: 5 })),
  };
}

const REQUEST_TIMEOUT_MS = Number(Deno.env.get("BLUEPRINT_AI_TIMEOUT_MS") || 8 * 60_000);
const MAX_ATTEMPTS = 3; // 1 initial + 2 retries per AI stage
const RETRY_DELAY_MS = 3_000;
const STEP_BATCH_SIZE = Number(Deno.env.get("BLUEPRINT_STEP_BATCH_SIZE") || 8);
const STEP_MAX_COMPLETION_TOKENS = Number(Deno.env.get("BLUEPRINT_STEP_MAX_TOKENS") || 9000);
const SYNTHESIS_MAX_COMPLETION_TOKENS = Number(Deno.env.get("BLUEPRINT_SYNTHESIS_MAX_TOKENS") || 12000);
const MAX_COMPLETION_TOKENS = Number(Deno.env.get("BLUEPRINT_MAX_TOKENS") || 12000);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Best-effort repair of a JSON tool-call argument string that was cut off
// mid-stream (typically because the model hit max_completion_tokens). We walk
// the string and track brace/bracket/string state; when parsing fails we
// truncate to the last position where the structure was balanced at depth 1
// (i.e. after the last complete top-level array/object element), close any
// open containers, and retry. Returns null if nothing usable can be recovered.
function tryRepairTruncatedJson(src: string): any | null {
  const stack: string[] = [];
  let inStr = false;
  let esc = false;
  let lastSafeEnd = -1; // exclusive index; everything before is valid + balanced at top level
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === "{" || ch === "[") { stack.push(ch); continue; }
    if (ch === "}" || ch === "]") {
      stack.pop();
      if (stack.length === 1) lastSafeEnd = i + 1; // just closed a top-level element
      continue;
    }
  }
  if (lastSafeEnd <= 0) return null;
  // Rebuild: take everything up to the last safe boundary, then close the
  // outer container(s) that were open at that point. Since we only record
  // lastSafeEnd when stack.length === 1, exactly one outer container is open.
  // Detect whether the root is an object or array from src[0].
  const root = src.trimStart()[0];
  if (root !== "{" && root !== "[") return null;
  const closer = root === "{" ? "}" : "]";
  let candidate = src.slice(0, lastSafeEnd);
  // Strip any trailing comma between the last complete element and the closer.
  candidate = candidate.replace(/,\s*$/, "");
  candidate += closer;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

async function callStructured(prompt: string, toolName: string, schema: any, maxTokens: number): Promise<any> {
  const apiKey = Deno.env.get("XAI_API_KEY");
  if (!apiKey) throw new Error("Azure OpenAI API key is not configured.");
  const baseUrl = Deno.env.get("XAI_BASE_URL") || "https://foundry-sc-poc-hs.openai.azure.com/openai/v1";
  const isAzure = /\.azure\.com/i.test(baseUrl);
  const model = currentModel();

  const body = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    tools: [{ type: "function", function: { name: toolName, description: "Emit structured Data Blueprint output.", parameters: schema } }],
    tool_choice: { type: "function", function: { name: toolName } },
    stream: true,
    max_completion_tokens: maxTokens,
  };

  const url = isAzure ? azureChatCompletionsUrl(baseUrl) : `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "text/event-stream" };
  if (isAzure) headers["api-key"] = apiKey; else headers["Authorization"] = `Bearer ${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let resp: Response;
  try {
    resp = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: controller.signal });
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (e?.name === "AbortError") throw new Error(`AI request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`);
    throw e;
  }
  if (!resp.ok || !resp.body) {
    clearTimeout(timeoutId);
    const text = await resp.text().catch(() => "");
    throw new Error(`AI gateway error ${resp.status}: ${text.slice(0, 400)}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let argsAccum = "";
  let returnedToolName = "";
  let finishReason = "";

  try {
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
          const choice = evt?.choices?.[0];
          const delta = choice?.delta;
          const tc = delta?.tool_calls?.[0];
          if (tc?.function?.name) returnedToolName = tc.function.name;
          if (tc?.function?.arguments) argsAccum += tc.function.arguments;
          if (choice?.finish_reason) finishReason = choice.finish_reason;
        } catch {
          // ignore keep-alives
        }
      }
    }
  } catch (e: any) {
    if (e?.name === "AbortError") throw new Error(`AI request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`);
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!argsAccum) throw new Error("AI did not return a structured response.");
  let parsed: any;
  try {
    parsed = JSON.parse(argsAccum);
  } catch (e: any) {
    // Output was truncated (commonly finish_reason === "length"). Try to
    // salvage the partial JSON by trimming to the last complete array/object
    // element so the user still gets usable results instead of a hard failure.
    parsed = tryRepairTruncatedJson(argsAccum);
    if (!parsed) {
      const reason = finishReason ? ` (finish_reason=${finishReason})` : "";
      throw new Error(`Failed to parse AI structured response (${returnedToolName || toolName || "tool_call"})${reason}: ${e?.message || "invalid JSON"}`);
    }
    console.warn(`[blueprint-run] recovered truncated JSON (finish_reason=${finishReason})`);
  }

  return parsed;
}

async function withRetries<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastErr: any;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;
      console.error(`[blueprint-run] ${label} attempt ${attempt}/${MAX_ATTEMPTS} failed:`, e?.message || e);
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
    }
  }
  throw lastErr ?? new Error(`${label} failed.`);
}

async function runGeneration(input: any): Promise<any> {
  const steps = Array.isArray(input.steps) ? input.steps : [];
  const batches: any[][] = [];
  for (let i = 0; i < steps.length; i += STEP_BATCH_SIZE) batches.push(steps.slice(i, i + STEP_BATCH_SIZE));

  const stepRecommendations: any[] = [];
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      const parsed = await withRetries(`step batch ${i + 1}/${batches.length}`, () =>
        callStructured(
          buildStepBatchMessage(input, batch, i + 1, batches.length),
          "emit_step_recommendations",
          STEP_RECOMMENDATIONS_SCHEMA,
          STEP_MAX_COMPLETION_TOKENS,
        )
      );
      if (Array.isArray(parsed.stepRecommendations)) stepRecommendations.push(...parsed.stepRecommendations);
    } catch (e: any) {
      console.error(`[blueprint-run] using deterministic fallback for step batch ${i + 1}/${batches.length}:`, e?.message || e);
      stepRecommendations.push(...fallbackRecommendations(batch));
    }
  }

  const coveredStepRecommendations = ensureStepCoverage(input, stepRecommendations);
  let synthesis: any;
  try {
    synthesis = await withRetries("synthesis", () =>
      callStructured(
        buildSynthesisMessage(input, coveredStepRecommendations),
        "emit_blueprint_synthesis",
        SYNTHESIS_SCHEMA,
        SYNTHESIS_MAX_COMPLETION_TOKENS,
      )
    );
  } catch (e: any) {
    console.error("[blueprint-run] using deterministic fallback synthesis:", e?.message || e);
    synthesis = fallbackSynthesis(input, coveredStepRecommendations);
  }

  return {
    generatedAt: new Date().toISOString(),
    model: currentModel(),
    executiveSummary: String(synthesis.executiveSummary || ""),
    stepRecommendations: coveredStepRecommendations,
    gapRegister: Array.isArray(synthesis.gapRegister) ? synthesis.gapRegister : [],
    useCaseBacklog: Array.isArray(synthesis.useCaseBacklog) ? synthesis.useCaseBacklog : [],
    hubSpokeActivities: Array.isArray(synthesis.hubSpokeActivities) ? synthesis.hubSpokeActivities : [],
    radar: Array.isArray(synthesis.radar) ? synthesis.radar : [],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let jobId: string | undefined;
  try {
    const body = await req.json();
    jobId = body?.jobId;
  } catch {
    // ignore
  }
  if (!jobId || typeof jobId !== "string") {
    return new Response(JSON.stringify({ ok: false, error: "Missing jobId" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: job, error: fetchErr } = await supabase
    .from("blueprint_jobs")
    .select("input, status")
    .eq("id", jobId)
    .maybeSingle();
  if (fetchErr || !job) {
    return new Response(JSON.stringify({ ok: false, error: fetchErr?.message || "Job not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
  if (job.status === "completed" || job.status === "running") {
    return new Response(JSON.stringify({ ok: true, status: job.status }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  await supabase.from("blueprint_jobs").update({ status: "running" }).eq("id", jobId);

  // Run the long generation in the background so we can return immediately.
  // Supabase Edge Functions kill the request at 150s idle; the AI call can
  // take 2-5 minutes. EdgeRuntime.waitUntil keeps the worker alive past the
  // HTTP response so the DB row still gets updated when generation finishes.
  const work = (async () => {
    try {
      const result = await runGeneration(job.input);
      await supabase
        .from("blueprint_jobs")
        .update({ status: "completed", result, completed_at: new Date().toISOString(), error: null })
        .eq("id", jobId);
    } catch (e: any) {
      const message = e?.message || "Blueprint generation failed.";
      await supabase
        .from("blueprint_jobs")
        .update({ status: "error", error: message, completed_at: new Date().toISOString() })
        .eq("id", jobId);
    }
  })();

  // @ts-ignore — EdgeRuntime is available in Supabase Edge Functions runtime.
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
    // @ts-ignore
    EdgeRuntime.waitUntil(work);
  } else {
    // Fallback: best-effort detach.
    void work;
  }

  return new Response(JSON.stringify({ ok: true, status: "running" }), {
    status: 202,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});
