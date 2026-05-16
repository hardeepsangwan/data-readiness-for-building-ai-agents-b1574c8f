import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  short: string;
  status: "done" | "current" | "todo";
}

interface Props {
  steps: Step[];
  introActive?: boolean;
}

export function HorizontalStepper({ steps, introActive }: Props) {
  return (
    <div className="w-full overflow-x-auto">
      <ol className="flex min-w-[640px] items-start">
        {steps.map((s, i) => {
          const isLast = i === steps.length - 1;
          const isCurrent = s.status === "current" && !introActive;
          const isDone = s.status === "done";
          return (
            <li key={s.label} className="flex flex-1 items-start">
              <div className="flex flex-1 flex-col items-center text-center">
                <div className="flex w-full items-center">
                  {/* left connector */}
                  <div
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      i === 0 ? "bg-transparent" : isDone || isCurrent ? "bg-primary" : "bg-muted",
                    )}
                  />
                  {/* node */}
                  <div
                    className={cn(
                      "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all",
                      isDone && "border-primary bg-primary text-primary-foreground",
                      isCurrent && "border-primary bg-background text-primary ring-4 ring-primary/15",
                      !isDone && !isCurrent && "border-muted bg-background text-muted-foreground",
                    )}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  {/* right connector */}
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
                  <div className="uppercase tracking-[0.08em]">Step {i + 1}</div>
                  <div className="mt-0.5">{s.short}</div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
