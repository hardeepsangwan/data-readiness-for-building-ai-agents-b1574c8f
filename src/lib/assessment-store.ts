import { useEffect, useState } from "react";
import type { MaturityLevel } from "./assessment-data";

export interface AnswerEntry {
  current: MaturityLevel;
  target: MaturityLevel;
}

export interface AssessmentState {
  org: {
    name: string;
    respondent: string;
    date: string;
    businessFunction: string;
    businessProcess: string;
  };
  answers: Record<string, AnswerEntry>;
  workshopId?: string | null;
}

const KEY_BASE = "fabric-data-assessment-v2";

const initial: AssessmentState = {
  org: {
    name: "",
    respondent: "",
    date: new Date().toISOString().slice(0, 10),
    businessFunction: "Finance & FP&A",
    businessProcess: "",
  },
  answers: {},
  workshopId: null,
};

function getKey(): string {
  if (typeof window === "undefined") return KEY_BASE;
  const wid = localStorage.getItem("fabric-current-workshop-v1");
  return wid ? `${KEY_BASE}::${wid}` : KEY_BASE;
}
const KEY = KEY_BASE; // legacy fallback name (unused for reads)
void KEY;

function read(): AssessmentState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(getKey());
    if (!raw) return { ...initial, org: { ...initial.org, date: new Date().toISOString().slice(0, 10) } };
    const parsed = JSON.parse(raw);
    return { ...initial, ...parsed, org: { ...initial.org, ...(parsed.org || {}) } };
  } catch {
    return initial;
  }
}

function write(s: AssessmentState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getKey(), JSON.stringify(s));
}

export function useAssessment() {
  const [state, setState] = useState<AssessmentState>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(read());
    setHydrated(true);
    const onChange = () => setState(read());
    window.addEventListener("workshops-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("workshops-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const update = (updater: (s: AssessmentState) => AssessmentState) => {
    setState((prev) => {
      const next = updater(prev);
      write(next);
      return next;
    });
  };

  const setAnswer = (questionId: string, entry: AnswerEntry) =>
    update((s) => ({ ...s, answers: { ...s.answers, [questionId]: entry } }));

  const setOrg = (org: Partial<AssessmentState["org"]>) =>
    update((s) => ({ ...s, org: { ...s.org, ...org } }));

  const reset = () => {
    write(initial);
    setState(initial);
  };

  return { state, hydrated, setAnswer, setOrg, reset };
}
