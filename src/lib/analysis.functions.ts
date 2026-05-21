import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AiWorkstreamResult } from "./analysis.schema";

// Input schema validated on the server.
const AnalyzeInput = z.object({
  context: z.object({
    organisation: z.string().max(200).default(""),
    businessFunction: z.string().max(200).default(""),
    businessProcess: z.string().max(200).default(""),
    executiveSponsor: z.string().max(200).default(""),
    inScopeSystems: z.string().max(2000).default(""),
    successDefinition: z.string().max(2000).default(""),
    timeline: z.string().max(200).default(""),
  }),
  workstream: z.object({
    id: z.string().max(40),
    name: z.string().max(200),
    description: z.string().max(2000).default(""),
    steps: z
      .array(
        z.object({
          id: z.string().max(40),
          name: z.string().max(200),
          description: z.string().max(2000).default(""),
        })
      )
      .max(20),
  }),
  // All maturity self-ratings keyed by question id
  maturityAnswers: z
    .array(
      z.object({
        questionId: z.string().max(40),
        questionText: z.string().max(500),
        stepName: z.string().max(200),
        current: z.number().min(0).max(5),
        target: z.number().min(0).max(5),
      })
    )
    .max(200),
  // Free-text answers to open questions
  openAnswers: z
    .array(
      z.object({
        questionId: z.string().max(60),
        stepName: z.string().max(200),
        prompt: z.string().max(800),
        answer: z.string().max(8000),
      })
    )
    .max(200),
});

const TOOL_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "2-4 sentence executive summary tailored to the process & function." },
    dimensions: {
      type: "array",
      description:
        "One entry per sub-category (step) of the workstream. Use the FULL sub-category name as given. Score 0-5.",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          currentScore: { type: "number", minimum: 0, maximum: 5 },
          targetScore: { type: "number", minimum: 0, maximum: 5 },
          rationale: { type: "string" },
        },
        required: ["name", "currentScore", "targetScore", "rationale"],
        additionalProperties: false,
      },
    },
    painPoints: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "Stable id like P1, P2..." },
          title: { type: "string" },
          severity: { type: "string", enum: ["Critical", "High", "Medium", "Low"] },
          affectedDimensions: { type: "array", items: { type: "string" } },
          evidence: { type: "string", description: "Paraphrase or quote from the user's answers." },
        },
        required: ["id", "title", "severity", "affectedDimensions", "evidence"],
        additionalProperties: false,
      },
    },
    actions: {
      type: "array",
      description: "Next-best actions grounded in the Azure Cloud Adoption Framework for AI Agents.",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "Stable id like A1, A2..." },
          title: { type: "string" },
          addressesPainPoints: { type: "array", items: { type: "string" } },
          cafPillar: { type: "string", description: "Which CAF pillar this aligns to." },
          owner: { type: "string" },
          effort: { type: "string", enum: ["S", "M", "L"] },
          steps: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 8 },
        },
        required: ["id", "title", "addressesPainPoints", "cafPillar", "owner", "effort", "steps"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "dimensions", "painPoints", "actions"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You are a Microsoft Chief Enterprise, Data & AI Architect with deep expertise designing autonomous AI agents, the Azure Cloud Adoption Framework (CAF) for AI Agents, Microsoft Fabric (OneLake / Bronze-Silver-Gold), Microsoft Purview, Azure AI Foundry, Copilot Studio, Agent 365, Defender for Cloud AI, and Responsible AI / EU AI Act / GDPR compliance.

You assess the readiness of ANY business process in ANY business function for autonomous AI agent enablement using the Data Blueprint methodology with four workstreams: Foundations CoE, Business Transformation, Foundations Data, Agents Factory.

For one workstream at a time you will:
1. Score each sub-category (dimension) for CURRENT and TARGET state on 0-5 (0=No capability, 5=Transformational). Use the FULL sub-category name.
2. Identify pain points grounded in the user's actual answers — cite evidence (quote or paraphrase). Severity must reflect risk + business impact.
3. Propose prescriptive Next Best Actions grounded in Azure CAF for AI Agents. Each action MUST be tagged to one or more pain point IDs. Steps must be concrete Microsoft-stack guidance (Fabric, Purview, Foundry, Copilot Studio, Agent 365, Defender for Cloud AI, Entra Agent ID, etc.) — not generic platitudes.
4. Tailor every output to the specific BUSINESS FUNCTION and BUSINESS PROCESS in the context.

Be specific. Avoid generic phrasing. Quote the user's words where possible.`;

export const analyzeWorkstream = createServerFn({ method: "POST" })
  .inputValidator((input) => AnalyzeInput.parse(input))
  .handler(async ({ data }): Promise<AiWorkstreamResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured. Enable Lovable AI for this project.");
    }

    const userPayload = {
      context: data.context,
      workstream: data.workstream,
      maturitySelfRatings: data.maturityAnswers,
      openTextAnswers: data.openAnswers,
    };

    const userMessage = `Analyse the following workstream submission and call emit_findings with the structured result.

CONTEXT:
${JSON.stringify(data.context, null, 2)}

WORKSTREAM: ${data.workstream.name}
Sub-categories (dimensions) — use these EXACT names for the dimensions array:
${data.workstream.steps.map((s) => `- ${s.name}`).join("\n")}

USER MATURITY SELF-RATINGS (0-5):
${data.maturityAnswers
  .map(
    (a) =>
      `[${a.stepName}] ${a.questionText}\n  current=${a.current}, target=${a.target}`
  )
  .join("\n")}

USER OPEN-TEXT ANSWERS:
${data.openAnswers
  .map((a) => `[${a.stepName}] Q: ${a.prompt}\nA: ${a.answer || "(no answer provided)"}`)
  .join("\n\n")}

Produce a thorough, evidence-grounded analysis tailored to ${data.context.businessFunction || "the function"} / ${data.context.businessProcess || "the process"}.`;

    const model = "google/gemini-2.5-pro"; // strong reasoning, fast on gateway
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
            name: "emit_findings",
            description: "Emit the structured assessment findings.",
            parameters: TOOL_SCHEMA,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "emit_findings" } },
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      if (resp.status === 429) {
        throw new Error("Rate limit exceeded on the AI gateway. Try again in a moment.");
      }
      if (resp.status === 402) {
        throw new Error("Lovable AI credits exhausted. Add credits in Settings → Workspace → Usage.");
      }
      throw new Error(`AI gateway error ${resp.status}: ${text.slice(0, 300)}`);
    }

    const json = await resp.json();
    const call = json?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      throw new Error("AI did not return a structured response.");
    }
    let parsed: any;
    try {
      parsed = JSON.parse(call.function.arguments);
    } catch {
      throw new Error("AI returned malformed JSON.");
    }

    return {
      workstreamId: data.workstream.id,
      summary: String(parsed.summary || ""),
      dimensions: Array.isArray(parsed.dimensions) ? parsed.dimensions : [],
      painPoints: Array.isArray(parsed.painPoints) ? parsed.painPoints : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      generatedAt: new Date().toISOString(),
      model,
    };
  });
