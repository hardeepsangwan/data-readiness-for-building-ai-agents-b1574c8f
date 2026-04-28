import { useEffect, useState } from "react";
import type { MaturityLevel } from "./assessment-data";

export interface AnswerEntry {
  current: MaturityLevel;
  target: MaturityLevel;
}

export interface AssessmentState {
  org: { name: string; respondent: string; date: string };
  answers: Record<string, AnswerEntry>;
}

const KEY = "fabric-data-assessment-v1";

const initial: AssessmentState = {
  org: { name: "", respondent: "", date: new Date().toISOString().slice(0, 10) },
  answers: {},
};

function read(): AssessmentState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    return { ...initial, ...JSON.parse(raw) };
  } catch {
    return initial;
  }
}

function write(s: AssessmentState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function useAssessment() {
  const [state, setState] = useState<AssessmentState>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(read());
    setHydrated(true);
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
