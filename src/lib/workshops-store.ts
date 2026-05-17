import { useEffect, useState } from "react";

export interface Workshop {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
}

const KEY = "fabric-workshops-v1";
const CUR_KEY = "fabric-current-workshop-v1";

function readAll(): Workshop[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function writeAll(ws: Workshop[]) {
  localStorage.setItem(KEY, JSON.stringify(ws));
}
export function getCurrentWorkshopId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CUR_KEY);
}
export function setCurrentWorkshopId(id: string | null) {
  if (id) localStorage.setItem(CUR_KEY, id);
  else localStorage.removeItem(CUR_KEY);
  window.dispatchEvent(new Event("workshops-changed"));
}

export function useWorkshops() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setWorkshops(readAll());
      setCurrentId(getCurrentWorkshopId());
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("workshops-changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("workshops-changed", refresh);
    };
  }, []);

  const create = (name: string, createdBy: string): Workshop => {
    const w: Workshop = {
      id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || `Workshop ${new Date().toLocaleString()}`,
      createdAt: new Date().toISOString(),
      createdBy,
    };
    const next = [...readAll(), w];
    writeAll(next);
    setCurrentWorkshopId(w.id);
    return w;
  };

  const select = (id: string | null) => setCurrentWorkshopId(id);

  return { workshops, currentId, create, select };
}
