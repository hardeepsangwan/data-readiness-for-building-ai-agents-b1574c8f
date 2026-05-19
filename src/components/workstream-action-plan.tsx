import { TrendingUp, Target } from "lucide-react";
import { stepAverages, type Workstream, type MaturityLevel } from "@/lib/assessment-data";

interface Props {
  workstream: Workstream;
  answers: Record<string, { current: MaturityLevel; target: MaturityLevel }>;
}

// Generate recommended actions to close the gap between current and target.
// For each step, find each question's gap and surface the option descriptions
// for each intermediate level — those describe what "good" looks like at that level.
export function WorkstreamActionPlan({ workstream, answers }: Props) {
  const rows = workstream.steps.map((s) => {
    const { current, target } = stepAverages(s, answers);
    const gap = Math.max(0, target - current);

    // For each question in the step, build a stepwise action ladder.
    const actions: string[] = [];
    for (const q of s.questions) {
      const a = answers[q.id];
      if (!a || a.target <= a.current) continue;
      // Take the description of the target level — that's the destination state.
      const targetOpt = q.options.find((o) => o.level === a.target);
      if (targetOpt) {
        actions.push(`To reach L${a.target} (${targetOpt.label}): ${targetOpt.description}`);
      }
    }

    return { step: s, current, target, gap, actions };
  });

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: workstream.color }}>
        <Target className="h-3.5 w-3.5" /> Steps to reach the target state
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        For each dimension assessed in this workstream, the gap below shows what's needed to move from your current state to your target state.
      </p>
      <div className="mt-4 space-y-4">
        {rows.map(({ step, current, target, gap, actions }) => (
          <div key={step.id} className="rounded-md border border-border/70 bg-background/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium text-sm">{step.name}</div>
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
            {actions.length === 0 ? (
              <div className="mt-2 text-xs text-muted-foreground">No gap — current already meets target.</div>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                    <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: workstream.color }} />
                    <span className="text-muted-foreground"><span className="text-foreground">{a}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
