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

const makeInitial = (): AssessmentState => ({
  org: {
    name: "",
    respondent: "",
    date: new Date().toISOString().slice(0, 10),
    businessFunction: "",
    businessProcess: "",
  },
  answers: {},
  workshopId: null,
});

function getKey(): string {
  if (typeof window === "undefined") return KEY_BASE;
  const wid = localStorage.getItem("fabric-current-workshop-v1");
  return wid ? `${KEY_BASE}::${wid}` : KEY_BASE;
}

function read(): AssessmentState {
  const init = makeInitial();
  if (typeof window === "undefined") return init;
  try {
    const raw = localStorage.getItem(getKey());
    if (!raw) return init;
    const parsed = JSON.parse(raw);
    return { ...init, ...parsed, org: { ...init.org, ...(parsed.org || {}) } };
  } catch {
    return init;
  }
}

function write(s: AssessmentState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getKey(), JSON.stringify(s));
}

export function useAssessment() {
  const [state, setState] = useState<AssessmentState>(() => makeInitial());
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
    const init = makeInitial();
    write(init);
    setState(init);
  };

  return { state, hydrated, setAnswer, setOrg, reset };
}
