import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, FileText } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { DIMENSIONS, MATURITY_LEVELS, TOTAL_QUESTIONS, type MaturityLevel } from "@/lib/assessment-data";
import { useAssessment } from "@/lib/assessment-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assessment")({
  head: () => ({
    meta: [
      { title: "Assessment · Fabric Data Readiness for AI" },
      { name: "description", content: "Score your data platform across 6 dimensions for AI readiness." },
    ],
  }),
  component: AssessmentPage,
});

function AssessmentPage() {
  const { state, hydrated, setAnswer, setOrg, reset } = useAssessment();
  const navigate = useNavigate();
  // -1 = intro, 0..n = dimensions, n = summary
  const [step, setStep] = useState(-1);

  const dimIndex = step;
  const dimension = dimIndex >= 0 && dimIndex < DIMENSIONS.length ? DIMENSIONS[dimIndex] : null;

  const answeredCount = useMemo(
    () => Object.keys(state.answers).filter((k) => state.answers[k]).length,
    [state.answers],
  );
  const progress = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);

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
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Progress */}
        {step >= 0 && step < DIMENSIONS.length && (
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium uppercase tracking-[0.14em] text-primary">
                Dimension {step + 1} of {DIMENSIONS.length} · {dimension?.name}
              </span>
              <span>{answeredCount} / {TOTAL_QUESTIONS} answered</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {step === -1 && (
          <IntroStep
            org={state.org}
            setOrg={setOrg}
            onStart={() => setStep(0)}
            onReset={reset}
            answeredCount={answeredCount}
          />
        )}

        {dimension && (
          <DimensionStep
            key={dimension.id}
            dimension={dimension}
            answers={state.answers}
            setAnswer={setAnswer}
            onBack={() => setStep((s) => s - 1)}
            onNext={() => setStep((s) => s + 1)}
            isLast={step === DIMENSIONS.length - 1}
          />
        )}

        {step === DIMENSIONS.length && (
          <FinishStep
            answeredCount={answeredCount}
            onBack={() => setStep(DIMENSIONS.length - 1)}
            onView={() => navigate({ to: "/report" })}
          />
        )}
      </div>
    </div>
  );
}

function IntroStep({
  org, setOrg, onStart, onReset, answeredCount,
}: {
  org: { name: string; respondent: string; date: string };
  setOrg: (o: Partial<{ name: string; respondent: string; date: string }>) => void;
  onStart: () => void;
  onReset: () => void;
  answeredCount: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] md:p-10">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Before you begin</div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Tell us about your assessment</h1>
      <p className="mt-2 text-muted-foreground">
        Optional context that will appear on your final report. Your answers are saved locally in
        the browser as you go.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="org">Organization</Label>
          <Input id="org" value={org.name} onChange={(e) => setOrg({ name: e.target.value })} placeholder="Contoso Ltd" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="resp">Respondent</Label>
          <Input id="resp" value={org.respondent} onChange={(e) => setOrg({ respondent: e.target.value })} placeholder="Jane Doe — Head of Data" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={org.date} onChange={(e) => setOrg({ date: e.target.value })} />
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={onStart} className="shadow-[var(--shadow-elegant)]">
          {answeredCount > 0 ? "Continue assessment" : "Start assessment"}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
        {answeredCount > 0 && (
          <Button size="lg" variant="ghost" onClick={onReset}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset answers
          </Button>
        )}
      </div>
    </div>
  );
}

function DimensionStep({
  dimension, answers, setAnswer, onBack, onNext, isLast,
}: {
  dimension: typeof DIMENSIONS[number];
  answers: Record<string, { current: MaturityLevel; target: MaturityLevel }>;
  setAnswer: (id: string, v: { current: MaturityLevel; target: MaturityLevel }) => void;
  onBack: () => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const allAnswered = dimension.questions.every((q) => answers[q.id]);
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: dimension.color }}>
          Dimension
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">{dimension.name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{dimension.description}</p>
      </div>

      {dimension.questions.map((q, i) => {
        const a = answers[q.id];
        return (
          <div key={q.id} className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] md:p-8">
            <div className="flex items-baseline gap-3">
              <div className="text-xs font-mono text-muted-foreground">Q{i + 1}</div>
              <h3 className="text-lg font-semibold tracking-tight">{q.text}</h3>
            </div>
            <p className="mt-3 rounded-md border-l-2 border-primary/40 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Why it matters: </span>{q.relevance}
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <ScorePicker
                title="Current state"
                value={a?.current}
                onChange={(v) => setAnswer(q.id, { current: v, target: a?.target ?? v })}
                accent="oklch(0.55 0.20 30)"
                options={q.options}
              />
              <ScorePicker
                title="Target state"
                value={a?.target}
                onChange={(v) => setAnswer(q.id, { current: a?.current ?? v, target: v })}
                accent="oklch(0.45 0.18 255)"
                options={q.options}
              />
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-3">
          {!allAnswered && (
            <span className="text-xs text-muted-foreground">Answer all questions to continue</span>
          )}
          <Button onClick={onNext} disabled={!allAnswered} className="shadow-[var(--shadow-elegant)]">
            {isLast ? "Finish" : "Next dimension"} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScorePicker({
  title, value, onChange, accent, options,
}: {
  title: string;
  value: MaturityLevel | undefined;
  onChange: (v: MaturityLevel) => void;
  accent: string;
  options: { level: MaturityLevel; label: string; description: string }[];
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">{title}</h4>
      </div>
      <RadioGroup
        value={value !== undefined ? String(value) : undefined}
        onValueChange={(v) => onChange(Number(v) as MaturityLevel)}
        className="space-y-2"
      >
        {options.map((opt) => {
          const selected = value === opt.level;
          return (
            <label
              key={opt.level}
              htmlFor={`${title}-${opt.level}-${opt.description.slice(0, 6)}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all",
                selected
                  ? "border-transparent bg-primary/[0.06] ring-2"
                  : "border-border hover:border-foreground/20 hover:bg-muted/40",
              )}
              style={selected ? { boxShadow: `inset 0 0 0 2px ${accent}` } : undefined}
            >
              <RadioGroupItem
                id={`${title}-${opt.level}-${opt.description.slice(0, 6)}`}
                value={String(opt.level)}
                className="mt-1"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded text-[11px] font-semibold" style={{ background: `color-mix(in oklab, ${accent} 18%, white)`, color: accent }}>
                    {opt.level}
                  </span>
                  <span className="text-sm font-medium">{MATURITY_LEVELS[opt.level].name}</span>
                </div>
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{opt.description}</div>
              </div>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}

function FinishStep({
  answeredCount, onBack, onView,
}: { answeredCount: number; onBack: () => void; onView: () => void }) {
  const complete = answeredCount === TOTAL_QUESTIONS;
  return (
    <div className="rounded-xl border border-border bg-card p-10 text-center shadow-[var(--shadow-soft)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="h-7 w-7 text-success" />
      </div>
      <h2 className="mt-4 text-2xl font-bold tracking-tight">
        {complete ? "Assessment complete" : "Almost there"}
      </h2>
      <p className="mt-2 text-muted-foreground">
        You answered {answeredCount} of {TOTAL_QUESTIONS} questions. Generate your detailed report
        with a current vs. target maturity radar and dimension-level recommendations.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" /> Review answers</Button>
        <Button size="lg" onClick={onView} className="shadow-[var(--shadow-elegant)]">
          <FileText className="mr-2 h-4 w-4" /> View detailed report
        </Button>
      </div>
      <div className="mt-6">
        <Link to="/report" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
          Or open the report page directly
        </Link>
      </div>
    </div>
  );
}
