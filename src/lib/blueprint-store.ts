import { useEffect, useState } from "react";
import type {
  ProcessStep,
  DataAsset,
  DownstreamAsset,
  DataQualityScore,
  DataHiveAnswers,
  TargetTOM,
  ProcessContext,
  BlueprintResult,
} from "./blueprint-schema";
import { DEFAULT_TARGET_TOM, DEFAULT_DATA_HIVE_ANSWERS } from "./blueprint-template";

export interface BlueprintState {
  context: ProcessContext;
  steps: ProcessStep[];
  assets: DataAsset[];
  downstream: DownstreamAsset[];
  dq: DataQualityScore[];
  hive: DataHiveAnswers;
  tom: TargetTOM;
  result: BlueprintResult | null;
}

const KEY_BASE = "indurent-data-blueprint-v1";

const makeInitial = (): BlueprintState => ({
  context: {
    organisation: "",
    businessFunction: "",
    businessProcess: "",
    sponsor: "",
    cycleVolume: "",
    baselineEffort: "",
    timeline: "",
    valueDrivers: "",
    kpis: "",
    complianceConstraints: "",
    decisionsSupported: "",
  },
  steps: [],
  assets: [],
  downstream: [],
  dq: [],
  hive: { ...DEFAULT_DATA_HIVE_ANSWERS },
  tom: { ...DEFAULT_TARGET_TOM },
  result: null,
});

function getKey(): string {
  if (typeof window === "undefined") return KEY_BASE;
  const wid = localStorage.getItem("fabric-current-workshop-v1");
  return wid ? `${KEY_BASE}::${wid}` : KEY_BASE;
}

function read(): BlueprintState {
  const init = makeInitial();
  if (typeof window === "undefined") return init;
  try {
    const raw = localStorage.getItem(getKey());
    if (!raw) return init;
    const parsed = JSON.parse(raw);
    return {
      ...init,
      ...parsed,
      context: { ...init.context, ...(parsed.context || {}) },
      hive: { ...init.hive, ...(parsed.hive || {}) },
      tom: Object.fromEntries(
        (Object.keys(init.tom) as (keyof TargetTOM)[]).map((k) => {
          const v = parsed.tom?.[k];
          return [k, typeof v === "string" && v.trim() !== "" ? v : init.tom[k]];
        })
      ) as TargetTOM,
      steps: parsed.steps || [],
      assets: parsed.assets || [],
      downstream: parsed.downstream || [],
      dq: parsed.dq || [],
      result: parsed.result || null,
    };
  } catch {
    return init;
  }
}

function write(s: BlueprintState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getKey(), JSON.stringify(s));
}

export function useBlueprint() {
  const [state, setState] = useState<BlueprintState>(() => makeInitial());
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

  const update = (updater: (s: BlueprintState) => BlueprintState) =>
    setState((prev) => {
      const next = updater(prev);
      write(next);
      return next;
    });

  return {
    state,
    hydrated,
    setContext: (c: Partial<ProcessContext>) =>
      update((s) => ({ ...s, context: { ...s.context, ...c } })),
    setSteps: (steps: ProcessStep[]) => update((s) => ({ ...s, steps })),
    setAssets: (assets: DataAsset[]) => update((s) => ({ ...s, assets })),
    setDownstream: (downstream: DownstreamAsset[]) => update((s) => ({ ...s, downstream })),
    setDq: (dq: DataQualityScore[]) => update((s) => ({ ...s, dq })),
    setHive: (h: Partial<DataHiveAnswers>) =>
      update((s) => ({ ...s, hive: { ...s.hive, ...h } })),
    setTom: (t: Partial<TargetTOM>) =>
      update((s) => ({ ...s, tom: { ...s.tom, ...t } })),
    setResult: (result: BlueprintResult | null) =>
      update((s) => ({ ...s, result })),
    loadSeed: (seed: Partial<BlueprintState>) =>
      update((s) => ({ ...s, ...seed })),
    reset: () => {
      const init = makeInitial();
      write(init);
      setState(init);
    },
  };
}
