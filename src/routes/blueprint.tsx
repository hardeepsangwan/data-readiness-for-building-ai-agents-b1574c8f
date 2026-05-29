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
import { exportElementToPdf } from "@/lib/pdf-export";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SERVICE_CHARGE_CONTEXT,
  SERVICE_CHARGE_STEPS,
  SERVICE_CHARGE_ASSETS,
  DATA_HIVE_PROMPTS,
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
  const { state, hydrated, setContext, setSteps, setAssets, setDq, setHive, setTom, setResult, loadSeed, reset } = useBlueprint();
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

  const exportSection = async (ref: React.RefObject<HTMLElement>, name: string, title: string) => {
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
              Document any business process step-by-step, map its data assets and quality, answer the Data Hive readiness
              questions, then generate a hub-and-spoke transformation blueprint with per-step Data & AI interventions.
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
            <TabsTrigger value="steps">2. AS-IS Steps</TabsTrigger>
            <TabsTrigger value="assets">3. Data Assets</TabsTrigger>
            <TabsTrigger value="dq">4. Data Quality</TabsTrigger>
            <TabsTrigger value="hive">5. Data Hive</TabsTrigger>
            <TabsTrigger value="tom">6. Target TOM</TabsTrigger>
            <TabsTrigger value="result">7. Blueprint</TabsTrigger>
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
            <div className="flex justify-between"><Button variant="ghost" onClick={() => setTab("assets")}>← Back</Button><Button onClick={() => setTab("hive")}>Next: Data Hive →</Button></div>
          </TabsContent>

          <TabsContent value="hive" className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">Indurent's Data Hive is the Fabric-based platform every domain onboards to. Answer how this process will land there.</p>
            <div className="grid gap-4 md:grid-cols-2">
              {DATA_HIVE_PROMPTS.map((p) => (
                <Card key={p.key}>
                  <CardHeader className="pb-2"><CardTitle className="text-base">{p.label}</CardTitle></CardHeader>
                  <CardContent>
                    <p className="mb-2 text-xs text-muted-foreground">{p.help}</p>
                    <Textarea rows={4} value={state.hive[p.key]} onChange={(e) => setHive({ [p.key]: e.target.value } as any)} />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-between"><Button variant="ghost" onClick={() => setTab("dq")}>← Back</Button><Button onClick={() => setTab("tom")}>Next: Target TOM →</Button></div>
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
              <Button variant="ghost" onClick={() => setTab("hive")}>← Back</Button>
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
              <>
                <Card>
                  <CardHeader><CardTitle>Executive summary</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{state.result.executiveSummary}</p>
                    <div className="mt-2 text-xs text-muted-foreground">Model: {state.result.model} · {new Date(state.result.generatedAt).toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Current vs Target — 6-axis readiness</CardTitle></CardHeader>
                  <CardContent><BlueprintRadar axes={state.result.radar} /></CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Per-step Data & AI interventions</CardTitle></CardHeader>
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

                <Card>
                  <CardHeader><CardTitle>Gap register (vs hub-and-spoke target)</CardTitle></CardHeader>
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

                <Card>
                  <CardHeader><CardTitle>Hub-and-spoke activity backlog</CardTitle></CardHeader>
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

                <Card>
                  <CardHeader><CardTitle>Prioritised use-case backlog</CardTitle></CardHeader>
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
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
