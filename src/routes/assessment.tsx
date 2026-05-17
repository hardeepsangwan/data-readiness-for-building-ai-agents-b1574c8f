import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, FileText } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { HorizontalStepper } from "@/components/horizontal-stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { DIMENSIONS, MATURITY_LEVELS, TOTAL_QUESTIONS, type MaturityLevel } from "@/lib/assessment-data";
import { useAssessment } from "@/lib/assessment-store";
import { useAuth } from "@/lib/auth-store";
import { saveSubmission } from "@/lib/submissions-store";
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
  const { user, hydrated: authHydrated } = useAuth();
  const navigate = useNavigate();
  // -1 = intro, 0..n = dimensions, n = summary
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (authHydrated && !user) navigate({ to: "/login" });
  }, [authHydrated, user, navigate]);

  const dimIndex = step;
  const dimension = dimIndex >= 0 && dimIndex < DIMENSIONS.length ? DIMENSIONS[dimIndex] : null;

  const answeredCount = useMemo(
    () => Object.keys(state.answers).filter((k) => state.answers[k]).length,
    [state.answers],
  );
  const progress = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);

  // Build stepper data based on per-dimension completion + current step
  const stepperSteps = useMemo(() => {
    return DIMENSIONS.map((d, i) => {
      const allAnswered = d.questions.every((q) => state.answers[q.id]);
      let status: "done" | "current" | "todo" = "todo";
      if (i < step && allAnswered) status = "done";
      else if (i === step) status = "current";
      else if (allAnswered) status = "done";
      return { label: d.name, short: d.name, status };
    });
  }, [state.answers, step]);

  if (!hydrated || !authHydrated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
      </div>
    );
  }

  const persistSubmission = () => {
    const summary = DIMENSIONS.map((d) => {
      const answered = d.questions.filter((q) => state.answers[q.id]);
      const cur = answered.length
        ? answered.reduce((s, q) => s + state.answers[q.id].current, 0) / answered.length
        : 0;
      const tgt = answered.length
        ? answered.reduce((s, q) => s + state.answers[q.id].target, 0) / answered.length
        : 0;
      return { cur, tgt };
    });
    const overallCurrent = summary.reduce((s, x) => s + x.cur, 0) / summary.length;
    const overallTarget = summary.reduce((s, x) => s + x.tgt, 0) / summary.length;
    saveSubmission({
      id: `${user.email}-${Date.now()}`,
      email: user.email,
      role: user.role,
      submittedAt: new Date().toISOString(),
      state,
      overallCurrent,
      overallTarget,
    });
  };

  return (
    <div className="min-h-screen bg-[image:var(--gradient-subtle)]">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Horizontal stepper across all dimensions */}
        <div className="mb-8 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <HorizontalStepper steps={stepperSteps} introActive={step === -1} />
        </div>

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
            onBack={() => { setStep((s) => s - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            onNext={() => {
              setStep((s) => s + 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
              // If this was the last dimension, persist the submission
              if (step === DIMENSIONS.length - 1) persistSubmission();
            }}
            isLast={step === DIMENSIONS.length - 1}
          />
        )}

        {step === DIMENSIONS.length && (
          <FinishStep
            answeredCount={answeredCount}
            onBack={() => setStep(DIMENSIONS.length - 1)}
            onView={() => { persistSubmission(); navigate({ to: "/report" }); }}
          />
        )}
      </div>
    </div>
  );
}

function IntroStep({
  org, setOrg, onStart, onReset, answeredCount,
}: {
  org: {
    name: string;
    respondent: string;
    date: string;
    businessFunction: string;
    businessProcess: string;
  };
  setOrg: (o: Partial<{ name: string; respondent: string; date: string; businessFunction: string; businessProcess: string }>) => void;
  onStart: () => void;
  onReset: () => void;
  answeredCount: number;
}) {
  const BUSINESS_FUNCTIONS = [
    "Finance & FP&A",
    "Sales",
    "Marketing",
    "Operations",
    "Supply Chain",
    "HR",
    "Customer Service",
    "IT",
    "Other",
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] md:p-10">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Before you begin</div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Tell us about your assessment</h1>
      <p className="mt-2 text-muted-foreground">
        Capture the org, business function and business process this assessment is being run
        against. Answers are saved locally so you can come back to them.
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
          <Label htmlFor="bf">Business function</Label>
          <select
            id="bf"
            value={org.businessFunction}
            onChange={(e) => setOrg({ businessFunction: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {BUSINESS_FUNCTIONS.map((bf) => (
              <option key={bf} value={bf}>{bf}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bp">Business process</Label>
          <Input
            id="bp"
            value={org.businessProcess}
            onChange={(e) => setOrg({ businessProcess: e.target.value })}
            placeholder="e.g. Service Charge, Budgeting, AR Collections"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date of assessment</Label>
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
  const [qIndex, setQIndex] = useState(0);
  const lastDimRef = useRef(dimension.id);
  useEffect(() => {
    if (lastDimRef.current !== dimension.id) {
      lastDimRef.current = dimension.id;
      setQIndex(0);
    }
  }, [dimension.id]);

  const total = dimension.questions.length;
  const q = dimension.questions[qIndex];
  const a = answers[q.id];
  const isAnswered = !!a;
  const isFirstQ = qIndex === 0;
  const isLastQ = qIndex === total - 1;

  const handlePrev = () => {
    if (isFirstQ) {
      onBack();
    } else {
      setQIndex((i) => i - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const handleNext = () => {
    if (isLastQ) {
      onNext();
    } else {
      setQIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: dimension.color }}>
          Dimension
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">{dimension.name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{dimension.description}</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium uppercase tracking-[0.14em] text-primary">
            Question {qIndex + 1} of {total}
          </span>
          <div className="ml-2 flex flex-1 gap-1">
            {dimension.questions.map((qq, i) => (
              <div
                key={qq.id}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  i === qIndex
                    ? "bg-primary"
                    : answers[qq.id]
                    ? "bg-primary/40"
                    : "bg-muted",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] md:p-8">
        <div className="flex items-baseline gap-3">
          <div className="text-xs font-mono text-muted-foreground">Q{qIndex + 1}</div>
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

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button variant="outline" onClick={handlePrev}>
          <ArrowLeft className="mr-1 h-4 w-4" /> {isFirstQ ? "Back" : "Previous"}
        </Button>
        <div className="flex items-center gap-3">
          {!isAnswered && (
            <span className="text-xs text-muted-foreground">Answer to continue</span>
          )}
          <Button onClick={handleNext} disabled={!isAnswered} className="shadow-[var(--shadow-elegant)]">
            {isLastQ ? (isLast ? "Finish" : "Next dimension") : "Next"} <ArrowRight className="ml-1 h-4 w-4" />
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
