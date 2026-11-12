"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not send reset email.");
        return;
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We’ll email a reset link if that address is on the RealtyCook team. Custom SMTP is required for reliable delivery outside the Supabase org."
    >
      {done ? (
        <div className="space-y-4">
          <p className="rounded-xl bg-emerald-500/10 px-3 py-3 text-sm text-emerald-900">
            If an account exists for <strong>{email}</strong>, a reset link has been sent. Check your inbox
            (and spam).
          </p>
          <p className="text-xs leading-relaxed text-ink/55">
            Note: On Supabase Free without custom SMTP, reset emails only deliver to organization team
            addresses. Ask a Superadmin if you don’t receive one.
          </p>
          <Link href="/login" className="inline-flex text-sm font-semibold text-brand-red hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@realtycook.com"
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
            {busy ? "Sending…" : "Send reset link"}
          </Button>
          <p className="text-center text-xs text-ink/50">
            <Link href="/login" className="font-semibold text-ink/70 hover:text-brand-red">
              ← Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
