import type { AssessmentState } from "./assessment-store";

const KEY = "fabric-submissions-v1";

export interface Submission {
  id: string;
  email: string;
  role: "user" | "facilitator";
  submittedAt: string;
  state: AssessmentState;
  overallCurrent: number;
  overallTarget: number;
}

export function listSubmissions(): Submission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Submission[]) : [];
  } catch {
    return [];
  }
}

export function saveSubmission(s: Submission) {
  const all = listSubmissions();
  // replace existing for same email if present, otherwise append
  const existingIdx = all.findIndex((x) => x.email === s.email);
  if (existingIdx >= 0) all[existingIdx] = s;
  else all.push(s);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteSubmission(id: string) {
  const all = listSubmissions().filter((x) => x.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}
