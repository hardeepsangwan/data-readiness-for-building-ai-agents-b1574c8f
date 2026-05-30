// Background runner for blueprint generation jobs.
// Called (fire-and-forget) by the client after startBlueprintJob returns a jobId.

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { runBlueprintGeneration } from "@/lib/blueprint-run.server";

export const Route = createFileRoute("/api/public/blueprint/run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let jobId: string | undefined;
        try {
          const body = await request.json();
          jobId = body?.jobId;
        } catch {}
        if (!jobId || typeof jobId !== "string") {
          return new Response(JSON.stringify({ ok: false, error: "Missing jobId" }), { status: 400 });
        }

        const { data: job, error: fetchErr } = await supabaseAdmin
          .from("blueprint_jobs")
          .select("input, status")
          .eq("id", jobId)
          .maybeSingle();
        if (fetchErr || !job) {
          return new Response(JSON.stringify({ ok: false, error: fetchErr?.message || "Job not found" }), { status: 404 });
        }
        if (job.status === "completed" || job.status === "running") {
          return new Response(JSON.stringify({ ok: true, status: job.status }), { status: 200 });
        }

        await supabaseAdmin.from("blueprint_jobs").update({ status: "running" }).eq("id", jobId);

        try {
          const result = await runBlueprintGeneration(job.input as any);
          await supabaseAdmin
            .from("blueprint_jobs")
            .update({ status: "completed", result: result as any, completed_at: new Date().toISOString(), error: null })
            .eq("id", jobId);
          return new Response(JSON.stringify({ ok: true, status: "completed" }), { status: 200 });
        } catch (e: any) {
          const message = e?.message || "Blueprint generation failed.";
          await supabaseAdmin
            .from("blueprint_jobs")
            .update({ status: "error", error: message, completed_at: new Date().toISOString() })
            .eq("id", jobId);
          return new Response(JSON.stringify({ ok: false, error: message }), { status: 500 });
        }
      },
    },
  },
});
