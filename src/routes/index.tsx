import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowDown, CheckCircle2, FileText, Workflow, Database, Gauge, Network, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Data Blueprint — Reusable Data & AI Framework" },
      { name: "description", content: "A reusable framework for business domains to apply Data and AI to improve operations, deliver value and meet governance standards — on Microsoft Fabric, OneLake and Agent 365, in a target data operating model." },
    ],
  }),
  component: Index,
});

const SECTIONS: { n: string; name: string; icon: any; color: string; description: string; outputs: string[] }[] = [
  {
    n: "01", name: "Context", icon: FileText, color: "oklch(0.55 0.18 255)",
    description: "Capture organisation, function, process, sponsor, volumes, timeline AND the critical inputs that frame value: operational pain, KPIs, decisions to support and compliance constraints.",
    outputs: ["Process scope & sponsor", "Operations pain & value drivers", "KPIs to move + decisions supported", "Compliance / sensitivity constraints"],
  },
  {
    n: "02", name: "Value Stream", icon: Workflow, color: "oklch(0.55 0.20 30)",
    description: "Map the AS-IS process step-by-step — roles, systems, inputs, outputs, time, frequency and pain points. The systems column auto-feeds the Data Asset Map.",
    outputs: ["Per-step roles & systems", "Pain points captured verbatim", "Automation opportunities flagged"],
  },
  {
    n: "03", name: "Use Case Priority", icon: Sparkles, color: "oklch(0.60 0.18 295)",
    description: "Identify and prioritise candidate Data & AI use cases against business impact, desirability, feasibility, solution type and data readiness.",
    outputs: ["Use case backlog", "Scoring across criteria", "Prioritised shortlist"],
  },
  {
    n: "04", name: "Data Asset Map", icon: Database, color: "oklch(0.62 0.16 155)",
    description: "Catalogue every upstream system / data asset that feeds the value stream AND every downstream system / data product produced — domain, entities, owners, refresh, sensitivity, destinations, consumers, delivery method, data contracts and Bronze / Silver / Gold fit on the Data Hive.",
    outputs: ["Upstream sources + domain + owners", "Downstream consumers & data contracts", "Bronze / Silver / Gold fit", "PII flagging & refresh cadence"],
  },
  {
    n: "05", name: "Data Quality", icon: Gauge, color: "oklch(0.68 0.16 75)",
    description: "Score every asset on the six DAMA dimensions using a 1–5 rubric: Completeness, Accuracy, Consistency, Timeliness, Uniqueness, Validity — with anchored criteria and evidence.",
    outputs: ["DQ score per asset", "Evidence captured", "Uplift targets & SLAs"],
  },
  {
    n: "06", name: "Target TOM", icon: Network, color: "oklch(0.50 0.14 195)",
    description: "Define the target data operating model — what the central CoE owns, what the business domain owns, the handshakes between them, mandatory controls and success metrics.",
    outputs: ["Central vs domain responsibilities", "Handshakes & data contracts", "Mandatory controls / HITL", "Success metrics"],
  },
  {
    n: "07", name: "Blueprint", icon: Sparkles, color: "oklch(0.60 0.18 295)",
    description: "AI-generated guidance showing exactly how Data & AI will improve operations, deliver value and meet governance — plus the activities needed to move to the target data operating model.",
    outputs: ["Operations · Value · Governance framing", "Readiness radar & dimension ranking", "Per-step Data & AI interventions", "Target operating model activity backlog", "Gap register & prioritised use cases"],
  },
];

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
              Data Hive · Microsoft Fabric · OneLake · Agent 365
            </div>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Data Blueprint
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/85 md:text-xl">
              A reusable framework for business domains to apply Data &amp; AI to <strong>improve operations</strong>,
              <strong> deliver measurable value</strong> and <strong>meet governance standards</strong> — generated as a
              blueprint on the Data Hive (Microsoft Fabric / OneLake / Agent 365) target state.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-[var(--shadow-elegant)]">
                <Link to="/blueprint">Build a Data Blueprint for a business function and business process <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/80">
              <Stat label="Sections" value="7" />
              <Stat label="DQ dimensions" value="6" />
              <Stat label="Operating model" value="Target Data Operating Model" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTIONS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">The blueprint</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Six sequential sections</h2>
          <p className="mt-3 text-muted-foreground">
            Each section produces an artefact that feeds the next — value stream → data asset
            map → data quality → target TOM → AI-generated blueprint.
          </p>
        </div>

        <div className="space-y-4">
          {SECTIONS.map((w, i) => {
            const Icon = w.icon;
            return (
              <div key={w.n}>
                <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]">
                  <div className="flex flex-col gap-6 md:flex-row md:items-start">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `color-mix(in oklab, ${w.color} 14%, white)` }}
                    >
                      <Icon className="h-7 w-7" style={{ color: w.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground">{w.n}</span>
                        <h3 className="text-xl font-semibold tracking-tight">{w.name}</h3>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{w.description}</p>

                      <div className="mt-4">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Key outputs</div>
                        <ul className="mt-1.5 grid gap-1 text-sm md:grid-cols-2">
                          {w.outputs.map((o) => (
                            <li key={o} className="flex items-start gap-1.5">
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: w.color }} />
                              <span>{o}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                {i < SECTIONS.length - 1 && (
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
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Map, score, target, generate</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { n: "01", t: "Map", d: "Document the value stream step-by-step and the data assets feeding it." },
              { n: "02", t: "Score", d: "Rate each data asset on the six DAMA dimensions using the built-in 1–5 rubric." },
              { n: "03", t: "Target", d: "Define the hub-and-spoke target operating model for OneLake + Fabric IQ." },
              { n: "04", t: "Generate", d: "AI returns executive summary, radar, prioritised recommendations and AI-agent next steps." },
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
            <Link to="/blueprint">Begin the Data Blueprint <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground md:flex-row">
          <div>FP&amp;A Data Blueprint · Reusable Data &amp; AI framework · For internal advisory use</div>
          <div>Hub-and-spoke operating model on Microsoft Fabric / OneLake / Agent 365</div>
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
