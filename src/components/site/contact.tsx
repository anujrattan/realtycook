"use client";

import { CheckCircle2, Loader2, Phone, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { INTENT_EVENT, type Intent } from "./intent";

const INTENT_OPTIONS: { id: Intent; label: string; hint: string }[] = [
  { id: "buy", label: "Buy", hint: "A home or second home" },
  { id: "sell", label: "Sell", hint: "Get the right price" },
  { id: "invest", label: "Invest", hint: "Income or growth" },
  { id: "rent", label: "Rent / Lease", hint: "Find or place a tenant" },
];

const BUDGETS = [
  { value: "under-50l", label: "Under ₹50 L" },
  { value: "50l-1cr", label: "₹50 L – ₹1 Cr" },
  { value: "1-3cr", label: "₹1 – 3 Cr" },
  { value: "3-10cr", label: "₹3 – 10 Cr" },
  { value: "10cr-plus", label: "₹10 Cr+" },
  { value: "unsure", label: "Not sure yet" },
];

type Status = "idle" | "submitting" | "success" | "error";

export function Contact() {
  const [intent, setIntent] = useState<Intent>("buy");
  const [budget, setBudget] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const onIntent = (e: Event) => setIntent((e as CustomEvent<Intent>).detail);
    window.addEventListener(INTENT_EVENT, onIntent);
    return () => window.removeEventListener(INTENT_EVENT, onIntent);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus("submitting");
    setErrors({});
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(form), intent, budget }),
      });
      if (res.status === 422) {
        const data = await res.json();
        setErrors(data.errors ?? {});
        setStatus("idle");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="section scroll-mt-24 py-24 sm:py-32">
      <div className="grid overflow-hidden rounded-[2rem] border border-border bg-white shadow-lift lg:grid-cols-[0.85fr_1.15fr]">
        <div className="relative overflow-hidden bg-brand-red p-8 text-white sm:p-12">
          <div className="pointer-events-none absolute -right-24 -bottom-24 size-80 rounded-full border-[40px] border-white/10" />
          <div className="pointer-events-none absolute -right-8 -bottom-8 size-40 rounded-full border-[24px] border-white/10" />
          <span className="text-xs font-semibold tracking-[0.18em] text-white/70 uppercase">Free consultation</span>
          <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">Tell us what you&apos;re hungry for.</h2>
          <p className="mt-5 max-w-sm text-white/80">
            Share a few details and a RealtyCook advisor will call you back within one working day. No spam, and no
            pressure to sign anything.
          </p>
          <ul className="relative mt-10 space-y-4 text-sm">
            <li className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-white/15">
                <Phone className="size-4" />
              </span>
              A real advisor calls you, not a call centre
            </li>
            <li className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-white/15">
                <ShieldCheck className="size-4" />
              </span>
              Your number is never shared with builders
            </li>
          </ul>
        </div>

        <div className="p-8 sm:p-12">
          {status === "success" ? (
            <div className="flex h-full flex-col items-start justify-center gap-4 py-10" role="status">
              <CheckCircle2 className="size-12 text-brand-red" />
              <h3 className="text-3xl font-semibold text-ink">Order received.</h3>
              <p className="max-w-md text-ink/65">
                Thanks! An advisor will call you within one working day to understand what you&apos;re looking for. Keep
                an eye on your phone.
              </p>
              <Button variant="outline" className="mt-2 h-11 rounded-full px-5" onClick={() => setStatus("idle")}>
                Send another enquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-6">
              <fieldset>
                <legend className="text-sm font-medium text-ink">I&apos;d like to</legend>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {INTENT_OPTIONS.map((o) => (
                    <label
                      key={o.id}
                      className={cn(
                        "cursor-pointer rounded-2xl border p-3 transition-all has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                        intent === o.id ? "border-brand-red bg-brand-red-soft" : "border-border hover:border-ink/30",
                      )}
                    >
                      <input
                        type="radio"
                        name="intent-choice"
                        value={o.id}
                        checked={intent === o.id}
                        onChange={() => setIntent(o.id)}
                        className="sr-only"
                      />
                      <span className={cn("block text-sm font-semibold", intent === o.id ? "text-brand-red-deep" : "text-ink")}>
                        {o.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink/55">{o.hint}</span>
                    </label>
                  ))}
                </div>
                {errors.intent && <p className="mt-2 text-sm text-destructive">{errors.intent}</p>}
              </fieldset>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldWrap id="name" label="Full name" error={errors.name}>
                  <Input id="name" name="name" autoComplete="name" placeholder="Aarav Mehta" aria-invalid={!!errors.name} className="h-11" />
                </FieldWrap>
                <FieldWrap id="phone" label="Phone" error={errors.phone}>
                  <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98xxxxxx10" aria-invalid={!!errors.phone} className="h-11" />
                </FieldWrap>
                <FieldWrap id="email" label="Email (optional)" error={errors.email}>
                  <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} className="h-11" />
                </FieldWrap>
                <FieldWrap id="city" label="City or locality">
                  <Input id="city" name="city" placeholder="e.g. Gurugram, Pune, Dubai (NRI)" className="h-11" />
                </FieldWrap>
              </div>

              <FieldWrap id="budget" label="Budget">
                <Select items={BUDGETS} value={budget} onValueChange={(v) => setBudget(v as string | null)}>
                  <SelectTrigger id="budget" className="h-11 w-full">
                    <SelectValue placeholder="Choose a range" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGETS.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrap>

              <FieldWrap id="message" label="Anything else? (optional)">
                <Textarea id="message" name="message" rows={3} placeholder="Configuration, timeline, must-haves…" />
              </FieldWrap>

              {status === "error" && (
                <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                  We couldn&apos;t send that just now. Please check your connection and try again.
                </p>
              )}

              <Button type="submit" disabled={status === "submitting"} className="h-12 w-full rounded-full text-base shadow-red sm:w-auto sm:px-8">
                {status === "submitting" ? (
                  <>
                    <Loader2 className="animate-spin" /> Sending…
                  </>
                ) : (
                  "Request a call back"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function FieldWrap({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-ink/80">
        {label}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
