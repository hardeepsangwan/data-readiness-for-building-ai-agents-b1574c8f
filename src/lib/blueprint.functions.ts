// Server function: generate the executable Data Blueprint by calling xAI's
// Grok reasoning model directly. The user supplied XAI_API_KEY for this.
// Override the endpoint with XAI_BASE_URL (e.g. for Azure AI Foundry).

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { BlueprintResult } from "./blueprint-schema";

const ContextSchema = z.object({
  organisation: z.string().max(200).default(""),
  businessFunction: z.string().max(200).default(""),
  businessProcess: z.string().max(200).default(""),
  sponsor: z.string().max(200).default(""),
  cycleVolume: z.string().max(400).default(""),
  baselineEffort: z.string().max(400).default(""),
  timeline: z.string().max(200).default(""),
});

const StepSchema = z.object({
  id: z.string().max(40),
  stepNumber: z.number(),
  subProcess: z.string().max(200),
  description: z.string().max(1000),
  role: z.string().max(200),
  systemTool: z.string().max(200),
  dataInput: z.string().max(500),
  dataOutput: z.string().max(500),
  time: z.string().max(80),
  frequency: z.string().max(80),
  painPoint: z.boolean(),
  painPointDescription: z.string().max(800),
  automationOpportunity: z.string().max(40),
  priority: z.string().max(2),
  dataAssetRef: z.string().max(40),
});

const AssetSchema = z.object({
  id: z.string().max(40),
  source: z.string().max(300),
  domain: z.string().max(200),
  entities: z.string().max(500),
  accessMethod: z.string().max(200),
  businessOwner: z.string().max(200),
  technicalOwner: z.string().max(200),
  refresh: z.string().max(80),
  pii: z.boolean(),
  dataHiveStatus: z.string().max(40),
  bronzeFit: z.string().max(20),
  silverFit: z.string().max(20),
  goldFit: z.string().max(20),
  overallRag: z.string().max(20),
  notes: z.string().max(800),
});

const DqSchema = z.object({
  assetId: z.string().max(40),
  completeness: z.number(),
  accuracy: z.number(),
  consistency: z.number(),
  timeliness: z.number(),
  uniqueness: z.number(),
  validity: z.number(),
  evidence: z.string().max(1000),
});

const Input = z.object({
  context: ContextSchema,
  steps: z.array(StepSchema).max(80),
  assets: z.array(AssetSchema).max(60),
  dq: z.array(DqSchema).max(60),
  hive: z.object({
    ingestionPath: z.string().max(2000).default(""),
    ownershipModel: z.string().max(2000).default(""),
    semanticLayer: z.string().max(2000).default(""),
    agentRetrieval: z.string().max(2000).default(""),
    governanceAccess: z.string().max(2000).default(""),
    observability: z.string().max(2000).default(""),
  }),
  tom: z.object({
    hubCapabilities: z.string().max(4000),
    spokeOwnership: z.string().max(4000),
    handshakes: z.string().max(4000),
    controls: z.string().max(4000),
    successMetrics: z.string().max(4000),
  }),
});

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
          dataAiIntervention: { type: "string", description: "Concrete Microsoft Fabric / agent intervention at this step." },
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
      description: "Exactly 6 axes: Process automation, Data foundations, Data quality, Data Hive readiness, AI/Agent readiness, Governance.",
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

const SYSTEM_PROMPT = `You are a Microsoft Chief Enterprise Data & AI Architect advising on the Indurent Data Blueprint. The target state is a HUB-AND-SPOKE operating model:

HUB (central Data & AI CoE on Data Hive / Microsoft Fabric):
- Bronze→Silver→Gold pipelines, data contracts, semantic / ontology layer
- Agent platform: Copilot Studio, Foundry IQ / Fabric IQ retrieval
- Governance: Purview, Entra Agent ID, Defender for Cloud AI
- DQ monitoring, MLOps / AgentOps

SPOKE (business domain):
- Owns process steps, business rules, KPIs
- HITL approvals, exception handling, last-mile reporting

HANDSHAKES: data contracts, Power Automate exception SLAs, joint backlog, gate reviews.

Your job: given a business process AS-IS plus its data asset map, DQ scores and Data Hive answers, identify (a) per-step where Data & AI applies and the hub/spoke ownership, (b) the gap register vs the target TOM, (c) a prioritised use-case backlog, (d) concrete hub-and-spoke activities to stand up federated ways of working, (e) a 6-axis radar (current vs target).

Be specific. Quote pain points verbatim. Reference DA-xx asset IDs. Cite Fabric/Purview/Copilot Studio components by name.`;

export const generateBlueprint = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<BlueprintResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new Error("XAI_API_KEY is not configured.");
    const baseUrl = process.env.XAI_BASE_URL || "https://api.x.ai/v1";

    const userMessage = `BUSINESS PROCESS CONTEXT:
${JSON.stringify(data.context, null, 2)}

AS-IS PROCESS STEPS (${data.steps.length}):
${data.steps.map((s) => `${s.id} [${s.subProcess}] ${s.description} | role=${s.role} | system=${s.systemTool} | in=${s.dataInput} | out=${s.dataOutput} | time=${s.time} | freq=${s.frequency} | pain=${s.painPoint ? "Y" : "N"} ${s.painPointDescription ? "→ " + s.painPointDescription : ""} | proposed=${s.automationOpportunity || "?"} | DA=${s.dataAssetRef || "—"}`).join("\n")}

DATA ASSET MAP (${data.assets.length}):
${data.assets.map((a) => `${a.id} ${a.source} | domain=${a.domain} | entities=${a.entities} | owner=${a.businessOwner}/${a.technicalOwner} | refresh=${a.refresh} | PII=${a.pii} | DataHive=${a.dataHiveStatus} | RAG=${a.overallRag} | notes=${a.notes}`).join("\n")}

DATA QUALITY SCORES (1-5):
${data.dq.map((d) => `${d.assetId}: comp=${d.completeness} acc=${d.accuracy} cons=${d.consistency} time=${d.timeliness} uniq=${d.uniqueness} valid=${d.validity} | ${d.evidence}`).join("\n")}

DATA HIVE ANSWERS:
- Ingestion path: ${data.hive.ingestionPath}
- Hub/Spoke ownership: ${data.hive.ownershipModel}
- Semantic layer: ${data.hive.semanticLayer}
- Agent retrieval: ${data.hive.agentRetrieval}
- Governance & access: ${data.hive.governanceAccess}
- Observability: ${data.hive.observability}

TARGET TOM (must score every step AGAINST this):
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

    const model = process.env.XAI_MODEL || "grok-4-latest";
    const body = {
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "emit_blueprint",
            description: "Emit the executable Data Blueprint output.",
            parameters: TOOL_SCHEMA,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "emit_blueprint" } },
    };

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      if (resp.status === 429) throw new Error("Grok rate limit exceeded. Try again in a moment.");
      if (resp.status === 401) throw new Error("XAI_API_KEY invalid or unauthorized.");
      throw new Error(`xAI error ${resp.status}: ${text.slice(0, 400)}`);
    }

    const json = await resp.json();
    const call = json?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) throw new Error("AI did not return a structured response.");

    let parsed: any;
    try {
      parsed = JSON.parse(call.function.arguments);
    } catch {
      throw new Error("AI returned malformed JSON.");
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
  });
