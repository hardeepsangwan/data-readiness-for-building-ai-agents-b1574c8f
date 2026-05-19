import { Check, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorkstreamStep {
  id: string;
  name: string;
  short: string;
  status: "done" | "current" | "todo";
  gateSigned?: boolean;
}

interface Props {
  steps: WorkstreamStep[];
  activeWorkstream?: string;
}

export function WorkstreamStepper({ steps, activeWorkstream }: Props) {
  return (
    <div>
      {activeWorkstream && (
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Workstream · {activeWorkstream}
        </div>
      )}
      <div className="w-full overflow-x-auto">
        <ol className="flex min-w-[640px] items-start">
          {steps.map((s, i) => {
            const isLast = i === steps.length - 1;
            const isCurrent = s.status === "current";
            const isDone = s.status === "done";
            return (
              <li key={s.id} className="flex flex-1 items-start">
                <div className="flex flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    <div
                      className={cn(
                        "h-1 flex-1 rounded-full",
                        i === 0 ? "bg-transparent" : isDone || isCurrent ? "bg-primary" : "bg-muted",
                      )}
                    />
                    <div
                      className={cn(
                        "z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all",
                        isDone && "border-primary bg-primary text-primary-foreground",
                        isCurrent && "border-primary bg-background text-primary ring-4 ring-primary/15",
                        !isDone && !isCurrent && "border-muted bg-background text-muted-foreground",
                      )}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                    <div
                      className={cn(
                        "h-1 flex-1 rounded-full",
                        isLast ? "bg-transparent" : isDone ? "bg-primary" : "bg-muted",
                      )}
                    />
                  </div>
                  <div
                    className={cn(
                      "mt-2 px-1 text-[11px] font-medium leading-tight",
                      isCurrent ? "text-foreground" : isDone ? "text-foreground/80" : "text-muted-foreground",
                    )}
                  >
                    <div className="uppercase tracking-[0.08em]">{s.short}</div>
                    {s.gateSigned && (
                      <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                        <Handshake className="h-2.5 w-2.5" /> Gate
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
