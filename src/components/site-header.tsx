import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpenCheck, LogOut, Shield, Plus, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useWorkshops } from "@/lib/workshops-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SiteHeader() {
  const { user, hydrated, logout } = useAuth();
  const { workshops, currentId, create, select } = useWorkshops();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [wsName, setWsName] = useState("");

  const onLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const currentWs = workshops.find((w) => w.id === currentId) || null;

  const onCreate = () => {
    if (!user) return;
    create(wsName, user.email);
    setWsName("");
    setDialogOpen(false);
    navigate({ to: "/blueprint" });
  };

  return (
    <header className="no-print sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[image:var(--gradient-hero)] shadow-[var(--shadow-glow)] transition-transform group-hover:scale-105">
            <BookOpenCheck className="h-5 w-5 text-primary-foreground" aria-label="Data Blueprint playbook" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Data Blueprint</div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Reusable Data &amp; AI framework</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link to="/" activeOptions={{ exact: true }} className="text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>Overview</Link>
          <Link to="/blueprint" className="text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>Blueprint</Link>
          {hydrated && user?.role === "facilitator" && (
            <Link to="/admin" className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {hydrated && user?.role === "facilitator" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="max-w-[140px] truncate">{currentWs ? currentWs.name : "Workshops"}</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Workshops</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-3.5 w-3.5" /> Create a new workshop
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {workshops.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">No workshops yet</div>
                )}
                {workshops.map((w) => (
                  <DropdownMenuItem key={w.id} onClick={() => select(w.id)}>
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="truncate">{w.name}</span>
                      {w.id === currentId && <span className="text-[10px] font-semibold uppercase text-primary">Active</span>}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new workshop</DialogTitle>
            <DialogDescription>
              Workshops let you run the readiness assessment with multiple groups without signing out.
              Each workshop keeps its own answers, organization, business function and process.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ws-name">Workshop name</Label>
            <Input
              id="ws-name"
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              placeholder="e.g. Contoso FP&A — Apr 2026"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={onCreate}>Create &amp; switch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
