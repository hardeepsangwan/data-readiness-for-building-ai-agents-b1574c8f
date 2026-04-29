import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, Printer, FileText, TrendingUp, Target, AlertCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { MaturityRadar } from "@/components/maturity-radar";
import targetStateArchitecture from "@/assets/target-state-architecture.png";
import { DIMENSIONS, MATURITY_LEVELS, TOTAL_QUESTIONS, type MaturityLevel } from "@/lib/assessment-data";
import { useAssessment } from "@/lib/assessment-store";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Detailed Report · Fabric Data Readiness for AI" },
      { name: "description", content: "Current and target maturity report across 6 data dimensions for AI on Microsoft Fabric." },
    ],
  }),
  component: ReportPage,
});

function maturityName(score: number): string {
  const rounded = Math.round(score) as MaturityLevel;
  return MATURITY_LEVELS[Math.max(0, Math.min(5, rounded))].name;
}

function ReportPage() {
  const { state, hydrated } = useAssessment();

  const summary = useMemo(() => {
    return DIMENSIONS.map((d) => {
      const answered = d.questions.filter((q) => state.answers[q.id]);
      const cur = answered.length
        ? answered.reduce((s, q) => s + state.answers[q.id].current, 0) / answered.length
        : 0;
      const tgt = answered.length
        ? answered.reduce((s, q) => s + state.answers[q.id].target, 0) / answered.length
        : 0;
      return { dim: d, current: cur, target: tgt, gap: tgt - cur, answered: answered.length };
    });
  }, [state.answers]);

  const overallCurrent = summary.reduce((s, x) => s + x.current, 0) / summary.length;
  const overallTarget = summary.reduce((s, x) => s + x.target, 0) / summary.length;
  const answeredCount = Object.keys(state.answers).length;
  const isEmpty = answeredCount === 0;

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[image:var(--gradient-subtle)]">
      <SiteHeader />

      {/* Toolbar */}
      <div className="no-print border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/assessment"><ArrowLeft className="mr-1 h-4 w-4" /> Back to assessment</Link>
          </Button>
          <Button size="sm" onClick={() => typeof window !== "undefined" && window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 print:py-6">
        {/* Cover */}
        <div className="overflow-hidden rounded-2xl bg-[image:var(--gradient-hero)] p-10 text-primary-foreground shadow-[var(--shadow-elegant)] print-shadow-none print:rounded-none">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
            Microsoft Fabric · Data Readiness for AI
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Data Readiness Assessment — Detailed Report
          </h1>
          <p className="mt-3 max-w-2xl text-white/85">
            Current state vs. target state maturity across six data dimensions required to enable
            AI use cases on Microsoft Fabric, Copilot Studio and Azure Foundry.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <CoverField label="Organization" value={state.org.name || "—"} />
            <CoverField label="Respondent" value={state.org.respondent || "—"} />
            <CoverField label="Date" value={state.org.date || "—"} />
          </div>
        </div>

        {isEmpty && (
          <div className="mt-8 flex items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 p-5 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 text-warning" />
            <div>
              No answers found yet. <Link to="/assessment" className="font-medium underline">Start the assessment</Link> to populate this report. Sample zeroed scores are shown below.
            </div>
          </div>
        )}

        {/* Overall results */}
        <section className="mt-10">
          <SectionHeader kicker="Overall results" title="Maturity at a glance" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" /> Current state
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-5xl font-bold tracking-tight">{overallCurrent.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">/ 5</div>
              </div>
              <div className="mt-1 text-sm font-medium" style={{ color: "oklch(0.55 0.20 30)" }}>
                {maturityName(overallCurrent)}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                <Target className="h-3.5 w-3.5" /> Target state
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-5xl font-bold tracking-tight">{overallTarget.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">/ 5</div>
              </div>
              <div className="mt-1 text-sm font-medium text-primary">{maturityName(overallTarget)}</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Coverage
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-5xl font-bold tracking-tight">{answeredCount}</div>
                <div className="text-sm text-muted-foreground">/ {TOTAL_QUESTIONS} answered</div>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Average gap: <span className="font-medium text-foreground">{(overallTarget - overallCurrent).toFixed(1)}</span> levels
              </div>
            </div>
          </div>
        </section>

        {/* Target State Architecture */}
        <section className="mt-10 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] md:p-8 print-break">
          <SectionHeader
            kicker="Reference architecture"
            title="Target state — Data & AI architecture"
          />
          <p className="mb-5 max-w-3xl text-sm text-muted-foreground">
            Unified data platform on Microsoft Fabric powering AI agents through Fabric IQ,
            Foundry IQ and M365 Work IQ — with Microsoft Agent 365 controlling all agent
            governance, access and security across the estate.
          </p>
          <div className="overflow-hidden rounded-lg border border-border bg-white">
            <img
              src={targetStateArchitecture}
              alt="Target state — Unified data platform for AI and Analytics on Microsoft Fabric, showing data ingestion from Excel, Anaplan, D365 F&O and other sources through OneLake medallion layers, Fabric IQ and Foundry IQ grounding, and consumption by Power BI, M365 Copilot, Copilot Studio and Foundry Agents — all governed by Microsoft Agent 365 and Purview."
              className="block h-auto w-full"
              loading="lazy"
            />
          </div>
        </section>

        {/* Radar */}
        <section className="mt-10 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] md:p-8">
          <SectionHeader kicker="Radar" title="Current vs. target across the 6 dimensions" />
          <MaturityRadar state={state} />
        </section>

        {/* Per-dimension breakdown */}
        <section className="mt-10 print-break">
          <SectionHeader kicker="Breakdown" title="Maturity by dimension" />
          <div className="grid gap-4 md:grid-cols-2">
            {summary.map(({ dim, current, target, gap }) => (
              <div key={dim.id} className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: dim.color }}>
                      {dim.short}
                    </div>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight">{dim.name}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold tracking-tight">{current.toFixed(1)} → {target.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Gap: {gap.toFixed(1)}</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{dim.description}</p>
                <div className="mt-4">
                  <DualBar current={current} target={target} accent={dim.color} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span style={{ color: "oklch(0.55 0.20 30)" }}>Current: <strong>{maturityName(current)}</strong></span>
                  <span className="text-primary">Target: <strong>{maturityName(target)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Detailed answers */}
        <section className="mt-10 print-break">
          <SectionHeader kicker="Assessment detail" title="Questions, answers and recommendations" />
          <div className="space-y-8">
            {DIMENSIONS.map((d) => (
              <div key={d.id} className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] md:p-8">
                <div className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: d.color }}>
                  Dimension
                </div>
                <h3 className="mt-1 text-xl font-bold tracking-tight">{d.name}</h3>
                <div className="mt-6 space-y-6">
                  {d.questions.map((q, i) => {
                    const a = state.answers[q.id];
                    return (
                      <div key={q.id} className="border-l-2 border-border pl-5">
                        <div className="text-xs font-mono text-muted-foreground">Q{i + 1}</div>
                        <div className="font-medium leading-snug">{q.text}</div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <AnswerBlock
                            label="Current"
                            level={a?.current}
                            text={a !== undefined ? q.options[a.current].description : "Not answered"}
                            accent="oklch(0.55 0.20 30)"
                          />
                          <AnswerBlock
                            label="Target"
                            level={a?.target}
                            text={a !== undefined ? q.options[a.target].description : "Not answered"}
                            accent="oklch(0.45 0.18 255)"
                          />
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">Why it matters: </span>{q.relevance}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recommendations */}
        <section className="mt-10 print-break">
          <SectionHeader kicker="Next steps" title="Prioritised recommendations" />
          <div className="grid gap-4 md:grid-cols-2">
            {summary
              .slice()
              .sort((a, b) => b.gap - a.gap)
              .map(({ dim, gap, current, target }) => (
                <div key={dim.id} className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: dim.color }}>
                      {dim.short}
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        background: gap >= 2 ? "oklch(0.95 0.06 27)" : gap >= 1 ? "oklch(0.96 0.08 80)" : "oklch(0.94 0.06 155)",
                        color: gap >= 2 ? "oklch(0.45 0.20 27)" : gap >= 1 ? "oklch(0.45 0.16 75)" : "oklch(0.40 0.14 155)",
                      }}
                    >
                      {gap >= 2 ? "High priority" : gap >= 1 ? "Medium priority" : "Maintain"}
                    </span>
                  </div>
                  <h3 className="mt-1 font-semibold">{dim.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Move from <strong>{maturityName(current)}</strong> to <strong>{maturityName(target)}</strong>
                    {" "}({gap.toFixed(1)} levels). {recommendationText(dim.id, gap)}
                  </p>
                </div>
              ))}
          </div>
        </section>

        <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          <FileText className="mx-auto mb-2 h-4 w-4" />
          Fabric Data Readiness for AI · Detailed report · Generated from your responses.
        </footer>
      </div>
    </div>
  );
}

function CoverField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur">
      <div className="text-[11px] uppercase tracking-[0.14em] text-white/70">{label}</div>
      <div className="mt-1 truncate font-medium">{value}</div>
    </div>
  );
}

function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-5">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{kicker}</div>
      <h2 className="mt-1 text-2xl font-bold tracking-tight">{title}</h2>
    </div>
  );
}

