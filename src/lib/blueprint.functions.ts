// Server functions for blueprint background-job flow.
//
// Flow:
// 1. startBlueprintJob — inserts a queued job row, returns { jobId }.
// 2. Client fires POST /api/public/blueprint/run with the jobId (no await).
// 3. Client polls getBlueprintJob({ jobId }) for status/result.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { BlueprintResult } from "./blueprint-schema";

const ContextSchema = z.object({
  organisation: z.string().max(200).default(""),
  businessFunction: z.string().max(200).default(""),
  businessProcess: z.string().max(200).default(""),
  sponsor: z.string().max(200).default(""),
  cycleVolume: z.string().max(400).default(""),
  baselineEffort: z.string().max(400).default(""),
  timeline: z.string().max(200).default(""),
  valueDrivers: z.string().max(2000).default(""),
  kpis: z.string().max(2000).default(""),
  complianceConstraints: z.string().max(2000).default(""),
  decisionsSupported: z.string().max(2000).default(""),
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
  steps: z.array(StepSchema).max(1000),
  assets: z.array(AssetSchema).max(60),
  dq: z.array(DqSchema).max(60),
  hive: z.object({
    ingestionPath: z.string().max(2000).default(""),
    ownershipModel: z.string().max(2000).default(""),
    semanticLayer: z.string().max(2000).default(""),
    agentRetrieval: z.string().max(2000).default(""),
    governanceAccess: z.string().max(2000).default(""),
    observability: z.string().max(2000).default(""),
  }).optional(),
  tom: z.object({
    hubCapabilities: z.string().max(4000),
    spokeOwnership: z.string().max(4000),
    handshakes: z.string().max(4000),
    controls: z.string().max(4000),
    successMetrics: z.string().max(4000),
  }),
});

export type JobStatus = "queued" | "running" | "completed" | "error";

export const startBlueprintJob = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<{ ok: true; jobId: string } | { ok: false; error: string }> => {
    const { data: row, error } = await supabaseAdmin
      .from("blueprint_jobs")
      .insert({ status: "queued", input: data as any })
      .select("id")
      .single();
    if (error || !row) return { ok: false, error: error?.message || "Could not create job." };
    return { ok: true, jobId: row.id as string };
  });

export const getBlueprintJob = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ jobId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<{
    ok: true;
    status: JobStatus;
    result: BlueprintResult | null;
    error: string | null;
  } | { ok: false; error: string }> => {
    const { data: row, error } = await supabaseAdmin
      .from("blueprint_jobs")
      .select("status, result, error")
      .eq("id", data.jobId)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!row) return { ok: false, error: "Job not found." };
    return {
      ok: true,
      status: row.status as JobStatus,
      result: (row.result as BlueprintResult | null) ?? null,
      error: (row.error as string | null) ?? null,
    };
  });
