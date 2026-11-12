"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const isRecovery = params.get("type") === "recovery";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not update password.");
        return;
      }
      router.replace("/crm");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={isRecovery ? "Choose a new password" : "Set your password"}
      subtitle={
        isRecovery
          ? "You’re signed in via the email reset link. Pick a new password to continue."
          : "First login requires a personal password. You’ll use this for every future sign-in."
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          {busy ? "Saving…" : "Save password & continue"}
        </Button>
      </form>
      <p className="mt-6 text-center text-xs text-ink/50">
        <Link href="/login" className="font-semibold text-ink/70 hover:text-brand-red">
          ← Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="grid min-h-svh place-items-center text-sm text-ink/50">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
