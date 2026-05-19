import { useState } from "react";
import { Handshake, ShieldCheck, FileSpreadsheet, ArrowRight, ArrowLeft, Star, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WorkstreamRadar } from "@/components/workstream-radar";
import { WorkstreamActionPlan } from "@/components/workstream-action-plan";
import type { Workstream, MaturityLevel } from "@/lib/assessment-data";
import type { GateSignoff } from "@/lib/assessment-store";

interface Props {
  workstream: Workstream;
  answers: Record<string, { current: MaturityLevel; target: MaturityLevel }>;
  existing?: GateSignoff;
  defaultSignedBy?: string;
  onSign: (sg: GateSignoff) => void;
  onDownload: () => void;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
}

export function HandshakeCard({
  workstream, answers, existing, defaultSignedBy, onSign, onDownload, onBack, onNext, nextLabel,
}: Props) {
  const [signedBy, setSignedBy] = useState(existing?.signedBy ?? defaultSignedBy ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const isSigned = !!existing;

  const sign = () => {
    if (!signedBy.trim()) return;
    onSign({ signedBy: signedBy.trim(), signedAt: new Date().toISOString(), notes });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 p-6 shadow-[var(--shadow-soft)] md:p-8" style={{ borderColor: workstream.color, background: `color-mix(in oklab, ${workstream.color} 6%, white)` }}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: workstream.color }}>
            Handshake · End of {workstream.short}
          </div>
        </div>
        <h2 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Star className="h-5 w-5" style={{ color: workstream.color }} /> {workstream.keyOutput}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You've completed the {workstream.name} workstream. Review the key outputs, confirm the gate criteria,
          and hand over the controlled outputs to <strong>{workstream.handshakeTo}</strong>.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Deliverables produced</div>
            <ul className="mt-2 space-y-1.5 text-sm">
              {workstream.templates.map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <FileSpreadsheet className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-warning">
              <ShieldCheck className="h-3.5 w-3.5" /> Gate criteria
            </div>
            <ul className="mt-2 space-y-1.5 text-sm">
              {workstream.gateCriteria.map((g) => (
                <li key={g} className="flex items-start gap-2">
                  <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: workstream.color }}>
            <Handshake className="h-3.5 w-3.5" /> Handover to {workstream.handshakeTo}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {workstream.handshakeOutputs.map((o) => (
              <span key={o} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{o}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Gate sign-off</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm the gate criteria above are met, then sign off to unlock the next workstream.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="signedBy">Signed by</Label>
            <Input
              id="signedBy"
              value={signedBy}
              onChange={(e) => setSignedBy(e.target.value)}
              placeholder="Name and role of sponsor / approver"
            />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Conditions, exceptions, references…" />
          </div>
        </div>
        {isSigned && (
          <div className="mt-3 rounded-md bg-success/10 px-3 py-2 text-xs text-success">
            Signed by <strong>{existing.signedBy}</strong> on {new Date(existing.signedAt).toLocaleString()}
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={sign} disabled={!signedBy.trim()}>
            <Handshake className="mr-2 h-4 w-4" /> {isSigned ? "Re-sign" : "Sign gate"}
          </Button>
          <Button variant="outline" onClick={onDownload}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Download {workstream.short} Excel
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} disabled={!isSigned} className="shadow-[var(--shadow-elegant)]">
          {nextLabel} <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
