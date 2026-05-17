import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth, type Role } from "@/lib/auth-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Sign in · Fabric Data Readiness" }],
  }),
  component: LoginPage,
});

const FACILITATOR_USERNAME = "hardeepsangwan";
const FACILITATOR_PASSWORD = "Master@11";

function LoginPage() {
  const { user, hydrated, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (hydrated && user) {
      navigate({ to: user.role === "facilitator" ? "/admin" : "/assessment" });
    }
  }, [hydrated, user, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "facilitator") {
      if (adminUser.trim() !== FACILITATOR_USERNAME || adminPass !== FACILITATOR_PASSWORD) {
        setErr("Invalid admin credentials. Only the authorised facilitator can sign in as admin.");
        return;
      }
      login({ email: `${FACILITATOR_USERNAME}@admin.local`, role: "facilitator" });
      navigate({ to: "/admin" });
      return;
    }
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setErr("Enter a valid email address");
      return;
    }
    login({ email: clean, role });
    navigate({ to: "/assessment" });
  };

  return (
    <div className="min-h-screen bg-[image:var(--gradient-subtle)]">
      <SiteHeader />
      <div className="mx-auto flex max-w-md flex-col px-6 py-16">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Sign in</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Access the assessment to identify data readiness for building AI agents</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your work email and choose your role. Facilitators (admin) can audit all
            submissions and create workshops; users complete the readiness assessment.
          </p>

          <form className="mt-6 space-y-5" onSubmit={submit}>
            {role === "user" && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErr(""); }}
                  required={role === "user"}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Role</Label>
              <RadioGroup value={role} onValueChange={(v) => setRole(v as Role)} className="grid gap-2">
                <label htmlFor="r-user" className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/40">
                  <RadioGroupItem id="r-user" value="user" className="mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">User</div>
                    <div className="text-xs text-muted-foreground">Complete the readiness assessment and view your report.</div>
                  </div>
                </label>
                <label htmlFor="r-fac" className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/40">
                  <RadioGroupItem id="r-fac" value="facilitator" className="mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Facilitator (Admin)</div>
                    <div className="text-xs text-muted-foreground">Audit all submissions, responses and results.</div>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {err && <div className="text-xs text-destructive">{err}</div>}

            <Button type="submit" size="lg" className="w-full shadow-[var(--shadow-elegant)]">
              <LogIn className="mr-2 h-4 w-4" /> Continue
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
