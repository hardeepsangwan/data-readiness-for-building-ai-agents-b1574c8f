import { Link, useNavigate } from "@tanstack/react-router";
import { Database, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { user, hydrated, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <header className="no-print sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[image:var(--gradient-hero)] shadow-[var(--shadow-glow)] transition-transform group-hover:scale-105">
            <Database className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Fabric Data Readiness</div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Data Readiness for AI agents</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link to="/" activeOptions={{ exact: true }} className="text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>Overview</Link>
          <Link to="/assessment" className="text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>Assessment</Link>
          <Link to="/report" className="text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>Report</Link>
          {hydrated && user?.role === "facilitator" && (
            <Link to="/admin" className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {hydrated && user ? (
            <>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {user.email} · <span className="font-medium text-foreground">{user.role === "facilitator" ? "Facilitator" : "User"}</span>
              </span>
              <Button size="sm" variant="ghost" onClick={onLogout}>
                <LogOut className="mr-1 h-3.5 w-3.5" /> Sign out
              </Button>
            </>
          ) : hydrated ? (
            <Button asChild size="sm" variant="outline"><Link to="/login">Sign in</Link></Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
