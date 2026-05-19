import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Briefcase, Database, Bot, CheckCircle2, ArrowDown } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { WORKSTREAMS, TOTAL_QUESTIONS } from "@/lib/assessment-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Data Blueprint for AI Agents" },
      { name: "description", content: "An end-to-end Data Blueprint to assess and deliver AI agents — CoE governance, Business Transformation, Data Readiness and Agents Factory, aligned to Azure CAF." },
    ],
  }),
  component: Index,
});

const WS_ICONS = [ShieldCheck, Briefcase, Database, Bot];

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
              Azure CAF · Microsoft Fabric · Foundry · Agent 365
            </div>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Data Blueprint for AI Agents
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/85 md:text-xl">
              A single, gated blueprint that takes you from CoE guardrails through to deployed
              agents — four workstreams, sequential handshakes, one auditable trail.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-[var(--shadow-elegant)]">
                <Link to="/assessment">Start the blueprint <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/0 text-white hover:bg-white/10 hover:text-white">
                <Link to="/report">View sample report</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/80">
              <Stat label="Workstreams" value="4" />
              <Stat label="Steps" value="24" />
              <Stat label="Questions" value={String(TOTAL_QUESTIONS)} />
              <Stat label="Gated handshakes" value="3" />
            </div>
          </div>
        </div>
      </section>

      {/* WORKSTREAMS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">The blueprint</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Four sequential workstreams</h2>
          <p className="mt-3 text-muted-foreground">
            Each workstream produces a starred deliverable (★) that becomes the input — the
            handshake — to the next. Nothing skips ahead until its gate is signed off.
          </p>
        </div>

        <div className="space-y-4">
          {WORKSTREAMS.map((w, i) => {
            const Icon = WS_ICONS[i] ?? Database;
            const star = w.steps.find((s) => s.name.includes("★"));
            return (
              <div key={w.id}>
                <div
                  className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]"
                >
                  <div className="flex flex-col gap-6 md:flex-row md:items-start">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `color-mix(in oklab, ${w.color} 14%, white)` }}
                    >
                      <Icon className="h-7 w-7" style={{ color: w.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground">WS 0{i + 1}</span>
                        <h3 className="text-xl font-semibold tracking-tight">{w.name}</h3>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{w.description}</p>

                      <div className="mt-5 grid gap-4 md:grid-cols-3">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Steps</div>
                          <ul className="mt-1.5 space-y-1 text-sm">
                            {w.steps.map((s) => (
                              <li key={s.id} className="flex items-start gap-1.5">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: w.color }} />
                                <span>{s.short ?? s.name.replace(" ★", "")}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Star deliverable ★</div>
                          <div className="mt-1.5 rounded-md border border-border bg-muted/40 p-3 text-sm font-medium">
                            {w.keyOutput}
                          </div>
                          {star && (
                            <p className="mt-2 text-xs text-muted-foreground">{star.description}</p>
                          )}
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {w.handshakeTo ? `Handshake → ${w.handshakeTo}` : "Final outputs"}
                          </div>
                          <ul className="mt-1.5 space-y-1 text-sm">
                            {w.handshakeOutputs.slice(0, 4).map((o) => (
                              <li key={o} className="text-muted-foreground">• {o}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {i < WORKSTREAMS.length - 1 && (
                  <div className="flex justify-center py-2 text-muted-foreground">
                    <ArrowDown className="h-5 w-5" />
                  </div>
                )}
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
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Assess, gate, hand over, deliver</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { n: "01", t: "Assess", d: "Score each step on the 0–5 CAF maturity scale — current and target." },
              { n: "02", t: "Gate", d: "Sponsor signs off the handshake before the next workstream unlocks." },
              { n: "03", t: "Hand over", d: "Star deliverables flow forward: Playbook → Backlog → Scorecard → Agent." },
              { n: "04", t: "Export", d: "Per-workstream Excel workbooks plus a Master Data Blueprint." },
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
            <Link to="/assessment">Begin the Data Blueprint <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground md:flex-row">
          <div>Data Blueprint for AI Agents · For internal advisory use</div>
          <div>Aligned to Azure Cloud Adoption Framework for AI Agents</div>
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
