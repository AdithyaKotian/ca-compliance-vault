"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { ShieldCheck, Loader2 } from "lucide-react";

type RoleSelection = "admin" | "client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleSelection>("admin");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        toast.error(error.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      const user = data?.user ?? null;
      if (!user) {
        toast.error("Unable to sign in. Please try again.");
        setLoading(false);
        return;
      }

      // Fetch user profile to determine their configured role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const profileRole = profile?.role?.toLowerCase();

      if (profileRole === "client" || role === "client") {
        toast.success("Welcome back! Redirecting to client portal...");
        router.push("/client-portal");
        router.refresh();
      } else {
        toast.success("Welcome back! Redirecting to dashboard...");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      toast.error(message);
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string, demoRole: RoleSelection) => {
    setEmail(demoEmail);
    setPassword("demo123");
    setRole(demoRole);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Branding Hero */}
      <div className="hidden md:flex w-1/2 items-center justify-center p-16 bg-slate-900 text-white">
        <div className="max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 border border-slate-700">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            SOC-2 Compliant Vault for CA & Tax Firms
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            CA Compliance Vault
          </h2>
          <h1 className="text-2xl font-medium text-slate-300 leading-relaxed">
            Stop chasing client documents. Automate collection, filing, and billing in one unified portal.
          </h1>

          <div className="grid gap-3 pt-4 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Role-based access for Admins, Accountants, and Clients
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              End-to-end encrypted document management
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Real-time statutory deadline tracking & audit trails
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Integrated invoice generation and payment tracking
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Card */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Card className="border-slate-200 shadow-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-slate-900">
                Sign in to your account
              </CardTitle>
              <p className="text-sm text-slate-500">
                Enter your firm email and password to access the portal.
              </p>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleLogin();
                }}
                className="space-y-4"
              >
                <div className="flex rounded-lg bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
                      role === "admin"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Firm Staff / Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("client")}
                    className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
                      role === "client"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Client
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Email address</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@firm.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700">Password</label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-slate-500 hover:text-slate-900 underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                {/* Quick Demo Fill Buttons */}
                <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div className="text-xs font-semibold text-slate-700">
                    One-Click Demo Credentials:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs justify-start h-auto py-1.5 px-2 bg-white"
                      onClick={() => handleDemoFill("admin@kotianandco.in", "admin")}
                    >
                      <div className="text-left">
                        <div className="font-semibold text-slate-800">Firm Admin</div>
                        <div className="text-[10px] text-slate-500">admin@kotianandco.in</div>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs justify-start h-auto py-1.5 px-2 bg-white"
                      onClick={() => handleDemoFill("client@abctraders.in", "client")}
                    >
                      <div className="text-left">
                        <div className="font-semibold text-slate-800">Client User</div>
                        <div className="text-[10px] text-slate-500">client@abctraders.in</div>
                      </div>
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}