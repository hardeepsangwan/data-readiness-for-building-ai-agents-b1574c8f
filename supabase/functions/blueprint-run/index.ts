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

const REQUEST_TIMEOUT_MS = 120_000;
const MAX_ATTEMPTS = 3; // 1 initial + 2 retries
const RETRY_DELAY_MS = 3_000;
const MAX_COMPLETION_TOKENS = 32000; // structured tool-call output for full AS-IS coverage can exceed 8k tokens

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

async function callOnce(input: any): Promise<any> {
  const apiKey = Deno.env.get("XAI_API_KEY");
  if (!apiKey) throw new Error("Azure OpenAI API key is not configured.");
  const baseUrl = Deno.env.get("XAI_BASE_URL") || "https://foundry-sc-poc-hs.openai.azure.com/openai/v1";
  const isAzure = /\.azure\.com/i.test(baseUrl);
  const model = deploymentNameForAzure(Deno.env.get("XAI_MODEL") || "gpt-5.4");

  const body = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(input) },
    ],
    tools: [{ type: "function", function: { name: "emit_blueprint", description: "Emit the executable Data Blueprint output.", parameters: TOOL_SCHEMA } }],
    tool_choice: { type: "function", function: { name: "emit_blueprint" } },
    stream: true,
    max_completion_tokens: MAX_COMPLETION_TOKENS,
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
  let toolName = "";
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
          if (tc?.function?.name) toolName = tc.function.name;
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
      throw new Error(`Failed to parse AI structured response (${toolName || "tool_call"})${reason}: ${e?.message || "invalid JSON"}`);
    }
    console.warn(`[blueprint-run] recovered truncated JSON (finish_reason=${finishReason})`);
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

async function runGeneration(input: any): Promise<any> {
  let lastErr: any;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await callOnce(input);
    } catch (e: any) {
      lastErr = e;
      console.error(`[blueprint-run] attempt ${attempt}/${MAX_ATTEMPTS} failed:`, e?.message || e);
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
    }
  }
  throw lastErr ?? new Error("Blueprint generation failed.");
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
