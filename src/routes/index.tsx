import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Database, Cpu, Sparkles, ShieldCheck, Lock, GitBranch, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { DIMENSIONS, TOTAL_QUESTIONS } from "@/lib/assessment-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fabric Data readiness assessment for AI agents" },
      { name: "description", content: "Assess your data landscape across 6 dimensions to enable AI use cases on Microsoft Fabric, Copilot Studio and Azure Foundry." },
    ],
  }),
  component: Index,
});

const ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  Download: Database, Cpu, Sparkles, ShieldCheck, Lock, GitBranch,
};

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[image:var(--gradient-hero)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,white_0%,transparent_45%)] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="max-w-3xl text-primary-foreground">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Microsoft Fabric · Copilot Studio · Foundry
            </div>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Data readiness assessment for AI agents
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/85 md:text-xl">
              Evaluate your data landscape across six dimensions and produce a current-state vs.
              target-state maturity report — the foundation for any AI use case on Fabric.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-[var(--shadow-elegant)]">
                <Link to="/assessment">Start the assessment <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/0 text-white hover:bg-white/10 hover:text-white">
                <Link to="/report">View sample report</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/80">
              <Stat label="Dimensions" value="6" />
              <Stat label="Questions" value={String(TOTAL_QUESTIONS)} />
              <Stat label="Maturity levels" value="0–5" />
              <Stat label="Output" value="Radar + recommendations" />
            </div>
          </div>
        </div>
      </section>

      {/* DIMENSIONS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">The six dimensions</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">What we assess</h2>
          <p className="mt-3 text-muted-foreground">
            Each dimension is scored on a 0–5 maturity scale for both your current state and the
            target state required to enable your AI use case.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {DIMENSIONS.map((d, i) => {
            const Icon = ICONS[d.icon] ?? Database;
            return (
              <div
                key={d.id}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-lg"
                    style={{ background: `color-mix(in oklab, ${d.color} 14%, white)` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: d.color }} />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{d.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.description}</p>
                <div className="mt-4 text-xs text-muted-foreground">{d.questions.length} questions</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-border bg-[image:var(--gradient-subtle)]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">How it works</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Three steps to your report</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Answer", d: "Work through the 18 dimension-aligned questions. Pick a current and target maturity level for each." },
              { n: "02", t: "Score", d: "Scores roll up automatically into 0–5 maturity per dimension, weighted equally across questions." },
              { n: "03", t: "Report", d: "Get a printable report with a current-vs-target radar chart and prioritised recommendations." },
            ].map((s) => (
              <div key={s.n} className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                <div className="text-xs font-mono text-primary">{s.n}</div>
                <h3 className="mt-2 text-lg font-semibold tracking-tight">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MATURITY SCALE */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Maturity scale</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">From no capability to transformational</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[
            ["0", "No capability"],
            ["1", "Limited awareness"],
            ["2", "Foundational"],
            ["3", "Developing"],
            ["4", "Established"],
            ["5", "Transformational"],
          ].map(([n, t]) => (
            <div key={n} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">{n}</div>
              <div className="text-sm font-medium">{t}</div>
              <CheckCircle2 className="ml-auto h-4 w-4 text-success" />
            </div>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <Button asChild size="lg" className="shadow-[var(--shadow-elegant)]">
            <Link to="/assessment">Begin assessment <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground md:flex-row">
          <div>Fabric Data Readiness Assessment · For internal advisory use</div>
          <div>Inspired by the Microsoft Security for AI Assessment format</div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="uppercase tracking-[0.14em] text-[11px]">{label}</div>
    </div>
  );
}
