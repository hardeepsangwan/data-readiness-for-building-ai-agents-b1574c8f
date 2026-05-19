import { TrendingUp, Target, AlertTriangle, CheckCircle2, ArrowRight, BookOpenCheck } from "lucide-react";
import { stepAverages, CAF_GUIDANCE, type Workstream, type MaturityLevel, MATURITY_LEVELS } from "@/lib/assessment-data";

interface Props {
  workstream: Workstream;
  answers: Record<string, { current: MaturityLevel; target: MaturityLevel }>;
}

const levelName = (l: MaturityLevel) => MATURITY_LEVELS.find((m) => m.level === l)?.name ?? `L${l}`;

// Group remediation actions BY SUBCATEGORY (step). For each question with a
// gap, list the identified gap and the concrete steps to close it — every
// recommended step is tagged to the gap it addresses (Gap #).
export function WorkstreamActionPlan({ workstream, answers }: Props) {
  const rows = workstream.steps.map((s) => {
    const { current, target } = stepAverages(s, answers);
    const gap = Math.max(0, target - current);

    const gaps = s.questions
      .map((q, idx) => {
        const a = answers[q.id];
        if (!a || a.target <= a.current) return null;
        const currentOpt = q.options.find((o) => o.level === a.current);
        const targetOpt = q.options.find((o) => o.level === a.target);
        // Build the ladder of intermediate levels — each is a concrete step.
        const ladder = q.options
          .filter((o) => o.level > a.current && o.level <= a.target)
          .sort((x, y) => x.level - y.level);
        return {
          gapNo: idx + 1,
          question: q.text,
          delta: a.target - a.current,
          currentLevel: a.current,
          targetLevel: a.target,
          currentLabel: currentOpt?.description ?? "",
          targetLabel: targetOpt?.description ?? "",
          ladder,
        };
      })
      .filter(Boolean) as Array<{
        gapNo: number;
        question: string;
        delta: number;
        currentLevel: MaturityLevel;
        targetLevel: MaturityLevel;
        currentLabel: string;
        targetLabel: string;
        ladder: { level: MaturityLevel; label: string; description: string }[];
      }>;

    return { step: s, current, target, gap, gaps };
  });

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: workstream.color }}>
        <Target className="h-3.5 w-3.5" /> Identified gaps & steps to reach the target state
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Gaps are grouped under each subcategory of <span className="font-medium text-foreground">{workstream.name}</span>. Every step is tagged to the gap it addresses.
      </p>

      <div className="mt-4 space-y-5">
        {rows.map(({ step, current, target, gap, gaps }) => (
          <div key={step.id} className="rounded-md border border-border/70 bg-background/60">
            {/* Subcategory header */}
            <div
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5"
              style={{ background: `color-mix(in oklab, ${workstream.color} 6%, white)` }}
            >
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Subcategory</div>
                <div className="font-medium text-sm">{step.name}</div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded bg-muted px-2 py-0.5 font-mono">Now {current.toFixed(1)}</span>
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span className="rounded px-2 py-0.5 font-mono" style={{ background: `color-mix(in oklab, ${workstream.color} 14%, white)`, color: workstream.color }}>
                  Target {target.toFixed(1)}
                </span>
                <span className={`rounded px-2 py-0.5 font-mono ${gap > 1.5 ? "bg-warning/20 text-warning" : gap > 0 ? "bg-primary/15 text-primary" : "bg-success/15 text-success"}`}>
                  Δ {gap.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Gaps within this subcategory */}
            <div className="p-3 space-y-3">
              {gaps.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> No gap — current state already meets target for this subcategory.
                </div>
              ) : (
                gaps.map((g) => (
                  <div key={g.gapNo} className="rounded border border-border/60 bg-card">
                    {/* Gap header */}
                    <div className="flex items-start gap-2 border-b border-border/50 px-3 py-2">
                      <span
                        className="mt-0.5 inline-flex h-5 shrink-0 items-center gap-1 rounded px-1.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: `color-mix(in oklab, ${workstream.color} 16%, white)`, color: workstream.color }}
                      >
                        <AlertTriangle className="h-3 w-3" /> Gap {g.gapNo}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium leading-snug">{g.question}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono">L{g.currentLevel} {levelName(g.currentLevel)}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span className="rounded px-1.5 py-0.5 font-mono" style={{ background: `color-mix(in oklab, ${workstream.color} 14%, white)`, color: workstream.color }}>
                            L{g.targetLevel} {levelName(g.targetLevel)}
                          </span>
                          <span className="rounded bg-warning/15 px-1.5 py-0.5 font-mono text-warning">Δ {g.delta}</span>
                        </div>
                      </div>
                    </div>

                    {/* Ladder of steps addressing this gap */}
                    <ol className="px-3 py-2 space-y-1.5">
                      {g.ladder.map((opt, i) => (
                        <li key={opt.level} className="flex items-start gap-2 text-xs leading-relaxed">
                          <span
                            className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ background: workstream.color }}
                            title={`Step addressing Gap ${g.gapNo}`}
                          >
                            {i + 1}
                          </span>
                          <div>
                            <div className="font-medium">
                              Reach L{opt.level} — {opt.label}
                              <span className="ml-1.5 text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
                                addresses Gap {g.gapNo}
                              </span>
                            </div>
                            <div className="text-muted-foreground">{opt.description}</div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
