import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Users, Eye, Trash2, ShieldAlert } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-store";
import { listSubmissions, deleteSubmission, type Submission } from "@/lib/submissions-store";
import { DIMENSIONS, MATURITY_LEVELS, TOTAL_QUESTIONS } from "@/lib/assessment-data";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Facilitator Admin · Audit submissions" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, hydrated } = useAuth();
  const navigate = useNavigate();
  const [subs, setSubs] = useState<Submission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) navigate({ to: "/login" });
  }, [hydrated, user, navigate]);

  useEffect(() => {
    setSubs(listSubmissions());
  }, []);

  const selected = useMemo(() => subs.find((s) => s.id === selectedId) || null, [subs, selectedId]);

  if (!hydrated || !user) return <div className="min-h-screen bg-background"><SiteHeader /></div>;

  if (user.role !== "facilitator") {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-xl px-6 py-20 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-warning" />
          <h1 className="mt-4 text-2xl font-bold">Facilitator access only</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in as a facilitator to view the audit dashboard.</p>
          <Button asChild className="mt-6"><Link to="/login">Sign in</Link></Button>
        </div>
      </div>
    );
  }

  const remove = (id: string) => {
    deleteSubmission(id);
    setSubs(listSubmissions());
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="min-h-screen bg-[image:var(--gradient-subtle)]">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Facilitator</div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Audit dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              All assessments submitted on this device. {subs.length} submission{subs.length === 1 ? "" : "s"}.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{user.email}</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold uppercase tracking-wider text-primary">Facilitator</span>
          </div>
        </div>

        {subs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">No submissions yet. Once users complete the assessment they will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
            <div className="space-y-2">
              {subs.map((s) => {
                const isSel = s.id === selectedId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${isSel ? "border-primary bg-primary/5" : "border-border bg-card hover:border-foreground/20"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="truncate font-medium">{s.email}</div>
                      <span className="text-[11px] text-muted-foreground">{new Date(s.submittedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {s.state.org.name || "—"} · {Object.keys(s.state.answers).length}/{TOTAL_QUESTIONS} answered
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <span style={{ color: "oklch(0.55 0.20 30)" }}>Current <strong>{s.overallCurrent.toFixed(1)}</strong></span>
                      <span className="text-primary">Target <strong>{s.overallTarget.toFixed(1)}</strong></span>
                      <span className="ml-auto text-muted-foreground">Gap {(s.overallTarget - s.overallCurrent).toFixed(1)}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              {!selected ? (
                <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-muted-foreground">
                  <div className="text-center"><Eye className="mx-auto mb-2 h-6 w-6" />Select a submission to view full responses</div>
                </div>
              ) : (
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                    <div>
                      <h2 className="text-lg font-bold">{selected.email}</h2>
                      <p className="text-xs text-muted-foreground">
                        {selected.state.org.name || "—"} · Respondent: {selected.state.org.respondent || "—"} · Submitted {new Date(selected.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => remove(selected.id)}>
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <Metric label="Current" value={selected.overallCurrent.toFixed(1)} />
                    <Metric label="Target" value={selected.overallTarget.toFixed(1)} />
                    <Metric label="Gap" value={(selected.overallTarget - selected.overallCurrent).toFixed(1)} />
                  </div>

                  <div className="mt-6 space-y-4">
                    {DIMENSIONS.map((d) => (
                      <div key={d.id} className="rounded-lg border border-border">
                        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2">
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: d.color }}>{d.short}</div>
                            <div className="text-sm font-medium">{d.name}</div>
                          </div>
                        </div>
                        <div className="divide-y divide-border">
                          {d.questions.map((q, i) => {
                            const a = selected.state.answers[q.id];
                            return (
                              <div key={q.id} className="px-4 py-3">
                                <div className="text-xs text-muted-foreground">Q{i + 1}</div>
                                <div className="text-sm font-medium">{q.text}</div>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                  {a ? (
                                    <>
                                      <span className="rounded bg-[oklch(0.96_0.04_30)] px-2 py-0.5 text-[oklch(0.40_0.18_30)]">
                                        Current · L{a.current} · {MATURITY_LEVELS[a.current].name}
                                      </span>
                                      <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">
                                        Target · L{a.target} · {MATURITY_LEVELS[a.target].name}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-muted-foreground italic">No answer</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