function DualBar({ current, target, accent }: { current: number; target: number; accent: string }) {
  return (
    <div className="space-y-2">
      <BarRow label="Current" value={current} color="oklch(0.55 0.20 30)" />
      <BarRow label="Target" value={target} color={accent} />
    </div>
  );
}

function BarRow({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono">{value.toFixed(1)} / 5</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function AnswerBlock({
  label, level, text, accent,
}: { label: string; level: MaturityLevel | undefined; text: string; accent: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
        {label}
        {level !== undefined && (
          <span
            className="ml-auto inline-flex h-5 items-center rounded px-1.5 text-[11px] font-semibold"
            style={{ background: `color-mix(in oklab, ${accent} 15%, white)`, color: accent }}
          >
            Level {level} · {MATURITY_LEVELS[level].name}
          </span>
        )}
      </div>
      <div className="mt-1.5 text-sm leading-relaxed">{text}</div>
    </div>
  );
}

function recommendationText(dimId: string, gap: number): string {
  const tips: Record<string, string> = {
    ingestion: "Invest in (or extend) a metadata-driven ingestion framework so new sources can be onboarded by config rather than code, with standard CDC patterns and centralised monitoring.",
    processing: "Standardise reusable Fabric notebooks for SCD2, document natural keys as mandatory technical metadata, and enforce medallion contracts.",
    consumption: "Build (or harden) an enterprise semantic / ontology layer with certified Direct Lake models, glossary terms and synonyms — the grounding surface for Copilot and Foundry agents.",
    quality: "Define DQ rules per certified dataset, monitor with scorecards, and gate AI surfaces on quality SLAs.",
    governance: "Assign owners and stewards in Microsoft Purview, classify and label sensitive data, and enforce least-privilege RLS/OLS for AI consumers.",
    cicd: "Adopt Fabric Git integration with Azure DevOps pipelines, enforce branching and PR reviews, and add automated data + AI-eval tests as promotion gates.",
  };
  const base = tips[dimId] ?? "";
  if (gap <= 0) return "Maintain the current state and look for opportunities to extend this capability further.";
  return base;
}
