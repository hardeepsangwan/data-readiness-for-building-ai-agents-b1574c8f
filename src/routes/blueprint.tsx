import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileDown, Loader2, Plus, RotateCcw, Sparkles, Square, Trash2, Upload, Wand2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useBlueprint } from "@/lib/blueprint-store";
import { startBlueprintJob, getBlueprintJob } from "@/lib/blueprint.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { BlueprintRadar } from "@/components/blueprint-radar";
import { BlueprintHorizontalBars } from "@/components/blueprint-horizontal-bars";
import { exportElementToPdf } from "@/lib/pdf-export";
import targetArchitectureDiagram from "@/assets/target-state-architecture.png";
import dataHiveTargetState from "@/assets/data-hive-target-state.png";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SERVICE_CHARGE_CONTEXT,
  SERVICE_CHARGE_STEPS,
  SERVICE_CHARGE_ASSETS,
} from "@/lib/blueprint-template";
import type {
  ProcessStep,
  DataAsset,
  DownstreamAsset,
  DataQualityScore,
  AutomationClass,
  DataHiveStatus,
  RAG,
} from "@/lib/blueprint-schema";

export const Route = createFileRoute("/blueprint")({
  head: () => ({
    meta: [
      { title: "Data Blueprint — Executable Framework" },
      { name: "description", content: "Document any business process, map data assets, score data quality, then let AI generate the hub-and-spoke transformation blueprint." },
    ],
  }),
  component: BlueprintPage,
});

const AUTOMATION_OPTIONS: AutomationClass[] = ["RETAIN", "OPTIMISE", "AUTOMATE+HUMAN", "AUTOMATE FULL", "CONTROL"];
const HIVE_OPTIONS: DataHiveStatus[] = ["None", "Bronze", "Silver", "Gold"];
const RAG_OPTIONS: RAG[] = ["Red", "Amber", "Green"];

const DQ_CRITERIA: { dim: string; what: string; poor: string; ok: string; great: string }[] = [
  { dim: "Completeness", what: "% of mandatory fields populated vs expected.", poor: "Many critical fields blank; nulls block downstream use.", ok: "Most mandatory fields populated; some optional fields missing.", great: "≥99% of mandatory fields populated; nulls tracked + justified." },
  { dim: "Accuracy", what: "Values match the real-world entity / source of truth.", poor: "Frequent factual errors; no reconciliation.", ok: "Periodic reconciliation; minor known discrepancies.", great: "Continuous reconciliation against source of truth; <1% error." },
  { dim: "Consistency", what: "Same value across systems / records (e.g. customer ID).", poor: "Same entity represented differently across systems; no MDM.", ok: "Some cross-system mapping; manual reconciliation.", great: "Mastered keys + golden record; automated cross-system consistency." },
  { dim: "Timeliness", what: "Data is fresh enough for the intended decision / use case.", poor: "Stale by days/weeks; SLA undefined.", ok: "Refresh meets most use cases; occasional lag.", great: "Near real-time or meets defined SLA every cycle, monitored." },
  { dim: "Uniqueness", what: "No unintended duplicate records for the same entity.", poor: "Duplicates common; no dedup logic.", ok: "Dedup applied periodically; residual duplicates known.", great: "Natural keys enforced; duplicates prevented at ingestion." },
  { dim: "Validity", what: "Values conform to defined formats, ranges, code lists.", poor: "No schema validation; invalid codes / formats common.", ok: "Schema + reference data validated at load; some quarantine.", great: "Contract tests + reference data governance; invalid rows rejected with lineage." },
];

type UCParam = "businessValue" | "frequency" | "dataReadiness" | "feasibility" | "effort" | "risk" | "alignment";
const UC_PARAMS: { key: UCParam; label: string; definition: string; s1: string; s2: string; s3: string; s4: string; s5: string }[] = [
  { key: "businessValue", label: "Business Value", definition: "Effort, cost or error saved across the cycle.", s1: "Minor effort saved", s2: "Modest, single-team", s3: "Material per cycle", s4: "Significant cross-team", s5: "Transformational (multi-day or audit-grade)" },
  { key: "frequency", label: "Frequency / Volume", definition: "How often the pain recurs and at what scale.", s1: "Annual / one-off", s2: "Quarterly", s3: "Monthly, single team", s4: "Monthly across stacks", s5: "Continuous / per-transaction at 100s–1000s scale" },
  { key: "dataReadiness", label: "Data Readiness", definition: "Quality and accessibility of the source data today.", s1: "Unstructured / paper", s2: "Partially structured, multiple sources", s3: "Structured but manual extracts", s4: "Structured + accessible via Power BI / SOP-defined", s5: "Already in Data Hive or canonical system" },
  { key: "feasibility", label: "Technical Feasibility", definition: "Maturity of the solution pattern and tooling fit.", s1: "Net-new pattern, unknowns", s2: "Bespoke build needed", s3: "Known pattern, needs adaptation", s4: "Standard agent / Power Automate fit", s5: "Already prototyped or vendor-ready" },
  { key: "effort", label: "Implementation Effort", definition: "Lower effort = higher score (L/M/H inverted).", s1: "Very high effort (>6 months)", s2: "High effort (3–6 months)", s3: "Medium effort (~3 months)", s4: "Low effort (4–8 weeks)", s5: "Very low effort (<4 weeks)" },
  { key: "risk", label: "Risk / Control Improvement", definition: "Reduces SOP control, audit or compliance risk.", s1: "Neutral", s2: "Marginal control uplift", s3: "Replaces a manual control", s4: "Strengthens a named SOP control", s5: "Closes a flagged SFR / TAX risk" },
  { key: "alignment", label: "Strategic Alignment", definition: "Fit with agentic, governance & Data Hive agenda.", s1: "Tangential", s2: "Useful but isolated", s3: "Aligned with one workstream", s4: "Aligned with multiple workstreams", s5: "Anchor use case for the programme" },
];

type UseCaseRow = {
  id: string;
  name: string;
  processArea: string;
  businessValue: number;
  frequency: number;
  dataReadiness: number;
  feasibility: number;
  effort: number;
  risk: number;
  alignment: number;
};
const newUseCase = (n: number): UseCaseRow => ({
  id: `UC-${String(n).padStart(2, "0")}`,
  name: "",
  processArea: "",
  businessValue: 3, frequency: 3, dataReadiness: 3, feasibility: 3, effort: 3, risk: 3, alignment: 3,
});
const ucTotal = (u: UseCaseRow) => UC_PARAMS.reduce((s, p) => s + (u[p.key] as number), 0);
const ucTier = (t: number) => t >= 28 ? { label: "Tier 1 — Now", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" } : t >= 22 ? { label: "Tier 2 — Next", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" } : { label: "Tier 3 — Later", cls: "bg-slate-500/15 text-slate-700 border-slate-500/30" };

