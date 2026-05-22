import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, FileText, MessageSquareText } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { WorkstreamStepper } from "@/components/workstream-stepper";
import { HandshakeCard } from "@/components/handshake-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { WORKSTREAMS, MATURITY_LEVELS, TOTAL_QUESTIONS, workstreamAverages, type MaturityLevel } from "@/lib/assessment-data";
import { useAssessment } from "@/lib/assessment-store";
import { useAuth } from "@/lib/auth-store";
import { saveSubmission } from "@/lib/submissions-store";
import { downloadWorkstreamExcel } from "@/lib/excel-export";
import { getOpenQuestions, renderPrompt } from "@/lib/open-questions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assessment")({
  head: () => ({
    meta: [
      { title: "Assessment · Data Blueprint for AI Agents" },
      { name: "description", content: "Four-workstream Data Blueprint assessment: CoE, Business Transformation, Foundations Data, Agents Factory." },
    ],
  }),
  component: AssessmentPage,
});

// Position model: -1 intro, then per workstream: 6 steps (0..5) + 1 handshake (6) = 7 slots each.
// After all 4 workstreams, finish step.
const SLOTS_PER_WS = 7;
const TOTAL_SLOTS = WORKSTREAMS.length * SLOTS_PER_WS;

function AssessmentPage() {
  const { state, hydrated, setAnswer, setOpenAnswer, setOrg, signGate, setAiResult, reset } = useAssessment();
  const { user, hydrated: authHydrated } = useAuth();
  const navigate = useNavigate();
  const [pos, setPos] = useState(-1);

  useEffect(() => {
    if (authHydrated && !user) navigate({ to: "/login" });
  }, [authHydrated, user, navigate]);

  const wsIndex = pos >= 0 && pos < TOTAL_SLOTS ? Math.floor(pos / SLOTS_PER_WS) : -1;
  const slotInWs = pos >= 0 ? pos % SLOTS_PER_WS : -1;
  const workstream = wsIndex >= 0 ? WORKSTREAMS[wsIndex] : null;
  const isHandshake = workstream && slotInWs === SLOTS_PER_WS - 1;
  const step = workstream && !isHandshake ? workstream.steps[slotInWs] : null;
  const isFinish = pos >= TOTAL_SLOTS;

  const answeredCount = useMemo(
    () => Object.keys(state.answers).filter((k) => state.answers[k]).length,
    [state.answers],
  );
  const progress = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);

  if (!hydrated || !authHydrated || !user) {
    return <div className="min-h-screen bg-background"><SiteHeader /></div>;
  }

  const persistSubmission = () => {
    const overall = WORKSTREAMS.map((w) => workstreamAverages(w, state.answers));
    const overallCurrent = overall.reduce((s, x) => s + x.current, 0) / overall.length;
    const overallTarget = overall.reduce((s, x) => s + x.target, 0) / overall.length;
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

  // Stepper data: show 4 workstreams with status
  const wsStepper = WORKSTREAMS.map((w, i) => {
    let status: "done" | "current" | "todo" = "todo";
    if (i < wsIndex) status = "done";
    else if (i === wsIndex) status = "current";
    return { id: w.id, name: w.name, short: w.short, status, gateSigned: !!state.gates[w.id] };
  });

  return (
    <div className="min-h-screen bg-[image:var(--gradient-subtle)]">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Workstream stepper */}
        <div className="mb-8 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <WorkstreamStepper steps={wsStepper} activeWorkstream={workstream?.name} />
        </div>

        {/* Progress */}
        {workstream && (
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium uppercase tracking-[0.14em]" style={{ color: workstream.color }}>
                {workstream.short} · {isHandshake ? "Handshake & Gate" : `Step ${slotInWs + 1} of ${workstream.steps.length} · ${step?.name}`}
              </span>
              <span>{answeredCount} / {TOTAL_QUESTIONS} answered</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {pos === -1 && (
          <IntroStep org={state.org} setOrg={setOrg} onStart={() => setPos(0)} onReset={reset} answeredCount={answeredCount} />
        )}

        {workstream && step && (
          <StepQuestions
            key={step.id}
            workstreamColor={workstream.color}
            workstreamShort={workstream.short}
            stepId={step.id}
            stepName={step.name}
            stepDescription={step.description}
            questions={step.questions}
            answers={state.answers}
            openAnswers={state.openAnswers}
            context={{ businessFunction: state.org.businessFunction, businessProcess: state.org.businessProcess }}
            setAnswer={setAnswer}
            setOpenAnswer={setOpenAnswer}
            onBack={() => { setPos((p) => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            onNext={() => { setPos((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          />
        )}

        {workstream && isHandshake && (
          <HandshakeCard
            workstream={workstream}
            answers={state.answers}
            openAnswers={state.openAnswers}
            context={{
              organisation: state.org.name,
              businessFunction: state.org.businessFunction,
              businessProcess: state.org.businessProcess,
              executiveSponsor: state.org.executiveSponsor,
              inScopeSystems: state.org.inScopeSystems,
              successDefinition: state.org.successDefinition,
              timeline: state.org.timeline,
            }}
            aiResult={state.aiResults[workstream.id]}
            onAiResult={(r) => setAiResult(workstream.id, r)}
            existing={state.gates[workstream.id]}
            defaultSignedBy={state.org.respondent}
            onSign={(sg) => signGate(workstream.id, sg)}
            onDownload={() => downloadWorkstreamExcel(state, workstream.id)}
            onBack={() => setPos((p) => p - 1)}
            onNext={() => {
              const isLastWs = wsIndex === WORKSTREAMS.length - 1;
              if (isLastWs) persistSubmission();
              setPos((p) => p + 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            nextLabel={wsIndex === WORKSTREAMS.length - 1 ? "Finish assessment" : `Continue to ${workstream.handshakeTo}`}
          />
        )}

        {isFinish && (
          <FinishStep
            answeredCount={answeredCount}
            onBack={() => setPos(TOTAL_SLOTS - 1)}
            onView={() => { persistSubmission(); navigate({ to: "/report" }); }}
          />
        )}
      </div>
    </div>
  );
}

function IntroStep({ org, setOrg, onStart, onReset, answeredCount }: {
  org: import("@/lib/assessment-store").AssessmentState["org"];
  setOrg: (o: Partial<import("@/lib/assessment-store").AssessmentState["org"]>) => void;
  onStart: () => void; onReset: () => void; answeredCount: number;
}) {
  const BUSINESS_FUNCTIONS = ["Finance & FP&A", "Sales", "Marketing", "Operations", "Supply Chain", "HR", "Customer Service", "IT", "Other"];
  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] md:p-10">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Before you begin</div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Data Blueprint Assessment</h1>
      <p className="mt-2 text-muted-foreground">
        You'll work through 4 sequential workstreams — Foundations CoE, Business Transformation, Foundations Data,
        and Agents Factory — with a gated handshake between each. The process context you provide below is sent
        with every AI analysis to ground pain points and next-best actions to your business.
      </p>

      <div className="mt-8">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Respondent</div>
        <div className="mt-3 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="org">Organization</Label>
            <Input id="org" value={org.name} onChange={(e) => setOrg({ name: e.target.value })} placeholder="Indurent" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resp">Respondent</Label>
            <Input id="resp" value={org.respondent} onChange={(e) => setOrg({ respondent: e.target.value })} placeholder="Jane Doe — Head of Data" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date of assessment</Label>
            <Input id="date" type="date" value={org.date} onChange={(e) => setOrg({ date: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Process context</div>
        <p className="mt-1 text-xs text-muted-foreground">
          The AI reasoning model uses these fields to tailor pain points and recommendations to your specific scope.
        </p>
        <div className="mt-3 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bf">Business function</Label>
            <select id="bf" value={org.businessFunction} onChange={(e) => setOrg({ businessFunction: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="">Select…</option>
              {BUSINESS_FUNCTIONS.map((bf) => <option key={bf} value={bf}>{bf}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bp">Business process</Label>
            <Input id="bp" value={org.businessProcess} onChange={(e) => setOrg({ businessProcess: e.target.value })}
              placeholder="e.g. Service Charge, Budgeting, AR Collections" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sponsor">Executive sponsor</Label>
            <Input id="sponsor" value={org.executiveSponsor}
              onChange={(e) => setOrg({ executiveSponsor: e.target.value })}
              placeholder="e.g. CFO, VP FP&A" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeline">Target timeline</Label>
            <Input id="timeline" value={org.timeline}
              onChange={(e) => setOrg({ timeline: e.target.value })}
              placeholder="e.g. MVP in 12 weeks, scale by FY26 Q2" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="systems">In-scope systems & data sources</Label>
            <Textarea id="systems" rows={2} value={org.inScopeSystems}
              onChange={(e) => setOrg({ inScopeSystems: e.target.value })}
              placeholder="e.g. D365 F&O, Anaplan, Yardi, Excel service-charge workbooks, SharePoint lease contracts" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="success">Definition of success</Label>
            <Textarea id="success" rows={2} value={org.successDefinition}
              onChange={(e) => setOrg({ successDefinition: e.target.value })}
              placeholder="e.g. Cut service-charge reconciliation cycle from 10 days to 2, with audit-ready lineage and zero manual Excel handoffs." />
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={onStart} className="shadow-[var(--shadow-elegant)]">
          {answeredCount > 0 ? "Continue assessment" : "Start assessment"} <ArrowRight className="ml-1 h-4 w-4" />
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

function StepQuestions({
  workstreamColor, workstreamShort, stepId, stepName, stepDescription, questions,
  answers, openAnswers, context, setAnswer, setOpenAnswer, onBack, onNext,
}: {
  workstreamColor: string;
  workstreamShort: string;
  stepId: string;
  stepName: string;
  stepDescription: string;
  questions: { id: string; text: string; relevance: string; options: { level: MaturityLevel; label: string; description: string }[] }[];
  answers: Record<string, { current: MaturityLevel; target: MaturityLevel }>;
  openAnswers: Record<string, string>;
  context: { businessFunction: string; businessProcess: string };
  setAnswer: (id: string, v: { current: MaturityLevel; target: MaturityLevel }) => void;
  setOpenAnswer: (id: string, v: string) => void;
  onBack: () => void; onNext: () => void;
}) {
  const [qIndex, setQIndex] = useState(0);
  const total = questions.length;
  const q = questions[qIndex];
  const a = answers[q.id];
  const isAnswered = !!a;
  const isFirstQ = qIndex === 0;
  const isLastQ = qIndex === total - 1;
  const openQs = getOpenQuestions(stepId);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: workstreamColor }}>
          {workstreamShort} · Step
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">{stepName}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{stepDescription}</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium uppercase tracking-[0.14em] text-primary">
            Question {qIndex + 1} of {total}
          </span>
          <div className="ml-2 flex flex-1 gap-1">
            {questions.map((qq, i) => (
              <div key={qq.id} className={cn("h-1 flex-1 rounded-full",
                i === qIndex ? "bg-primary" : answers[qq.id] ? "bg-primary/40" : "bg-muted")} />
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
          <ScorePicker title="Current state" value={a?.current} onChange={(v) => setAnswer(q.id, { current: v, target: a?.target ?? v })}
            accent="oklch(0.55 0.20 30)" options={q.options} />
          <ScorePicker title="Target state" value={a?.target} onChange={(v) => setAnswer(q.id, { current: a?.current ?? v, target: v })}
            accent={workstreamColor} options={q.options} />
        </div>
      </div>

      {/* Open-text discovery questions, sourced from the Data Blueprint templates */}
      {isLastQ && openQs.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] md:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: workstreamColor }}>
            <MessageSquareText className="h-3.5 w-3.5" /> Discovery questions — {stepName}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Your free-text answers are sent (together with the maturity ratings above) to a reasoning AI model
            that produces the pain-points and next-best-actions at the end of this workstream.
          </p>
          <div className="mt-4 space-y-4">
            {openQs.map((oq, i) => (
              <div key={oq.id} className="space-y-2">
                <Label htmlFor={oq.id} className="text-sm font-medium">
                  <span className="mr-2 font-mono text-[10px] text-muted-foreground">D{i + 1}</span>
                  {renderPrompt(oq.prompt, context)}
                </Label>
                <Textarea id={oq.id} rows={3} value={openAnswers[oq.id] ?? ""}
                  onChange={(e) => setOpenAnswer(oq.id, e.target.value)}
                  placeholder={oq.placeholder ? renderPrompt(oq.placeholder, context) : "Type your answer…"} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button variant="outline" onClick={() => { if (isFirstQ) onBack(); else { setQIndex((i) => i - 1); window.scrollTo({ top: 0, behavior: "smooth" }); } }}>
          <ArrowLeft className="mr-1 h-4 w-4" /> {isFirstQ ? "Back" : "Previous"}
        </Button>
        <div className="flex items-center gap-3">
          {!isAnswered && <span className="text-xs text-muted-foreground">Answer to continue</span>}
          <Button onClick={() => { if (isLastQ) onNext(); else { setQIndex((i) => i + 1); window.scrollTo({ top: 0, behavior: "smooth" }); } }}
            disabled={!isAnswered} className="shadow-[var(--shadow-elegant)]">
            {isLastQ ? "Next step" : "Next"} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScorePicker({ title, value, onChange, accent, options }: {
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
      <RadioGroup value={value !== undefined ? String(value) : undefined}
        onValueChange={(v) => onChange(Number(v) as MaturityLevel)} className="space-y-2">
        {options.map((opt) => {
          const selected = value === opt.level;
          const maturityName = MATURITY_LEVELS[opt.level].name;
          return (
            <label key={opt.level} htmlFor={`${title}-${opt.level}`}
              className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all",
                selected ? "border-transparent bg-primary/[0.06] ring-2" : "border-border hover:border-foreground/20 hover:bg-muted/40")}
              style={selected ? { boxShadow: `inset 0 0 0 2px ${accent}` } : undefined}>
              <RadioGroupItem id={`${title}-${opt.level}`} value={String(opt.level)} className="mt-1" />
              <div className="min-w-0 flex-1">
                <div className="text-sm leading-relaxed text-foreground">{opt.description}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded text-[10px] font-semibold"
                    style={{ background: `color-mix(in oklab, ${accent} 18%, white)`, color: accent }}>{opt.level}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Auto-classified: {maturityName}
                  </span>
                </div>
              </div>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}

function FinishStep({ answeredCount, onBack, onView }: { answeredCount: number; onBack: () => void; onView: () => void }) {
  const complete = answeredCount === TOTAL_QUESTIONS;
  return (
    <div className="rounded-xl border border-border bg-card p-10 text-center shadow-[var(--shadow-soft)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="h-7 w-7 text-success" />
      </div>
      <h2 className="mt-4 text-2xl font-bold tracking-tight">{complete ? "Assessment complete" : "Almost there"}</h2>
      <p className="mt-2 text-muted-foreground">
        You answered {answeredCount} of {TOTAL_QUESTIONS} questions across 4 workstreams. Generate your Data Blueprint report
        with per-workstream maturity, gap analysis, use case prioritisation and downloadable Excel artefacts.
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
