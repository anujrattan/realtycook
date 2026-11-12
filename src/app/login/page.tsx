"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/crm";
  const reason = params.get("reason");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signError) {
        setError(signError.message);
        return;
      }

      const mustReset =
        data.user?.app_metadata?.must_reset_password === true ||
        data.user?.app_metadata?.must_reset_password === "true";

      router.replace(mustReset ? "/reset-password" : next.startsWith("/") ? next : "/crm");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Sign in to CRM"
      subtitle={
        reason === "idle"
          ? "Your session expired after 7 days of inactivity. Sign in again to continue."
          : "Use your RealtyCook email and password. First login uses the shared starter password, then you’ll set your own."
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@realtycook.com"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="login-password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-semibold text-brand-red hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error ? (
          <p className="rounded-xl bg-brand-red-soft px-3 py-2 text-sm text-brand-red-deep">{error}</p>
        ) : null}
        <Button
          type="submit"
          disabled={busy}
          className="h-11 w-full rounded-xl bg-brand-red text-white shadow-red"
        >
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-xs text-ink/50">
        <Link href="/" className="font-semibold text-ink/70 hover:text-brand-red">
          ← Back to website
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-svh place-items-center text-sm text-ink/50">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