function newStep(): ProcessStep {
  return {
    id: `S-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    stepNumber: 1,
    subProcess: "",
    description: "",
    role: "",
    systemTool: "",
    dataInput: "",
    dataOutput: "",
    time: "",
    frequency: "",
    painPoint: false,
    painPointDescription: "",
    automationOpportunity: "",
    priority: "",
    dataAssetRef: "",
  };
}

// Parse a draw.io / diagrams.net file (XML or compressed) and return ordered ProcessStep[].
async function parseDrawio(file: File): Promise<ProcessStep[]> {
  const pako = await import("pako");
  const text = await file.text();
  const parser = new DOMParser();
  let xmlDoc = parser.parseFromString(text, "application/xml");

  // If <mxfile><diagram>...</diagram></mxfile>, diagram body may be deflate-compressed + base64-encoded.
  const diagramEl = xmlDoc.querySelector("diagram");
  if (diagramEl && !xmlDoc.querySelector("mxGraphModel")) {
    const raw = (diagramEl.textContent || "").trim();
    try {
      const bin = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
      const inflated = pako.inflateRaw(bin, { to: "string" });
      const decoded = decodeURIComponent(inflated);
      xmlDoc = parser.parseFromString(decoded, "application/xml");
    } catch {
      // assume already plain XML inside <diagram>
      xmlDoc = parser.parseFromString(raw, "application/xml");
    }
  }

  const cells = Array.from(xmlDoc.querySelectorAll("mxCell"));
  type Node = { id: string; label: string; x: number; y: number };
  const nodes = new Map<string, Node>();
  const edges: { source: string; target: string }[] = [];

  const stripHtml = (s: string) => s.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();

  for (const c of cells) {
    const id = c.getAttribute("id") || "";
    const isVertex = c.getAttribute("vertex") === "1";
    const isEdge = c.getAttribute("edge") === "1";
    const value = stripHtml(c.getAttribute("value") || "");
    if (isVertex && value) {
      const geom = c.querySelector("mxGeometry");
      const x = Number(geom?.getAttribute("x") || 0);
      const y = Number(geom?.getAttribute("y") || 0);
      nodes.set(id, { id, label: value, x, y });
    } else if (isEdge) {
      const src = c.getAttribute("source") || "";
      const tgt = c.getAttribute("target") || "";
      if (src && tgt) edges.push({ source: src, target: tgt });
    }
  }

  // Order: topologically by edges; fall back to (y, x).
  let ordered: Node[] = [];
  if (edges.length && nodes.size) {
    const incoming = new Map<string, number>();
    nodes.forEach((_, id) => incoming.set(id, 0));
    edges.forEach((e) => { if (nodes.has(e.target)) incoming.set(e.target, (incoming.get(e.target) || 0) + 1); });
    const queue = Array.from(nodes.values()).filter((n) => (incoming.get(n.id) || 0) === 0).sort((a, b) => a.y - b.y || a.x - b.x);
    const adj = new Map<string, string[]>();
    edges.forEach((e) => { const a = adj.get(e.source) || []; a.push(e.target); adj.set(e.source, a); });
    const seen = new Set<string>();
    while (queue.length) {
      const n = queue.shift()!;
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      ordered.push(n);
      (adj.get(n.id) || []).forEach((tid) => {
        const node = nodes.get(tid);
        if (node && !seen.has(tid)) queue.push(node);
      });
    }
    // append any unseen
    nodes.forEach((n) => { if (!seen.has(n.id)) ordered.push(n); });
  } else {
    ordered = Array.from(nodes.values()).sort((a, b) => a.y - b.y || a.x - b.x);
  }

  return ordered.map((n, i) => {
    const parts = n.label.split(/\s*[\|:•·]\s*|\s+—\s+/);
    const sub = parts[0]?.slice(0, 60) || `Step ${i + 1}`;
    const desc = parts.slice(1).join(" — ") || n.label;
    return {
      ...newStep(),
      id: `S-${String(i + 1).padStart(2, "0")}`,
      stepNumber: i + 1,
      subProcess: sub,
      description: desc,
    };
  });
}



function newAssetFromSystem(id: string, source: string): DataAsset {
  return {
    id, source, domain: "", entities: "", accessMethod: "", businessOwner: "", technicalOwner: "",
    refresh: "", pii: false, dataHiveStatus: "None", bronzeFit: "", silverFit: "", goldFit: "",
    overallRag: "", notes: "",
  };
}

function newDownstream(n: number): DownstreamAsset {
  return {
    id: `DP-${String(n).padStart(3, "0")}`,
    name: "", destination: "", consumerDomain: "", format: "", deliveryMethod: "",
    refreshCadence: "", qualityExpectation: "", dataContractExists: "",
    targetHiveLayer: "", classification: "", glossaryTerm: "",
    dataOwner: "", dataSteward: "", notes: "",
  };
}

const JOB_STORAGE_KEY = "indurent-blueprint-job-v1";

const HUB_PILLARS: { pillar: string; headline: string; bullets: string[] }[] = [
  {
    pillar: "Value",
    headline: "Define the value the CoE needs to create for business domains.",
    bullets: [
      "Ensure our data stack can scale",
      "Improve data readiness for AI (e.g. metadata, quality)",
      "Enable faster data refreshes",
      "Provide 1–2 spaces for self-serve",
    ],
  },
  {
    pillar: "Platform",
    headline: "Build a self-serve data platform (workspaces, data, tools, guardrails, policies, monitoring, integration, data sharing).",
    bullets: [
      "Data Hive being built in Microsoft Fabric by the Data Engineering team (Data & AI)",
      "Single OneLake tenant; Fabric capacities sized per domain",
      "Standardised workspaces, guardrails and policies for all spokes",
    ],
  },
  {
    pillar: "Product",
    headline: "Define and build reusable data products (data models, BI, AI) to support common use cases across domains.",
    bullets: [
      "Data Engineering starting with the Tenancy Schedule — rebuilding a well-architected Medallion Architecture in Data Hive",
      "AI & Data Science team building reusable AI products that benefit all business domains",
    ],
  },
  {
    pillar: "Process",
    headline: "Define and automate CoE processes to support data product creation, management and governance.",
    bullets: [
      "Reusable patterns for data ingestion, transformation and serving",
      "Data contracts, metadata management and DQ tests for all data",
    ],
  },
  {
    pillar: "People",
    headline: "Define the CoE structure for platform ops and data-product enablement.",
    bullets: [
      "Data & AI team almost at target state (minor capacity gaps)",
      "Focus shifts to broader Tech — Apps / Architecture / Security / Infra alignment and capacity",
    ],
  },
];

const SPOKE_PILLARS: { pillar: string; requirement: string; delivery: string; deliverables: string[] }[] = [
  {
    pillar: "Value",
    requirement: "Define the value the business domain needs to create for its customers (other business domains, Blackstone, tenants, partners).",
    delivery: "KPMG via Data Blueprint",
    deliverables: [
      "Generic framework for how to define value for a business domain",
      "Application of framework defining value for FP&A / Finance",
    ],
  },
  {
    pillar: "Platform",
    requirement: "Define the platform requirements to support self-serve value delivery within the business domain.",
    delivery: "KPMG via Data Blueprint",
    deliverables: [
      "Generic framework setting out typical platform requirements for self-serving adhoc analytics, BI and AI",
      "Application of framework to identify specific FP&A / Finance platform requirements (workspaces, data, tools, guardrails, policies, monitoring, integration, data sharing)",
    ],
  },
  {
    pillar: "Product",
    requirement: "Define and build reusable data products (data models, BI, AI) to support value delivery within the relevant business domain.",
    delivery: "KPMG via Data Blueprint",
    deliverables: [
      "Generic framework for defining product value proposition, customer requirements, data requirements, roadmap and delivery lifecycle",
      "Apply framework for FP&A / Finance — including all existing data products e.g. derived data, reports, Anaplan",
      "Build reusable data products to support at least 1 value proposition / use case for FP&A / Finance (Agent Factory)",
    ],
  },
  {
    pillar: "Process",
    requirement: "Define and automate processes within the business domain leveraging data products.",
    delivery: "KPMG via Data Blueprint",
    deliverables: [
      "Generic framework for process mapping, ownership of data and processes, and reimagining processes for automation",
      "Apply framework to define all existing FP&A / Finance processes — identify pains/gains, reimagine for automation, define ownership",
      "Automate processes and implement ownership structures to support at least 1 use case for FP&A / Finance (Agent Factory)",
    ],
  },
  {
    pillar: "People",
    requirement: "Define the domain structure required to support data-product development and lifecycle management within the business domain.",
    delivery: "KPMG via Data Blueprint",
    deliverables: [
      "Generic framework for defining the business-domain structure in a Data & AI-enabled world — individual skills, team capabilities, capacity, human vs agent mix",
      "Apply framework to define specific skill, capability, capacity, human vs agent mix requirements for FP&A / Finance",
      "Facilitate domain transformation through training, reskilling, adoption mechanisms and incentives (Change Management)",
    ],
  },
];

function BlueprintPage() {
  const { state, hydrated, setContext, setSteps, setAssets, setDownstream, setDq, setTom, setResult, loadSeed, reset } = useBlueprint();
  const { user, hydrated: authHydrated } = useAuth();
  const navigate = useNavigate();
  const startJob = useServerFn(startBlueprintJob);
  const fetchJob = useServerFn(getBlueprintJob);
  const [tab, setTab] = useState("context");
  const [busy, setBusy] = useState(false);
  const [jobStatus, setJobStatus] = useState<"idle" | "queued" | "running" | "completed" | "error">("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const gapsRef = useRef<HTMLDivElement>(null);
  const hubSpokeRef = useRef<HTMLDivElement>(null);
  const useCasesRef = useRef<HTMLDivElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [useCases, setUseCases] = useState<UseCaseRow[]>([]);

  const BUSINESS_FUNCTIONS = ["Finance & FP&A", "Sales", "Marketing", "Operations", "Supply Chain", "HR", "Customer Service", "IT", "Procurement", "Legal", "Other"];
  const BUSINESS_PROCESSES: Record<string, string[]> = {
    "Finance & FP&A": ["Service Charge", "Budgeting & Planning", "Forecasting", "Management Reporting", "AR Collections", "AP Invoice Processing", "Month-end Close", "Cash Flow Management"],
    "Sales": ["Lead Qualification", "Pipeline Management", "Quote-to-Cash", "Account Planning", "Sales Forecasting"],
    "Marketing": ["Campaign Management", "Lead Scoring", "Content Personalisation", "Attribution Reporting"],
    "Operations": ["Order Management", "Service Delivery", "Capacity Planning", "Incident Management"],
    "Supply Chain": ["Demand Planning", "Inventory Optimisation", "Supplier Management", "Logistics Tracking"],
    "HR": ["Hire-to-Retire", "Workforce Planning", "Performance Management", "Payroll"],
    "Customer Service": ["Ticket Triage", "Knowledge Search", "Customer Onboarding", "Renewals"],
    "IT": ["Incident Management", "Change Management", "Asset Management", "Access Reviews"],
    "Procurement": ["Source-to-Contract", "Procure-to-Pay", "Supplier Onboarding"],
    "Legal": ["Contract Lifecycle", "Compliance Reporting", "Matter Management"],
    "Other": [],
  };
  const processOptions = BUSINESS_PROCESSES[state.context.businessFunction] || [];

  const exportSection = async (ref: React.RefObject<HTMLElement | null>, name: string, title: string) => {
    if (!ref.current) return;
    setExporting(name);
    try {
      await exportElementToPdf(ref.current, `${name}.pdf`, title);
      toast.success(`Exported ${name}.pdf`);
    } catch (e: any) {
      toast.error(e?.message || "PDF export failed");
    } finally {
      setExporting(null);
    }
  };

  const uniqueSystems = useMemo(() => {
    const sys = new Set<string>();
    state.steps.forEach((s) => s.systemTool && sys.add(s.systemTool.trim()));
    return Array.from(sys);
  }, [state.steps]);

  const syncAssets = () => {
    const existing = new Map(state.assets.map((a) => [a.source.toLowerCase(), a]));
    const next: DataAsset[] = [];
    uniqueSystems.forEach((src, i) => {
      const hit = existing.get(src.toLowerCase());
      if (hit) next.push(hit);
      else next.push(newAssetFromSystem(`DA-${String(next.length + 1).padStart(2, "0")}`, src));
    });
    state.assets.forEach((a) => {
      if (!uniqueSystems.some((s) => s.toLowerCase() === a.source.toLowerCase())) next.push(a);
    });
    setAssets(next);
    toast.success(`Synced ${next.length} data assets from process steps.`);
  };

  // Poll an active job until it completes or errors.
  useEffect(() => {
    if (!jobId || jobStatus === "completed" || jobStatus === "error") return;
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetchJob({ data: { jobId } });
        if (cancelled) return;
        if (!r.ok) {
          setJobStatus("error");
          setGenerationError(r.error);
          setBusy(false);
          localStorage.removeItem(JOB_STORAGE_KEY);
          return;
        }
        setJobStatus(r.status);
        if (r.status === "completed" && r.result) {
          setResult(r.result);
          setBusy(false);
          toast.success("Blueprint generated.");
          setTab("result");
          localStorage.removeItem(JOB_STORAGE_KEY);
        } else if (r.status === "error") {
          setGenerationError(r.error || "Generation failed.");
          toast.error(r.error || "Generation failed.");
          setBusy(false);
          localStorage.removeItem(JOB_STORAGE_KEY);
        }
      } catch {
        // network blip — keep polling
      }
    };
    const id = window.setInterval(tick, 4000);
    void tick();
    return () => { cancelled = true; window.clearInterval(id); };
  }, [jobId, jobStatus, fetchJob, setResult]);

  // Resume a job across reloads.
  useEffect(() => {
    if (!hydrated) return;
    const saved = localStorage.getItem(JOB_STORAGE_KEY);
    if (saved && !jobId) {
      setJobId(saved);
      setJobStatus("running");
      setBusy(true);
    }
  }, [hydrated, jobId]);

  const onGenerate = async () => {
    setGenerationError(null);
    if (state.steps.length === 0) {
      setGenerationError("Add at least one process step first.");
      toast.error("Add at least one process step first.");
      return;
    }
    // Clear previous results so the "Blueprint Generated" tab shows the
    // in-progress state instead of stale data from a prior run.
    setResult(null);
    setBusy(true);
    setJobStatus("queued");
    try {
      const response = await startJob({ data: {
        context: state.context,
        steps: state.steps,
        assets: state.assets,
        dq: state.dq,
        hive: state.hive,
        tom: state.tom,
      } });
      if (!response.ok) {
        setGenerationError(response.error);
        toast.error(response.error);
        setBusy(false);
        setJobStatus("error");
        return;
      }
      const newJobId = response.jobId;
      localStorage.setItem(JOB_STORAGE_KEY, newJobId);
      setJobId(newJobId);
      setJobStatus("running");
      toast.info("Blueprint generation started. Results will appear under '7. Blueprint Generated' when ready.");
      // Fire the background runner. Don't await — it may take minutes and the
      // gateway may 504 the client connection; the job continues server-side
      // and the polling loop above picks up the result.
      void supabase.functions.invoke("blueprint-run", {
        body: { jobId: newJobId },
      }).catch(() => { /* fire-and-forget — edge function continues independently */ });
    } catch (e: any) {
      setGenerationError(e?.message || "Failed to start blueprint generation.");
      toast.error(e?.message || "Failed to start blueprint generation.");
      setBusy(false);
      setJobStatus("error");
    }
  };

  const onStop = () => {
    setBusy(false);
    setJobStatus("error");
    setJobId(null);
    localStorage.removeItem(JOB_STORAGE_KEY);
    toast.info("Blueprint generation cancelled.");
  };

  const loadExample = () => {
    loadSeed({
      context: SERVICE_CHARGE_CONTEXT,
      steps: SERVICE_CHARGE_STEPS,
      assets: SERVICE_CHARGE_ASSETS,
      dq: SERVICE_CHARGE_ASSETS.map((a) => ({
        assetId: a.id, completeness: 2, accuracy: 2, consistency: 2, timeliness: 2, uniqueness: 3, validity: 2,
        evidence: a.notes,
      })),
    });
    toast.success("Service Charge example loaded.");
  };

  if (!hydrated || !authHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="p-10 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) {
    void navigate({ to: "/login" });
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Reusable framework</div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Data Blueprint</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              A reusable framework for business domains to apply Data &amp; AI to <strong>improve operations</strong>,
              <strong> deliver measurable value</strong> and <strong>meet governance standards</strong>.
              Capture the value stream, data assets, quality and target operating model — the AI generates a
              hub-and-spoke transformation blueprint aligned to the Data Hive (Microsoft Fabric / OneLake) target state.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadExample}>
              <Upload className="mr-1 h-4 w-4" /> Load Service Charge example
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { if (confirm("Reset all blueprint data?")) reset(); }}>
              Reset
            </Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="context">1. Context</TabsTrigger>
            <TabsTrigger value="steps">2. Value Stream</TabsTrigger>
            <TabsTrigger value="usecases">3. Use Case Priority</TabsTrigger>
            <TabsTrigger value="assets">4. Data Asset Map</TabsTrigger>
            <TabsTrigger value="dq">5. Data Quality</TabsTrigger>
            <TabsTrigger value="tom">6. Target TOM</TabsTrigger>
            <TabsTrigger value="result">7. Blueprint Generated</TabsTrigger>
          </TabsList>

          <TabsContent value="context" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Process context</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Organisation</Label>
                  <Input value={state.context.organisation} onChange={(e) => setContext({ organisation: e.target.value })} />
                </div>
                <div>
                  <Label>Business function</Label>
                  <Select value={state.context.businessFunction || undefined} onValueChange={(v) => setContext({ businessFunction: v, businessProcess: "" })}>
                    <SelectTrigger><SelectValue placeholder="Select a function…" /></SelectTrigger>
                    <SelectContent>
                      {BUSINESS_FUNCTIONS.map((bf) => <SelectItem key={bf} value={bf}>{bf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Business process</Label>
                  {processOptions.length > 0 ? (
                    <Select value={state.context.businessProcess || undefined} onValueChange={(v) => setContext({ businessProcess: v === "__other__" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder="Select a process…" /></SelectTrigger>
                      <SelectContent>
                        {processOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        <SelectItem value="__other__">Other / custom…</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={state.context.businessProcess} onChange={(e) => setContext({ businessProcess: e.target.value })} placeholder="e.g. Service Charge" />
                  )}
                  {state.context.businessFunction && processOptions.length > 0 && !processOptions.includes(state.context.businessProcess) && (
                    <Input className="mt-2" value={state.context.businessProcess} placeholder="Type custom process name" onChange={(e) => setContext({ businessProcess: e.target.value })} />
                  )}
                </div>
                <div>
                  <Label>Executive sponsor</Label>
                  <Input value={state.context.sponsor} onChange={(e) => setContext({ sponsor: e.target.value })} placeholder="e.g. CFO, VP FP&A" />
                </div>
                <div>
                  <Label>Cycle volume</Label>
                  <Input value={state.context.cycleVolume} onChange={(e) => setContext({ cycleVolume: e.target.value })} placeholder="e.g. 1,200 invoices / quarter" />
                </div>
                <div>
                  <Label>Baseline effort</Label>
                  <Input value={state.context.baselineEffort} onChange={(e) => setContext({ baselineEffort: e.target.value })} placeholder="e.g. 18 FTE-days / cycle" />
                </div>
                <div className="md:col-span-2">
                  <Label>Target timeline</Label>
                  <Input value={state.context.timeline} onChange={(e) => setContext({ timeline: e.target.value })} placeholder="e.g. MVP in 12 weeks, scale by FY26 Q2" />
                </div>
                <div className="md:col-span-2">
                  <Label>Operations — value drivers, pain &amp; opportunity</Label>
                  <Textarea rows={3} value={state.context.valueDrivers} onChange={(e) => setContext({ valueDrivers: e.target.value })} placeholder="e.g. Cut manual reconciliation effort, reduce GL allocation errors, accelerate close, reduce customer disputes…" />
                </div>
                <div className="md:col-span-2">
                  <Label>Value — KPIs the blueprint must move</Label>
                  <Textarea rows={3} value={state.context.kpis} onChange={(e) => setContext({ kpis: e.target.value })} placeholder="e.g. FTE hours/cycle, days-to-close, error rate %, dispute count, forecast accuracy %…" />
                </div>
                <div className="md:col-span-2">
                  <Label>Decisions the data &amp; AI must support</Label>
                  <Textarea rows={3} value={state.context.decisionsSupported} onChange={(e) => setContext({ decisionsSupported: e.target.value })} placeholder="e.g. Annual budget approval, variance investigation, true-up to customer, cost recoverability…" />
                </div>
                <div className="md:col-span-2">
                  <Label>Governance — compliance, sensitivity &amp; retention constraints</Label>
                  <Textarea rows={3} value={state.context.complianceConstraints} onChange={(e) => setContext({ complianceConstraints: e.target.value })} placeholder="e.g. UK GDPR, tenant PII, SOX, audit trail 7 years, sensitivity labels, data residency…" />
                </div>
              </CardContent>
            </Card>
            <div className="mt-4 flex justify-end"><Button onClick={() => setTab("steps")}>Next: Value Stream →</Button></div>
          </TabsContent>

          <TabsContent value="steps" className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">One row per value stream step. Import a <strong>draw.io</strong> diagram to auto-populate steps, or add manually. The <strong>System / Tool</strong> column auto-feeds the Data Asset Map.</p>
              <div className="flex items-center gap-2">
                <input
                  id="drawio-upload"
                  type="file"
                  accept=".drawio,.xml,application/xml,text/xml"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    try {
                      const parsed = await parseDrawio(file);
                      if (!parsed.length) { toast.error("No shapes with labels found in the diagram."); return; }
                      setSteps([...state.steps, ...parsed.map((p, idx) => ({ ...p, stepNumber: state.steps.length + idx + 1, id: `S-${String(state.steps.length + idx + 1).padStart(2, "0")}` }))]);
                      toast.success(`Imported ${parsed.length} step(s) from ${file.name}`);
                    } catch (err) {
                      console.error(err);
                      toast.error("Could not parse the draw.io file. Export as uncompressed XML and retry.");
                    }
                  }}
                />
                <Button size="sm" variant="outline" onClick={() => document.getElementById("drawio-upload")?.click()}>
                  <Upload className="mr-1 h-4 w-4" /> Import draw.io
                </Button>
                <Button size="sm" onClick={() => setSteps([...state.steps, { ...newStep(), stepNumber: state.steps.length + 1 }])}>
                  <Plus className="mr-1 h-4 w-4" /> Add step
                </Button>
              </div>
            </div>
            {state.steps.length === 0 && (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
                No steps yet. Add manually or click "Load Service Charge example" above.
              </CardContent></Card>
            )}
            <div className="space-y-3">
              {state.steps.map((s, i) => (
                <Card key={s.id} className="overflow-hidden">
                  <CardContent className="grid gap-3 p-4 md:grid-cols-12">
                    <div className="md:col-span-2">
                      <Label className="text-xs">Step Ref</Label>
                      <Input value={s.id} onChange={(e) => { const n = [...state.steps]; n[i] = { ...s, id: e.target.value }; setSteps(n); }} />
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-xs">Sub-process</Label>
                      <Input value={s.subProcess} onChange={(e) => { const n = [...state.steps]; n[i] = { ...s, subProcess: e.target.value }; setSteps(n); }} />
                    </div>
                    <div className="md:col-span-7">
                      <Label className="text-xs">Step description</Label>
                      <Textarea rows={2} value={s.description} onChange={(e) => { const n = [...state.steps]; n[i] = { ...s, description: e.target.value }; setSteps(n); }} />
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-xs">Role / Who</Label>
                      <Input value={s.role} onChange={(e) => { const n = [...state.steps]; n[i] = { ...s, role: e.target.value }; setSteps(n); }} />
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-xs">System / Tool ★ feeds Data Assets</Label>
                      <Input value={s.systemTool} onChange={(e) => { const n = [...state.steps]; n[i] = { ...s, systemTool: e.target.value }; setSteps(n); }} />
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-xs">Data input</Label>
                      <Input value={s.dataInput} onChange={(e) => { const n = [...state.steps]; n[i] = { ...s, dataInput: e.target.value }; setSteps(n); }} />
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-xs">Data output</Label>
                      <Input value={s.dataOutput} onChange={(e) => { const n = [...state.steps]; n[i] = { ...s, dataOutput: e.target.value }; setSteps(n); }} />
                    </div>
                    <div className="md:col-span-2"><Label className="text-xs">Time</Label><Input value={s.time} onChange={(e) => { const n = [...state.steps]; n[i] = { ...s, time: e.target.value }; setSteps(n); }} /></div>
                    <div className="md:col-span-2"><Label className="text-xs">Frequency</Label><Input value={s.frequency} onChange={(e) => { const n = [...state.steps]; n[i] = { ...s, frequency: e.target.value }; setSteps(n); }} /></div>
                    <div className="md:col-span-2">
                      <Label className="text-xs">Automation</Label>
                      <select className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm" value={s.automationOpportunity}
                        onChange={(e) => { const n = [...state.steps]; n[i] = { ...s, automationOpportunity: e.target.value as AutomationClass }; setSteps(n); }}>
                        <option value="">—</option>
                        {AUTOMATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs">Priority</Label>
                      <select className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm" value={s.priority}
                        onChange={(e) => { const n = [...state.steps]; n[i] = { ...s, priority: e.target.value as any }; setSteps(n); }}>
                        <option value="">—</option><option>H</option><option>M</option><option>L</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 flex items-end gap-1">
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" checked={s.painPoint} onChange={(e) => { const n = [...state.steps]; n[i] = { ...s, painPoint: e.target.checked }; setSteps(n); }} /> Pain?
                      </label>
                      <Button size="icon" variant="ghost" onClick={() => setSteps(state.steps.filter((x) => x.id !== s.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    {s.painPoint && (
                      <div className="md:col-span-12">
                        <Label className="text-xs">Pain point description (verbatim from interviews if possible)</Label>
                        <Textarea rows={2} value={s.painPointDescription} onChange={(e) => { const n = [...state.steps]; n[i] = { ...s, painPointDescription: e.target.value }; setSteps(n); }} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setTab("context")}>← Back</Button>
              <Button onClick={() => setTab("usecases")}>Next: Use Case Priority →</Button>
            </div>
          </TabsContent>

          <TabsContent value="usecases" className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">Score each candidate use case 1–5 against the seven parameters. Total /35 drives the tier (Tier 1 ≥28 Now · Tier 2 22–27 Next · Tier 3 &lt;22 Later).</p>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Use case scoring criteria</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 uppercase">
                    <tr>
                      <th className="p-2 text-left">Parameter</th>
                      <th className="p-2 text-left">Definition</th>
                      <th className="p-2 text-left">1</th>
                      <th className="p-2 text-left">2</th>
                      <th className="p-2 text-left">3</th>
                      <th className="p-2 text-left">4</th>
                      <th className="p-2 text-left">5</th>
                    </tr>
                  </thead>
                  <tbody>
                    {UC_PARAMS.map((p) => (
                      <tr key={p.key} className="border-t align-top">
                        <td className="p-2 font-semibold">{p.label}</td>
                        <td className="p-2 text-muted-foreground">{p.definition}</td>
                        <td className="p-2">{p.s1}</td>
                        <td className="p-2">{p.s2}</td>
                        <td className="p-2">{p.s3}</td>
                        <td className="p-2">{p.s4}</td>
                        <td className="p-2">{p.s5}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase">
                    <tr>
                      <th className="p-2 text-left">ID</th>
                      <th className="p-2 text-left">Use case</th>
                      <th className="p-2 text-left">Process area</th>
                      {UC_PARAMS.map((p) => <th key={p.key} className="p-2 text-left" title={p.definition}>{p.label.split(" ")[0]}</th>)}
                      <th className="p-2 text-left">Total</th>
                      <th className="p-2 text-left">Tier</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {useCases.map((u, i) => {
                      const total = ucTotal(u);
                      const tier = ucTier(total);
                      const update = (patch: Partial<UseCaseRow>) => {
                        const n = [...useCases]; n[i] = { ...u, ...patch }; setUseCases(n);
                      };
                      return (
                        <tr key={u.id} className="border-t align-top">
                          <td className="p-2"><Input className="h-8 w-20 font-mono text-xs" value={u.id} onChange={(e) => update({ id: e.target.value })} /></td>
                          <td className="p-2"><Input className="h-8 min-w-[200px]" value={u.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Service Charge Pack Generator" /></td>
                          <td className="p-2"><Input className="h-8 min-w-[140px]" value={u.processArea} onChange={(e) => update({ processArea: e.target.value })} placeholder="e.g. Reconciliation" /></td>
                          {UC_PARAMS.map((p) => (
                            <td key={p.key} className="p-2">
                              <select className="h-8 w-14 rounded border bg-transparent px-1 text-sm" value={u[p.key] as number} onChange={(e) => update({ [p.key]: Number(e.target.value) } as Partial<UseCaseRow>)}>
                                {[1,2,3,4,5].map((v) => <option key={v} value={v}>{v}</option>)}
                              </select>
                            </td>
                          ))}
                          <td className="p-2 font-semibold">{total}/35</td>
                          <td className="p-2"><Badge variant="outline" className={tier.cls}>{tier.label}</Badge></td>
                          <td className="p-2"><Button size="icon" variant="ghost" onClick={() => setUseCases(useCases.filter((x) => x.id !== u.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                        </tr>
                      );
                    })}
                    {useCases.length === 0 && (
                      <tr><td colSpan={12} className="p-6 text-center text-sm text-muted-foreground">No use cases yet. Add candidates to prioritise.</td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <Button size="sm" variant="outline" onClick={() => setUseCases([...useCases, newUseCase(useCases.length + 1)])}>
              <Plus className="mr-1 h-4 w-4" /> Add use case
            </Button>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setTab("steps")}>← Back</Button>
              <Button onClick={() => setTab("assets")}>Next: Data Asset Map →</Button>
            </div>
          </TabsContent>


          <TabsContent value="assets" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Data assets feed each step. Use <strong>Sync from steps</strong> to auto-create rows for every System/Tool you entered.</p>
              <Button size="sm" variant="outline" onClick={syncAssets}><Wand2 className="mr-1 h-4 w-4" /> Sync from steps</Button>
            </div>
            <div className="space-y-3">
              {state.assets.map((a, i) => (
                <Card key={a.id}>
                  <CardContent className="grid gap-3 p-4 md:grid-cols-12">
                    <div className="md:col-span-2"><Label className="text-xs">Ref</Label><Input value={a.id} onChange={(e) => { const n = [...state.assets]; n[i] = { ...a, id: e.target.value }; setAssets(n); }} /></div>
                    <div className="md:col-span-5"><Label className="text-xs">Source / System</Label><Input value={a.source} onChange={(e) => { const n = [...state.assets]; n[i] = { ...a, source: e.target.value }; setAssets(n); }} /></div>
                    <div className="md:col-span-3"><Label className="text-xs">Domain</Label><Input value={a.domain} onChange={(e) => { const n = [...state.assets]; n[i] = { ...a, domain: e.target.value }; setAssets(n); }} /></div>
                    <div className="md:col-span-2">
                      <Label className="text-xs">Data Hive status</Label>
                      <select className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm" value={a.dataHiveStatus}
                        onChange={(e) => { const n = [...state.assets]; n[i] = { ...a, dataHiveStatus: e.target.value as DataHiveStatus }; setAssets(n); }}>
                        {HIVE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-6"><Label className="text-xs">Key entities</Label><Input value={a.entities} onChange={(e) => { const n = [...state.assets]; n[i] = { ...a, entities: e.target.value }; setAssets(n); }} /></div>
                    <div className="md:col-span-3"><Label className="text-xs">Business owner</Label><Input value={a.businessOwner} onChange={(e) => { const n = [...state.assets]; n[i] = { ...a, businessOwner: e.target.value }; setAssets(n); }} /></div>
                    <div className="md:col-span-3"><Label className="text-xs">Technical owner</Label><Input value={a.technicalOwner} onChange={(e) => { const n = [...state.assets]; n[i] = { ...a, technicalOwner: e.target.value }; setAssets(n); }} /></div>
                    <div className="md:col-span-2"><Label className="text-xs">Refresh</Label><Input value={a.refresh} onChange={(e) => { const n = [...state.assets]; n[i] = { ...a, refresh: e.target.value }; setAssets(n); }} /></div>
                    {(["bronzeFit","silverFit","goldFit","overallRag"] as const).map((field) => (
                      <div key={field} className="md:col-span-2">
                        <Label className="text-xs">{field === "overallRag" ? "Overall RAG" : field.replace("Fit"," fit")}</Label>
                        <select className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm" value={a[field] as string}
                          onChange={(e) => { const n = [...state.assets]; n[i] = { ...a, [field]: e.target.value as RAG }; setAssets(n); }}>
                          <option value="">—</option>{RAG_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                    <div className="md:col-span-2 flex items-end gap-2">
                      <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={a.pii} onChange={(e) => { const n = [...state.assets]; n[i] = { ...a, pii: e.target.checked }; setAssets(n); }} /> PII</label>
                      <Button size="icon" variant="ghost" onClick={() => setAssets(state.assets.filter((x) => x.id !== a.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <div className="md:col-span-12"><Label className="text-xs">Notes / known issues</Label><Textarea rows={2} value={a.notes} onChange={(e) => { const n = [...state.assets]; n[i] = { ...a, notes: e.target.value }; setAssets(n); }} /></div>
                  </CardContent>
                </Card>
              ))}
              <Button size="sm" variant="outline" onClick={() => setAssets([...state.assets, newAssetFromSystem(`DA-${String(state.assets.length + 1).padStart(2, "0")}`, "")])}>
                <Plus className="mr-1 h-4 w-4" /> Add asset
              </Button>
            </div>

            {/* PART B — Downstream / produced data assets shared OUT to consumers. */}
            <div className="mt-8 rounded-lg border border-primary/30 bg-primary/[0.03] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Downstream data — produced &amp; shared OUT</div>
                  <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                    Data products this domain produces and shares with downstream consumers / other business domains
                    (e.g. Service Charge Actuals → Operations Portal). Mirrors <strong>Part B</strong> of the DataHive
                    Blueprint Asset Map template.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setDownstream([...state.downstream, newDownstream(state.downstream.length + 1)])}>
                  <Plus className="mr-1 h-4 w-4" /> Add downstream asset
                </Button>
              </div>
              {state.downstream.length === 0 ? (
                <div className="mt-4 rounded-md border border-dashed border-border bg-card/40 p-6 text-center text-xs text-muted-foreground">
                  No downstream data assets yet. Click <strong>Add downstream asset</strong> to capture each data product this domain shares with consumers.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {state.downstream.map((d, i) => {
                    const upd = (patch: Partial<DownstreamAsset>) => {
                      const n = [...state.downstream]; n[i] = { ...d, ...patch }; setDownstream(n);
                    };
                    return (
                      <Card key={d.id}>
                        <CardContent className="grid gap-3 p-4 md:grid-cols-12">
                          <div className="md:col-span-2"><Label className="text-xs">Ref (DP-…)</Label><Input value={d.id} onChange={(e) => upd({ id: e.target.value })} /></div>
                          <div className="md:col-span-5"><Label className="text-xs">Data product name</Label><Input value={d.name} onChange={(e) => upd({ name: e.target.value })} /></div>
                          <div className="md:col-span-3"><Label className="text-xs">Destination / Consumer</Label><Input value={d.destination} onChange={(e) => upd({ destination: e.target.value })} placeholder="e.g. Operations Portal" /></div>
                          <div className="md:col-span-2"><Label className="text-xs">Consumer domain</Label><Input value={d.consumerDomain} onChange={(e) => upd({ consumerDomain: e.target.value })} placeholder="e.g. Operations" /></div>
                          <div className="md:col-span-2"><Label className="text-xs">Format</Label><Input value={d.format} onChange={(e) => upd({ format: e.target.value })} placeholder="JSON / Parquet / Excel" /></div>
                          <div className="md:col-span-3"><Label className="text-xs">Delivery method</Label><Input value={d.deliveryMethod} onChange={(e) => upd({ deliveryMethod: e.target.value })} placeholder="API / SharePoint / Direct Lake" /></div>
                          <div className="md:col-span-2"><Label className="text-xs">Refresh cadence</Label><Input value={d.refreshCadence} onChange={(e) => upd({ refreshCadence: e.target.value })} placeholder="Daily / Monthly" /></div>
                          <div className="md:col-span-3">
                            <Label className="text-xs">Target Hive layer</Label>
                            <select className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm" value={d.targetHiveLayer} onChange={(e) => upd({ targetHiveLayer: e.target.value as any })}>
                              <option value="">—</option><option>Bronze</option><option>Silver</option><option>Gold</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs">Data contract</Label>
                            <select className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm" value={d.dataContractExists} onChange={(e) => upd({ dataContractExists: e.target.value as any })}>
                              <option value="">—</option><option>Yes</option><option>No</option><option>Planned</option>
                            </select>
                          </div>
                          <div className="md:col-span-7"><Label className="text-xs">Quality / SLA expectation</Label><Input value={d.qualityExpectation} onChange={(e) => upd({ qualityExpectation: e.target.value })} placeholder="e.g. Complete; <1 day lag; no null Cost Centres" /></div>
                          <div className="md:col-span-3"><Label className="text-xs">Classification</Label><Input value={d.classification} onChange={(e) => upd({ classification: e.target.value })} placeholder="Public / Internal / Confidential" /></div>
                          <div className="md:col-span-3"><Label className="text-xs">Glossary term</Label><Input value={d.glossaryTerm} onChange={(e) => upd({ glossaryTerm: e.target.value })} /></div>
                          <div className="md:col-span-3"><Label className="text-xs">Data owner</Label><Input value={d.dataOwner} onChange={(e) => upd({ dataOwner: e.target.value })} /></div>
                          <div className="md:col-span-3"><Label className="text-xs">Data steward</Label><Input value={d.dataSteward} onChange={(e) => upd({ dataSteward: e.target.value })} /></div>
                          <div className="md:col-span-12"><Label className="text-xs">Notes</Label><Textarea rows={2} value={d.notes} onChange={(e) => upd({ notes: e.target.value })} /></div>
                          <div className="md:col-span-12 flex justify-end">
                            <Button size="icon" variant="ghost" onClick={() => setDownstream(state.downstream.filter((x) => x.id !== d.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-between"><Button variant="ghost" onClick={() => setTab("usecases")}>← Back</Button><Button onClick={() => setTab("dq")}>Next: Data Quality →</Button></div>
          </TabsContent>

          <TabsContent value="dq" className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">Score each data asset on the six DAMA DQ dimensions (1=Poor → 5=Excellent). Use the criteria below as a guide.</p>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Data Quality scoring criteria</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 uppercase">
                    <tr>
                      <th className="p-2 text-left">Dimension</th>
                      <th className="p-2 text-left">What it measures</th>
                      <th className="p-2 text-left">1 — Poor</th>
                      <th className="p-2 text-left">3 — Acceptable</th>
                      <th className="p-2 text-left">5 — Excellent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DQ_CRITERIA.map((c) => (
                      <tr key={c.dim} className="border-t align-top">
                        <td className="p-2 font-semibold">{c.dim}</td>
                        <td className="p-2 text-muted-foreground">{c.what}</td>
                        <td className="p-2">{c.poor}</td>
                        <td className="p-2">{c.ok}</td>
                        <td className="p-2">{c.great}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase">
                    <tr><th className="p-2 text-left">Asset</th>{["Completeness","Accuracy","Consistency","Timeliness","Uniqueness","Validity","Evidence"].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {state.assets.map((a) => {
                      const existing = state.dq.find((d) => d.assetId === a.id) || { assetId: a.id, completeness: 3, accuracy: 3, consistency: 3, timeliness: 3, uniqueness: 3, validity: 3, evidence: "" };
                      const update = (patch: Partial<DataQualityScore>) => {
                        const others = state.dq.filter((d) => d.assetId !== a.id);
                        setDq([...others, { ...existing, ...patch }]);
                      };
                      return (
                        <tr key={a.id} className="border-t">
                          <td className="p-2 font-mono text-xs">{a.id}<div className="text-[10px] text-muted-foreground">{a.source.slice(0,40)}</div></td>
                          {(["completeness","accuracy","consistency","timeliness","uniqueness","validity"] as const).map((dim) => (
                            <td key={dim} className="p-2">
                              <select className="h-8 w-16 rounded border bg-transparent px-1 text-sm" value={existing[dim]} onChange={(e) => update({ [dim]: Number(e.target.value) })}>
                                {[1,2,3,4,5].map((v) => <option key={v} value={v}>{v}</option>)}
                              </select>
                            </td>
                          ))}
                          <td className="p-2"><Input className="h-8" value={existing.evidence} onChange={(e) => update({ evidence: e.target.value })} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <div className="flex justify-between"><Button variant="ghost" onClick={() => setTab("assets")}>← Back</Button><Button onClick={() => setTab("tom")}>Next: Target TOM →</Button></div>
          </TabsContent>

          <TabsContent value="tom" className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">The hub-and-spoke target operating model. Pre-filled with the Indurent default — edit if your domain needs tweaks. This is the "target state" the AI compares against.</p>
            <div className="grid gap-4 md:grid-cols-2">
              {([
                ["hubCapabilities","Hub capabilities (central CoE)"],
                ["spokeOwnership","Spoke ownership (business domain)"],
                ["handshakes","Handshakes (Hub ↔ Spoke)"],
                ["controls","Mandatory controls / HITL"],
                ["successMetrics","Success metrics"],
              ] as const).map(([k,label]) => (
                <Card key={k}>
                  <CardHeader className="pb-2"><CardTitle className="text-base">{label}</CardTitle></CardHeader>
                  <CardContent><Textarea rows={7} value={state.tom[k]} onChange={(e) => setTom({ [k]: e.target.value } as any)} /></CardContent>
                </Card>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setTab("dq")}>← Back</Button>
              <div className="flex flex-col items-end gap-2">
                {generationError && (
                  <div className="max-w-xl rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {generationError}
                  </div>
                )}
                {busy && (jobStatus === "queued" || jobStatus === "running") && (
                  <div className="max-w-xl rounded-md border border-primary/30 bg-primary/5 p-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {jobStatus === "queued" ? "Queuing blueprint job…" : "Generating blueprint…"}
                    </div>
                    <div className="mt-1 text-xs">
                      This can take several minutes. You can stay on this page or switch tabs — the result will appear under <strong>7. Blueprint Generated</strong> automatically.
                    </div>
                  </div>
                )}
                <Button size="lg" onClick={onGenerate} disabled={busy}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {busy ? "Generating…" : "Generate Blueprint"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="result" className="mt-6 space-y-6">
            {!state.result ? (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
                {busy && (jobStatus === "queued" || jobStatus === "running") ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <div className="text-base font-semibold text-foreground">Blueprint generation in progress…</div>
                    <div className="max-w-xl text-xs leading-relaxed">
                      We've cleared your previous blueprint and started a fresh run. Sit tight — this usually takes
                      <strong> 2–5 minutes</strong> for a full process. You can switch tabs or even close this page;
                      your new blueprint will appear here automatically as soon as it's ready.
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-wider text-primary">Status: {jobStatus}</div>
                    <Button variant="destructive" size="sm" onClick={onStop}>
                      <Square className="mr-2 h-3 w-3 fill-current" /> Stop
                    </Button>
                  </div>
                ) : (
                  <>
                    No blueprint yet. Complete the previous steps and click <strong>Generate Blueprint</strong>.
                  </>
                )}
                {generationError && (
                  <div className="mx-auto mt-4 max-w-3xl rounded-md border border-destructive/30 bg-destructive/10 p-3 text-left text-sm text-destructive">
                    {generationError}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Button onClick={onGenerate} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Generate now</Button>
                  {busy && <Button variant="destructive" size="sm" onClick={onStop}><Square className="mr-2 h-3 w-3 fill-current" /> Stop</Button>}
                </div>
              </CardContent></Card>
            ) : (
              <div ref={fullRef} className="space-y-6">
                <div className="rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow">
                  <div>
                    Data Blueprint generated for <strong>{state.context.businessFunction || "—"}</strong> · <strong>{state.context.businessProcess || "—"}</strong>
                  </div>
                  <div className="mt-1 text-xs font-normal text-primary-foreground/85">
                    Generated on {new Date(state.result.generatedAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">
                    Print, save or export the full blueprint — or any individual section — as PDF.
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => window.print()}>
                      <Download className="mr-1 h-4 w-4" /> Print / Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm("Reset the generated blueprint results? Your inputs (steps, assets, context) will be kept.")) {
                          setResult(null);
                          toast.success("Blueprint results cleared.");
                        }
                      }}
                    >
                      <RotateCcw className="mr-1 h-4 w-4" /> Reset Results
                    </Button>
                    <Button size="sm" onClick={() => exportSection(fullRef, "data-blueprint-full", "Data Blueprint — Full Report")} disabled={exporting !== null}>
                      {exporting === "data-blueprint-full" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileDown className="mr-1 h-4 w-4" />}
                      Export full PDF
                    </Button>
                  </div>
                </div>

                <Card ref={summaryRef as any}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Executive summary</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => exportSection(summaryRef, "executive-summary", "Executive Summary")} disabled={exporting !== null}>
                      <Download className="mr-1 h-3.5 w-3.5" /> PDF
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                      {summaryBullets(state.result.executiveSummary).map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                    <div className="mt-3 text-xs text-muted-foreground">Model: {state.result.model} · {new Date(state.result.generatedAt).toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card ref={radarRef as any}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Current vs Target — 6-axis readiness</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => exportSection(radarRef, "readiness-radar", "Readiness Radar")} disabled={exporting !== null}>
                      <Download className="mr-1 h-3.5 w-3.5" /> PDF
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2">Radar view</div>
                        <BlueprintRadar axes={state.result.radar} />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2">Horizontal bar view</div>
                        <BlueprintHorizontalBars axes={state.result.radar} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Operations · Value · Governance — what the blueprint delivers</CardTitle></CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-border bg-card p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "oklch(0.55 0.20 30)" }}>Improve operations</div>
                      <p className="mt-1 text-xs text-muted-foreground">Pain &amp; opportunity captured</p>
                      <p className="mt-2 text-sm">{state.context.valueDrivers || "—"}</p>
                      <div className="mt-3 text-[11px] text-muted-foreground">
                        {state.result.stepRecommendations.filter((r) => r.classification === "AUTOMATE FULL" || r.classification === "AUTOMATE+HUMAN").length} of {state.result.stepRecommendations.length} steps targeted for automation.
                      </div>
                    </div>
                    <div className="rounded-md border border-border bg-card p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "oklch(0.62 0.16 155)" }}>Deliver value</div>
                      <p className="mt-1 text-xs text-muted-foreground">KPIs the blueprint must move</p>
                      <p className="mt-2 text-sm">{state.context.kpis || "—"}</p>
                      <div className="mt-3 text-[11px] text-muted-foreground">
                        {state.result.useCaseBacklog.length} prioritised use cases in backlog.
                      </div>
                    </div>
                    <div className="rounded-md border border-border bg-card p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "oklch(0.50 0.14 195)" }}>Meet governance</div>
                      <p className="mt-1 text-xs text-muted-foreground">Compliance &amp; sensitivity constraints</p>
                      <p className="mt-2 text-sm">{state.context.complianceConstraints || "—"}</p>
                      <div className="mt-3 text-[11px] text-muted-foreground">
                        {state.result.gapRegister.filter((g) => g.dimension === "Governance").length} governance gaps tracked · Purview + Entra Agent ID required.
                      </div>
                    </div>
                  </CardContent>
                </Card>


                <Card>
                  <CardHeader><CardTitle>Dimension ranking across maturity levels</CardTitle></CardHeader>
                  <CardContent>
                    <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
                      One row per readiness axis, six columns for the maturity levels (L0 → L5).
                      The filled cell shows the current state and the dashed cell shows the target.
                    </p>
                    <RadarMaturityTable axes={state.result.radar} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Next steps — prioritised recommendations</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      {[...state.result.radar]
                        .map((a) => ({ ...a, gap: a.target - a.current }))
                        .sort((a, b) => b.gap - a.gap)
                        .map((a, i) => (
                          <div key={i} className="rounded-md border border-border bg-card p-4">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold">{a.axis}</div>
                              <Badge variant={a.gap >= 2 ? "destructive" : a.gap >= 1 ? "secondary" : "outline"}>
                                {a.gap >= 2 ? "High" : a.gap >= 1 ? "Medium" : "Maintain"}
                              </Badge>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Move from <strong>{a.current.toFixed(1)}</strong> → <strong>{a.target.toFixed(1)}</strong> (gap {a.gap.toFixed(1)})
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{axisRecommendation(a.axis, a.gap)}</p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>AI agent readiness — next steps for {state.context.businessFunction || "your function"}{state.context.businessProcess ? ` (${state.context.businessProcess})` : ""}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Recommended sequence</div>
                      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-foreground/90">
                        {agentReadinessSteps(state.context.businessFunction, state.context.businessProcess).map((s, i) => <li key={i}>{s}</li>)}
                      </ol>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Steps by business use case</div>
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        {agentUseCases(state.context.businessFunction, state.context.businessProcess).map((uc) => (
                          <div key={uc.title} className="rounded-lg border border-border bg-card p-4">
                            <div className="text-sm font-semibold">{uc.title}</div>
                            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs text-muted-foreground">
                              {uc.steps.map((s, i) => <li key={i}>{s}</li>)}
                            </ol>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>


                <Card ref={stepsRef as any}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Per-step Data & AI interventions</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => exportSection(stepsRef, "step-interventions", "Per-step Data & AI Interventions")} disabled={exporting !== null}>
                      <Download className="mr-1 h-3.5 w-3.5" /> PDF
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {state.result.stepRecommendations.map((r) => {
                      const step = state.steps.find((s) => s.id === r.stepId);
                      return (
                        <div key={r.stepId} className="rounded-md border border-border bg-card p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs">{r.stepId}</span>
                            <Badge variant="outline">{r.classification}</Badge>
                            <Badge>{r.hubSpoke}</Badge>
                            {step && <span className="text-xs text-muted-foreground truncate">{step.description.slice(0,80)}</span>}
                          </div>
                          <div className="mt-2 text-sm"><strong>Intervention:</strong> {r.dataAiIntervention}</div>
                          <div className="mt-1 text-xs text-muted-foreground">Assets: {r.requiredAssets.join(", ") || "—"} · Governance: {r.governance}</div>
                          {r.dqUplifts.length > 0 && <div className="mt-1 text-xs">DQ uplifts: {r.dqUplifts.join("; ")}</div>}
                          <div className="mt-1 text-xs italic text-muted-foreground">{r.rationale}</div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card ref={gapsRef as any}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Gap register (vs hub-and-spoke target)</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => exportSection(gapsRef, "gap-register", "Gap Register")} disabled={exporting !== null}>
                      <Download className="mr-1 h-3.5 w-3.5" /> PDF
                    </Button>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-xs uppercase"><tr>{["Ref","Dimension","Class","Description","Impact","Remediation","Owner","Pri"].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
                      <tbody>
                        {state.result.gapRegister.map((g) => (
                          <tr key={g.id} className="border-t align-top">
                            <td className="p-2 font-mono text-xs">{g.id}</td>
                            <td className="p-2"><Badge variant="outline">{g.dimension}</Badge></td>
                            <td className="p-2"><Badge variant={g.classification === "BLOCKER" ? "destructive" : "secondary"}>{g.classification}</Badge></td>
                            <td className="p-2">{g.description}</td>
                            <td className="p-2 text-muted-foreground">{g.impact}</td>
                            <td className="p-2">{g.remediation}</td>
                            <td className="p-2 text-xs">{g.owner}</td>
                            <td className="p-2 text-xs">{g.priority}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                <Card ref={hubSpokeRef as any}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Moving to hub-and-spoke ways of working</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => exportSection(hubSpokeRef, "hub-spoke-activities", "Hub-and-Spoke Activities")} disabled={exporting !== null}>
                      <Download className="mr-1 h-3.5 w-3.5" /> PDF
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="max-w-3xl text-sm text-muted-foreground">
                      The concrete activities needed to transition this domain to hub-and-spoke ways of working on the Data Hive
                      (Microsoft Fabric / OneLake). <strong>Hub</strong> = central Data &amp; AI CoE — owns OneLake, reusable
                      ingestion + SCD framework, Gold + ontology, agent platform, Purview governance.
                      <strong> Spoke</strong> = the business domain — owns business rules, KPIs, source-of-truth definitions,
                      HITL approvals, exception handling.
                      <strong> Handshakes</strong> = data contracts, exception SLAs, joint backlog and gate reviews that bind them together.
                    </p>
                    <div className="grid gap-3 md:grid-cols-3">
                    {(["Hub","Handshake","Spoke"] as const).map((pillar) => (
                      <div key={pillar}>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{pillar}</div>
                        <div className="space-y-2">
                          {state.result!.hubSpokeActivities.filter((a) => a.pillar === pillar).sort((a,b) => a.sequence - b.sequence).map((a) => (
                            <div key={a.id} className="rounded-md border border-border bg-card p-3">
                              <div className="text-sm font-medium">{a.activity}</div>
                              <div className="mt-1 text-xs text-muted-foreground">{a.description}</div>
                              <div className="mt-1 text-[11px] text-muted-foreground">Owner: {a.owner}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    </div>
                  </CardContent>
                </Card>

                <Card ref={useCasesRef as any}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Prioritised use-case backlog</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => exportSection(useCasesRef, "use-case-backlog", "Use-case Backlog")} disabled={exporting !== null}>
                      <Download className="mr-1 h-3.5 w-3.5" /> PDF
                    </Button>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-xs uppercase"><tr>{["#","Use case","Impact","Desirab.","Feas.","Total","Data RAG","Solution"].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
                      <tbody>
                        {state.result.useCaseBacklog.map((u) => (
                          <tr key={u.id} className="border-t">
                            <td className="p-2 font-mono text-xs">{u.id}</td>
                            <td className="p-2">{u.name}</td>
                            <td className="p-2">{u.businessImpact}</td>
                            <td className="p-2">{u.desirability}</td>
                            <td className="p-2">{u.feasibility}</td>
                            <td className="p-2 font-semibold">{u.total}</td>
                            <td className="p-2"><Badge variant={u.dataReadiness === "Red" ? "destructive" : "secondary"}>{u.dataReadiness}</Badge></td>
                            <td className="p-2 text-xs">{u.solutionType}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Target architecture — Data Hive on Microsoft Fabric &amp; OneLake</CardTitle></CardHeader>
                  <CardContent className="space-y-5">
                    <p className="max-w-3xl text-sm text-muted-foreground">
                      The reference target architecture this blueprint converges on. Source systems land in <strong>Bronze</strong>,
                      are conformed in <strong>Silver</strong> (SCD1/SCD2), curated in <strong>Gold</strong> with a certified
                      semantic / ontology layer, and exposed to humans &amp; agents through <strong>Copilot Studio</strong>,
                      <strong> Foundry</strong> and <strong>Microsoft Agent 365</strong>, all governed end-to-end by
                      <strong> Microsoft Purview</strong> and <strong>Entra Agent ID</strong>.
                    </p>

                    <div className="overflow-x-auto rounded-lg border border-border bg-card p-4">
                      <div className="grid min-w-[820px] grid-cols-5 gap-3 text-center text-xs">
                        {[
                          { t: "Sources", d: "ERP · CRM · Excel · Files · APIs", c: "oklch(0.55 0.18 255)" },
                          { t: "Bronze (Raw)", d: "Metadata-driven ingestion · CDC · audit", c: "oklch(0.62 0.18 45)" },
                          { t: "Silver (Conformed)", d: "SCD1 / SCD2 · keys · DQ rules", c: "oklch(0.72 0.14 145)" },
                          { t: "Gold (Curated)", d: "Direct Lake semantic + ontology", c: "oklch(0.58 0.16 160)" },
                          { t: "Consumption", d: "Copilot Studio · Foundry · Agent 365 · Power BI", c: "oklch(0.55 0.20 295)" },
                        ].map((s) => (
                          <div key={s.t} className="rounded-md border border-border p-3" style={{ background: `color-mix(in oklab, ${s.c} 8%, white)`, borderColor: `color-mix(in oklab, ${s.c} 30%, white)` }}>
                            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: s.c }}>{s.t}</div>
                            <div className="mt-1 text-[11px] text-foreground/80">{s.d}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 grid min-w-[820px] grid-cols-2 gap-3 text-xs">
                        <div className="rounded-md border border-dashed border-border p-3">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Governance plane</div>
                          <div className="mt-1">Microsoft Purview — catalog, lineage, classification, sensitivity labels, DLP, access reviews.</div>
                        </div>
                        <div className="rounded-md border border-dashed border-border p-3">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Agent &amp; identity plane</div>
                          <div className="mt-1">Entra Agent ID · Microsoft Agent 365 registry · Foundry evaluations · CI/CD via Fabric Git + Azure DevOps.</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        { t: "Hub — Data &amp; AI CoE", items: ["OneLake foundation &amp; capacity", "Reusable ingestion + SCD framework", "Certified Gold + ontology", "Agent platform &amp; evals", "Purview policy &amp; standards"] },
                        { t: "Spoke — Business domain", items: ["Source-of-truth definitions", "Business rules &amp; KPI logic", "HITL approvals &amp; exceptions", "Domain semantic extensions", "Adoption &amp; change mgmt"] },
                        { t: "Handshakes", items: ["Data contracts", "DQ &amp; freshness SLAs", "Joint backlog &amp; gate reviews", "Shared incident process", "Agent release &amp; rollback"] },
                      ].map((p) => (
                        <div key={p.t} className="rounded-md border border-border bg-card p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary" dangerouslySetInnerHTML={{ __html: p.t }} />
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-foreground/80">
                            {p.items.map((it, i) => <li key={i} dangerouslySetInnerHTML={{ __html: it }} />)}
                          </ul>
                        </div>
                      ))}
                    </div>

                    <figure className="overflow-hidden rounded-lg border border-border bg-card">
                      <img
                        src={targetArchitectureDiagram}
                        alt="Target data architecture — Data Hive on Microsoft Fabric and OneLake reference diagram"
                        className="w-full h-auto"
                        loading="lazy"
                      />
                      <figcaption className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
                        Reference target-state diagram — Data Hive on Microsoft Fabric &amp; OneLake.
                      </figcaption>
                    </figure>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Data Hive — target state</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <p className="max-w-3xl text-sm text-muted-foreground">
                      The Data Hive is the shared product the Hub operates and Spokes consume. It is the single, governed
                      foundation on OneLake where every domain lands its data, conforms it to enterprise standards, and
                      exposes certified products to people, BI and agents.
                    </p>
                    <figure className="overflow-hidden rounded-lg border border-border bg-card">
                      <img
                        src={dataHiveTargetState}
                        alt="Data Hive target state — business domains, gold/silver/bronze layers, core platform tools and CoE functions"
                        className="w-full h-auto"
                        loading="lazy"
                      />
                      <figcaption className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
                        Data Hive target state — domains, layered data products and CoE operating functions.
                      </figcaption>
                    </figure>
                    <div className="grid gap-3 md:grid-cols-2">
                      {[
                        { t: "Foundation", d: "Single OneLake tenant · Fabric capacities sized per domain · Fabric Git + Azure DevOps for CI/CD · environment promotion (dev → test → prod)." },
                        { t: "Ingestion &amp; storage", d: "Metadata-driven ingestion framework · CDC and full/incremental patterns · Bronze raw with source identity, lineage and sensitivity labels preserved." },
                        { t: "Conformance &amp; quality", d: "Silver with conformed keys, SCD1/SCD2 history, reusable DQ rules (the 6 DAMA dimensions) and exception queues with owners and SLAs." },
                        { t: "Certified products", d: "Gold star-schemas + Direct Lake semantic model and a business ontology — the single source of truth for KPIs, dimensions and definitions." },
                        { t: "Consumption", d: "Power BI, Copilot Studio, Foundry and Microsoft Agent 365 read only from Gold + ontology; no agent or report reaches Bronze/Silver directly." },
                        { t: "Governance &amp; identity", d: "Purview catalog, lineage, classification, DLP and access reviews · Entra Agent ID for agent identity · evals, approvals and rollback in Foundry." },
                        { t: "Operating model", d: "Hub owns the platform, standards and certified Gold; Spokes own source-of-truth, rules and HITL; bound by data contracts, SLAs and gate reviews." },
                        { t: "Success signals", d: "Time-to-onboard a new source, % of decisions served from Gold, DQ pass rate, agent task success rate, audit findings closed on time." },
                      ].map((b) => (
                        <div key={b.t} className="rounded-md border border-border bg-card p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary" dangerouslySetInnerHTML={{ __html: b.t }} />
                          <div className="mt-2 text-sm text-foreground/80" dangerouslySetInnerHTML={{ __html: b.d }} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function summaryBullets(text: string): string[] {
  if (!text) return [];
  // Prefer existing line/bullet breaks; otherwise split into sentences.
  const lineSplit = text
    .split(/\r?\n+/)
    .map((l) => l.replace(/^\s*[-•*\d.)]+\s*/, "").trim())
    .filter(Boolean);
  if (lineSplit.length >= 2) return lineSplit;
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const AXIS_COLORS = [
  "oklch(0.55 0.18 255)",
  "oklch(0.62 0.16 155)",
  "oklch(0.55 0.20 30)",
  "oklch(0.50 0.14 195)",
  "oklch(0.60 0.18 295)",
  "oklch(0.68 0.16 75)",
];

const LEVEL_COLORS = [
  "oklch(0.62 0.18 25)",
  "oklch(0.68 0.16 45)",
  "oklch(0.78 0.14 75)",
  "oklch(0.72 0.14 145)",
  "oklch(0.58 0.16 160)",
  "oklch(0.50 0.18 180)",
];
const LEVEL_NAMES = ["No Capability Yet", "Limited Awareness", "Foundational", "Developing", "Established", "Transformational"];
const LEVEL_DESCRIPTIONS = [
  "The organisation is either unaware of, or does not have, any processes, tools, or resources to support this capability.",
  "Some tools and processes may exist; however, there is limited awareness of the importance of managing this capability across the Data Platform.",
  "The foundations of tools and technologies to manage this capability exist and are operational. There is only very limited implementation, or there are minor initiatives that demonstrate the organisation's capability to sustain this across the Data Platform.",
  "Comprehensive awareness exists, and tools and technology to support the capability are in place. There may be some resource constraints. However, implementation is not widely deployed. It varies between different business areas within the Data Platform and is not consistent across the enterprise, nor is it enforced by policies.",
  "Tools, technology, processes, and resources are in place. Standards are defined, and the capability is enforced across all business areas within the Data Platform, with policies applied to all new implementations. However, the implementation has not led to transformational change, nor is it considered to be transforming other analytics areas or expanding the organisation's analytics capabilities.",
  "The capability is fully implemented and enforced throughout the Data Platform. Its deployment is considered transformational for the analytical business, expanding analytics capabilities that could not have been achieved prior to this implementation.",
];

function RadarMaturityTable({ axes }: { axes: { axis: string; current: number; target: number }[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-y-1.5 text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            <th className="w-[220px] px-2 py-2 text-left">Axis</th>
            {LEVEL_NAMES.map((n, i) => (
              <th key={i} className="px-1 py-2 text-center">
                <div className="font-semibold">L{i}</div>
                <div className="text-[10px] font-normal normal-case tracking-normal text-muted-foreground">{n}</div>
              </th>
            ))}
            <th className="w-[110px] px-2 py-2 text-right">Now → Tgt</th>
          </tr>
        </thead>
        <tbody>
          {axes.map((r, idx) => {
            const cur = Math.max(0, Math.min(5, Math.round(r.current)));
            const tgt = Math.max(0, Math.min(5, Math.round(r.target)));
            const accent = AXIS_COLORS[idx % AXIS_COLORS.length];
            return (
              <tr key={idx}>
                <td className="rounded-l-md bg-card px-3 py-2 align-middle">
                  <div className="text-sm font-medium text-foreground" style={{ color: accent }}>{r.axis}</div>
                </td>
                {LEVEL_COLORS.map((c, i) => {
                  const isCurrent = i === cur;
                  const isTarget = i === tgt;
                  const filled = isCurrent || isTarget;
                  return (
                    <td key={i} className="bg-card px-1 py-2 text-center align-middle">
                      <div
                        className="mx-auto flex h-9 w-full max-w-[64px] items-center justify-center rounded-md text-[10px] font-semibold uppercase tracking-wider"
                        style={{
                          background: filled ? c : `color-mix(in oklab, ${c} 18%, white)`,
                          color: filled ? "white" : `color-mix(in oklab, ${c} 60%, black)`,
                          border: isTarget && !isCurrent ? `2px dashed ${c}` : `1px solid color-mix(in oklab, ${c} 25%, white)`,
                          boxShadow: isCurrent ? `0 0 0 2px white inset, 0 1px 4px color-mix(in oklab, ${c} 40%, transparent)` : undefined,
                        }}
                        title={`Level ${i} · ${LEVEL_NAMES[i]}${isCurrent ? " (current)" : ""}${isTarget ? " (target)" : ""}`}
                      >
                        {isCurrent ? "Now" : isTarget ? "Tgt" : ""}
                      </div>
                    </td>
                  );
                })}
                <td className="rounded-r-md bg-card px-3 py-2 text-right align-middle">
                  <div className="text-sm font-bold">{r.current.toFixed(1)} → {r.target.toFixed(1)}</div>
                  <div className="text-[10px] text-muted-foreground">{LEVEL_NAMES[cur]}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-6 grid gap-2 md:grid-cols-2">
        {LEVEL_NAMES.map((n, i) => (
          <div key={i} className="flex gap-3 rounded-md border border-border bg-card p-3">
            <span className="h-fit rounded-md px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: LEVEL_COLORS[i] }}>L{i}</span>
            <div>
              <div className="text-xs font-semibold">{n}</div>
              <div className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{LEVEL_DESCRIPTIONS[i]}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function axisRecommendation(axis: string, gap: number): string {
  if (gap <= 0) return "Maintain current state and look for opportunities to extend this capability further.";
  const a = axis.toLowerCase();
  if (a.includes("ingest")) return "Stand up a metadata-driven ingestion framework into OneLake Bronze — config-driven sources, standard CDC and full/incremental patterns, centralised monitoring.";
  if (a.includes("process") || a.includes("transform")) return "Standardise reusable Fabric notebooks for SCD1/SCD2 merges of initial and incremental loads to build Silver and Gold; enforce medallion contracts and mandatory natural keys.";
  if (a.includes("consum") || a.includes("ontolog") || a.includes("semantic")) return "Publish a certified Direct Lake semantic / ontology layer for the data products with glossary terms and synonyms — the grounding surface for Copilot and Foundry agents.";
  if (a.includes("quality") || a.includes("dq")) return "Define DQ rules per certified dataset (completeness, validity, freshness, uniqueness), monitor with scorecards, and gate AI surfaces on DQ SLAs.";
  if (a.includes("govern") || a.includes("security")) return "Assign owners and stewards in Microsoft Purview, classify and label sensitive data, enforce least-privilege RLS/OLS, and register agents in Microsoft Agent 365.";
  if (a.includes("cicd") || a.includes("devops") || a.includes("ops")) return "Adopt Fabric Git integration with Azure DevOps pipelines, branching + PR review, and add automated data + AI-eval tests as promotion gates.";
  if (a.includes("people") || a.includes("operating") || a.includes("hub") || a.includes("spoke")) return "Run the hub-and-spoke target operating model — hub owns platform / standards / agent factory, spokes own domain data products and stewardship.";
  return "Close the gap by sequencing the hub-and-spoke handshakes and the medallion controls described in the target TOM.";
}

function agentReadinessSteps(bizFn: string, bizProc: string): string[] {
  const fn = bizFn || "your function";
  const proc = bizProc ? ` (${bizProc})` : "";
  return [
    `Ingest data for ${fn}${proc} from the current source systems into OneLake using a reusable metadata-driven ingestion framework (full + incremental + CDC patterns).`,
    `Land each source in Bronze with source identity, sensitivity labels and lineage preserved; standardise the load pattern per source.`,
    `Use the reusable data processing framework to merge initial and incremental loads with SCD Type 1 and Type 2 logic into the Silver layer.`,
    `Apply DQ rules (completeness, accuracy, validity, timeliness, uniqueness) at the Silver → Gold transition; block the AI-grounding surface if SLAs are breached.`,
    `Build the Gold and ontology layer for ${fn} data products — entities, relationships and metrics — and publish a certified Direct Lake semantic model.`,
    `Expose the ontology as a Fabric IQ / Foundry IQ data agent so Copilot Studio and Foundry agents ground answers in governed enterprise context, not raw tables.`,
    `Register every agent in Microsoft Agent 365: assign owner, scope tools, inherit caller identity, enforce DLP and add groundedness / accuracy eval suites as release gates.`,
  ];
}

function agentUseCases(bizFn: string, bizProc: string): { title: string; steps: string[] }[] {
  const fn = bizFn || "your function";
  const proc = bizProc || "the pilot process";
  return [
    {
      title: `Copilot Studio agent over ${fn} (${proc})`,
      steps: [
        `Ingest ${fn} source systems into OneLake via the metadata-driven framework.`,
        "Apply DQ rules and reconciliation so the agent only sees trusted, reconciled facts.",
        `Define a ${fn} ontology (entities, relationships, metrics) and publish a certified Direct Lake model.`,
        "Expose it as a Fabric IQ data agent with synonyms, descriptions and RLS by Entra group.",
      ],
    },
    {
      title: "Foundry agent grounded on enterprise knowledge",
      steps: [
        "Build a Foundry IQ index referencing curated OneLake gold tables and unstructured stores.",
        `Wire the agent to the ${fn} ontology so retrieval is entity-aware, not just keyword based.`,
        "Add eval suites (groundedness, accuracy, safety) as CI/CD release gates.",
        "Enforce Agent 365 access control: identity, data scope and tool scopes per caller.",
      ],
    },
    {
      title: "M365 / Work IQ agent over SharePoint, Teams, Outlook",
      steps: [
        "Inventory content sources via Graph connectors and tag them with Purview sensitivity labels.",
        "Curate the corpus: certify owners, retire stale documents, deduplicate.",
        "Use Foundry IQ / Fabric IQ indexes with standardised chunking + embeddings.",
        "Register the agent in Microsoft Agent 365 with scoped Graph permissions and DLP policies.",
      ],
    },
  ];
}
