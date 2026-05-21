import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, AlertTriangle, CheckCircle2, BookOpenCheck, Loader2, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiRadar } from "@/components/ai-radar";
import { analyzeWorkstream } from "@/lib/analysis.functions";
import { getOpenQuestions, renderPrompt } from "@/lib/open-questions";
import type { Workstream, MaturityLevel } from "@/lib/assessment-data";
import type { AiWorkstreamResult, ProcessContext } from "@/lib/analysis.schema";

interface Props {
  workstream: Workstream;
  context: ProcessContext;
  maturityAnswers: Record<string, { current: MaturityLevel; target: MaturityLevel }>;
  openAnswers: Record<string, string>;
  existing?: AiWorkstreamResult;
  onResult: (r: AiWorkstreamResult) => void;
}

const SEVERITY_STYLE: Record<string, { bg: string; fg: string }> = {
  Critical: { bg: "oklch(0.95 0.08 25)", fg: "oklch(0.40 0.20 25)" },
  High: { bg: "oklch(0.96 0.07 60)", fg: "oklch(0.42 0.18 55)" },
  Medium: { bg: "oklch(0.96 0.06 95)", fg: "oklch(0.42 0.14 90)" },
  Low: { bg: "oklch(0.95 0.05 160)", fg: "oklch(0.40 0.12 160)" },
};

export function AiFindings({ workstream, context, maturityAnswers, openAnswers, existing, onResult }: Props) {
  const runAnalyze = useServerFn(analyzeWorkstream);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build payload
      const maturityPayload = workstream.steps.flatMap((s) =>
        s.questions.map((q) => {
          const a = maturityAnswers[q.id];
          return {
            questionId: q.id,
            questionText: q.text,
            stepName: s.name,
            current: a?.current ?? 0,
            target: a?.target ?? 0,
          };
        })
      );
      const openPayload = workstream.steps.flatMap((s) =>
        getOpenQuestions(s.id).map((oq) => ({
          questionId: oq.id,
          stepName: s.name,
          prompt: renderPrompt(oq.prompt, context),
          answer: openAnswers[oq.id] ?? "",
        }))
      );
      const result = await runAnalyze({
        data: {
          context,
          workstream: {
            id: workstream.id,
            name: workstream.name,
            description: workstream.description,
            steps: workstream.steps.map((s) => ({ id: s.id, name: s.name, description: s.description })),
          },
          maturityAnswers: maturityPayload,
          openAnswers: openPayload,
        },
      });
      onResult(result);
    } catch (e: any) {
      setError(e?.message || "Failed to run AI analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border-2 p-5 md:p-6" style={{ borderColor: workstream.color, background: `color-mix(in oklab, ${workstream.color} 4%, white)` }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: workstream.color }}>
            <Sparkles className="h-3.5 w-3.5" /> AI-reasoned findings
          </div>
          <h3 className="mt-1 text-lg font-bold tracking-tight">
            Pain points & next-best actions for {context.businessProcess || "this process"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Powered by Lovable AI · grounded in Azure CAF for AI Agents · tailored to {context.businessFunction || "your function"} / {context.businessProcess || "your process"}
          </p>
        </div>
        <Button onClick={run} disabled={loading} className="shadow-[var(--shadow-elegant)]" style={{ background: workstream.color }}>
          {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analysing…</>) :
            existing ? (<><RefreshCw className="mr-2 h-4 w-4" /> Re-run analysis</>) :
            (<><Sparkles className="mr-2 h-4 w-4" /> Run AI analysis</>)}
        </Button>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {!existing && !loading && !error && (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
          Click <strong>Run AI analysis</strong> to send your maturity ratings and open-text answers to a reasoning model. It will
          return current-vs-target scores per sub-category, identified pain points, and prescriptive Azure CAF actions.
        </div>
      )}

      {existing && (
        <div className="mt-5 space-y-5">
          {/* Summary */}
          <div className="rounded-lg border border-border bg-card p-4 text-sm leading-relaxed">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Executive summary</div>
            {existing.summary}
          </div>

          {/* Radar */}
          {existing.dimensions.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Current vs. target — by sub-category
              </div>
              <AiRadar dimensions={existing.dimensions} color={workstream.color} />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {existing.dimensions.map((d) => (
                  <div key={d.name} className="rounded border border-border/70 bg-background/60 p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{d.name}</span>
                      <span className="font-mono">{d.currentScore.toFixed(1)} → {d.targetScore.toFixed(1)}</span>
                    </div>
                    <div className="mt-1 text-muted-foreground">{d.rationale}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pain points */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: workstream.color }}>
              <AlertTriangle className="h-3.5 w-3.5" /> Identified pain points
            </div>
            {existing.painPoints.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> No material pain points identified for this workstream.
              </div>
            ) : (
              <ul className="space-y-2">
                {existing.painPoints.map((p) => {
                  const sty = SEVERITY_STYLE[p.severity] || SEVERITY_STYLE.Medium;
                  return (
                    <li key={p.id} className="rounded border border-border/70 bg-background/60 p-3 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm">
                          <span className="mr-2 font-mono text-[10px] text-muted-foreground">{p.id}</span>{p.title}
                        </div>
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ background: sty.bg, color: sty.fg }}>
                          {p.severity}
                        </span>
                      </div>
                      <div className="mt-1.5 text-muted-foreground"><span className="font-medium text-foreground">Evidence:</span> {p.evidence}</div>
                      {p.affectedDimensions?.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {p.affectedDimensions.map((d) => (
                            <span key={d} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{d}</span>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Next-best actions */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: workstream.color }}>
              <BookOpenCheck className="h-3.5 w-3.5" /> Next-best actions (Azure CAF for AI Agents)
            </div>
            {existing.actions.length === 0 ? (
              <div className="text-xs text-muted-foreground">No actions returned.</div>
            ) : (
              <ol className="space-y-3">
                {existing.actions.map((a) => (
                  <li key={a.id} className="rounded border border-border/70 bg-background/60 p-3 text-xs">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="font-medium text-sm">
                        <span className="mr-2 font-mono text-[10px] text-muted-foreground">{a.id}</span>{a.title}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `color-mix(in oklab, ${workstream.color} 14%, white)`, color: workstream.color }}>
                          {a.cafPillar}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">Owner: {a.owner}</span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">Effort {a.effort}</span>
                      </div>
                    </div>
                    {a.addressesPainPoints?.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                        <ArrowRight className="h-3 w-3" /> Addresses:
                        {a.addressesPainPoints.map((pid) => (
                          <span key={pid} className="rounded bg-warning/15 px-1.5 py-0.5 font-mono text-warning">{pid}</span>
                        ))}
                      </div>
                    )}
                    <ul className="mt-2 space-y-1">
                      {a.steps.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 leading-relaxed">
                          <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: workstream.color }} />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="text-[10px] text-muted-foreground">
            Generated {new Date(existing.generatedAt).toLocaleString()} · model {existing.model}
          </div>
        </div>
      )}
    </div>
  );
}
