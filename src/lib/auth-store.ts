import { useEffect, useState } from "react";

export type Role = "user" | "facilitator";

export interface AuthUser {
  email: string;
  role: Role;
}

const KEY = "fabric-auth-v1";

function read(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(read());
    setHydrated(true);
    const onStorage = () => setUser(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = (u: AuthUser) => {
    localStorage.setItem(KEY, JSON.stringify(u));
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem(KEY);
    setUser(null);
  };
  return { user, hydrated, login, logout };
}

export function getCurrentUser(): AuthUser | null {
  return read();
}
