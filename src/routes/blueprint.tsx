import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import { Download, FileDown, Loader2, Plus, Sparkles, Trash2, Upload, Wand2 } from "lucide-react";
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
import { generateBlueprint } from "@/lib/blueprint.functions";
import { BlueprintRadar } from "@/components/blueprint-radar";
import { BlueprintHorizontalBars } from "@/components/blueprint-horizontal-bars";
import { exportElementToPdf } from "@/lib/pdf-export";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SERVICE_CHARGE_CONTEXT,
  SERVICE_CHARGE_STEPS,
  SERVICE_CHARGE_ASSETS,
} from "@/lib/blueprint-template";
import type {
  ProcessStep,
  DataAsset,
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

function newAssetFromSystem(id: string, source: string): DataAsset {
  return {
    id, source, domain: "", entities: "", accessMethod: "", businessOwner: "", technicalOwner: "",
    refresh: "", pii: false, dataHiveStatus: "None", bronzeFit: "", silverFit: "", goldFit: "",
    overallRag: "", notes: "",
  };
}

function BlueprintPage() {
  const { state, hydrated, setContext, setSteps, setAssets, setDq, setTom, setResult, loadSeed, reset } = useBlueprint();
  const generate = useServerFn(generateBlueprint);
  const [tab, setTab] = useState("context");
  const [busy, setBusy] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const gapsRef = useRef<HTMLDivElement>(null);
  const hubSpokeRef = useRef<HTMLDivElement>(null);
  const useCasesRef = useRef<HTMLDivElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<string | null>(null);

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

  const onGenerate = async () => {
    if (state.steps.length === 0) {
      toast.error("Add at least one process step first.");
      return;
    }
    setBusy(true);
    try {
      const result = await generate({ data: {
        context: state.context,
        steps: state.steps,
        assets: state.assets,
        dq: state.dq,
        hive: state.hive,
        tom: state.tom,
      } });
      setResult(result);
      setTab("result");
      toast.success("Blueprint generated.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate blueprint.");
    } finally {
      setBusy(false);
    }
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

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="p-10 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Executable framework</div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Data Blueprint</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Document any business process step-by-step, map its data assets and quality, then generate a hub-and-spoke
              transformation blueprint with per-step Data & AI interventions aligned to the Fabric / OneLake target state.
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="context">1. Context</TabsTrigger>
            <TabsTrigger value="steps">2. Value Stream</TabsTrigger>
            <TabsTrigger value="assets">3. Data Asset Map</TabsTrigger>
            <TabsTrigger value="dq">4. Data Quality</TabsTrigger>
            <TabsTrigger value="tom">5. Target TOM</TabsTrigger>
            <TabsTrigger value="result">6. Blueprint</TabsTrigger>
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
              </CardContent>
            </Card>
            <div className="mt-4 flex justify-end"><Button onClick={() => setTab("steps")}>Next: AS-IS Steps →</Button></div>
          </TabsContent>

          <TabsContent value="steps" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">One row per process step. The <strong>System / Tool</strong> column auto-feeds the Data Asset map.</p>
              <Button size="sm" onClick={() => setSteps([...state.steps, { ...newStep(), stepNumber: state.steps.length + 1 }])}>
                <Plus className="mr-1 h-4 w-4" /> Add step
              </Button>
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
              <Button onClick={() => setTab("assets")}>Next: Data Assets →</Button>
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
            <div className="flex justify-between"><Button variant="ghost" onClick={() => setTab("steps")}>← Back</Button><Button onClick={() => setTab("dq")}>Next: Data Quality →</Button></div>
          </TabsContent>

          <TabsContent value="dq" className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">Score each data asset on the six DAMA DQ dimensions (1=Poor → 5=Excellent).</p>
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
              <Button size="lg" onClick={onGenerate} disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Blueprint
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="result" className="mt-6 space-y-6">
            {!state.result ? (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
                No blueprint yet. Complete the previous steps and click <strong>Generate Blueprint</strong>.
                <div className="mt-4"><Button onClick={onGenerate} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Generate now</Button></div>
              </CardContent></Card>
            ) : (
              <div ref={fullRef} className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">
                    Export the full blueprint or any individual section as PDF.
                  </div>
                  <Button size="sm" onClick={() => exportSection(fullRef, "data-blueprint-full", "Data Blueprint — Full Report")} disabled={exporting !== null}>
                    {exporting === "data-blueprint-full" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileDown className="mr-1 h-4 w-4" />}
                    Export full PDF
                  </Button>
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
                    <CardTitle>Hub-and-spoke activity backlog</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => exportSection(hubSpokeRef, "hub-spoke-activities", "Hub-and-Spoke Activities")} disabled={exporting !== null}>
                      <Download className="mr-1 h-3.5 w-3.5" /> PDF
                    </Button>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-3">
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
const LEVEL_NAMES = ["No Capability", "Initial", "Repeatable", "Defined", "Managed", "Transformational"];

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
