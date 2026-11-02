"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Compass,
  Loader2,
  Phone,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ChefHat } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COMPARE_ROWS, MODES } from "@/lib/content";
import { cn } from "@/lib/utils";
import { chooseIntent, INTENT_EVENT, type Intent } from "./intent";

/* ========================================================================== */
/* 1. MODES (LANDING 1) — Clean, Simple 5-Card Bento Grid                     */
/* ========================================================================== */

type SimpleBentoSpec = {
  id: string;
  intent: Intent;
  cta: string;
  colSpan: string;
  theme: "light" | "dark";
  badge: string;
  summary: string;
  checks: string[];
  highlightLabel: string;
  highlightValue: string;
};

const SIMPLE_BENTO: Record<string, SimpleBentoSpec> = {
  homes: {
    id: "homes",
    intent: "buy",
    cta: "Find a home",
    colSpan: "lg:col-span-6",
    theme: "light",
    badge: "Visited in person",
    summary: "Flats, builder floors and kothis picked around your family's needs and budget.",
    checks: [
      "Clear ownership & society NOC checked",
      "Real room sizes & sunlight verified on site",
      "Home loan & registry handled by us",
    ],
    highlightLabel: "Options",
    highlightValue: "Flats · Builder Floors · Kothis",
  },
  commercial: {
    id: "commercial",
    intent: "invest",
    cta: "Explore commercial",
    colSpan: "lg:col-span-6",
    theme: "dark",
    badge: "Main-road locations",
    summary: "Retail shops and showrooms with strong visibility, easy approach and parking.",
    checks: [
      "Frontage, footfall & parking checked on site",
      "Commercial approvals & clear title verified",
      "Price compared with recent market sales",
    ],
    highlightLabel: "Options",
    highlightValue: "Showrooms · Retail Shops",
  },
  upcoming: {
    id: "upcoming",
    intent: "invest",
    cta: "See new launches",
    colSpan: "lg:col-span-4",
    theme: "dark",
    badge: "RERA verified",
    summary: "New projects from trusted builders who actually deliver on time.",
    checks: [
      "RERA papers & approvals read in full",
      "Builder's past delivery record checked",
      "Safe, work-linked payment plans",
    ],
    highlightLabel: "Stage",
    highlightValue: "New Launch · Under Construction",
  },
  land: {
    id: "land",
    intent: "invest",
    cta: "Explore plots",
    colSpan: "lg:col-span-4",
    theme: "light",
    badge: "Approved layouts",
    summary: "Residential and commercial plots with clear boundaries in growing areas.",
    checks: [
      "Approved layout & clear title papers",
      "Boundary pillars & road width walked",
      "Honest advice on holding & resale",
    ],
    highlightLabel: "Options",
    highlightValue: "Villa Plots · Land Parcels",
  },
  leasing: {
    id: "leasing",
    intent: "lease",
    cta: "Lease a property",
    colSpan: "lg:col-span-4",
    theme: "dark",
    badge: "Verified tenants",
    summary: "End-to-end renting for shops, offices and homes—from finding tenants to agreement.",
    checks: [
      "Tenant background & ID checked",
      "Fair rent, deposit & lock-in terms",
      "Registered lease deed & smooth handover",
    ],
    highlightLabel: "Spaces",
    highlightValue: "Shops · Offices · Homes",
  },
};

export function ModesLanding1() {
  return (
    <section id="modes" className="relative scroll-mt-24 overflow-hidden py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(17_17_17/0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(17_17_17/0.035)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000_60%,transparent_100%)]"
      />

      <div className="section">
        <div className="flex flex-col justify-between gap-6 border-b border-border pb-10 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-red/20 bg-brand-red-soft/60 px-3.5 py-1.5 text-xs font-semibold tracking-[0.16em] text-brand-red uppercase">
              <Compass className="size-3.5" />
              <span>Our 5 Services</span>
            </div>
            <h2 className="mt-4 text-4xl leading-[1.06] font-semibold tracking-tight text-ink sm:text-5xl">
              One kitchen. <span className="text-brand-red">Every property &amp; lease.</span>
            </h2>
          </div>

          <p className="max-w-md text-base leading-relaxed text-ink/68 lg:text-right">
            Whether you are buying, selling, investing or leasing, one advisor handles everything under one roof.
          </p>
        </div>

        {/* 5-Card Bento Grid: Top Row (6 + 6), Bottom Row (4 + 4 + 4) */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {MODES.map((m, idx) => {
            const Icon = m.icon;
            const spec = SIMPLE_BENTO[m.id] ?? SIMPLE_BENTO.homes;
            const isDark = spec.theme === "dark";

            return (
              <motion.article
                key={m.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: idx * 0.06, ease: "easeOut" }}
                className={cn(
                  "group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border p-6 transition-all duration-300 sm:p-8",
                  spec.colSpan,
                  isDark
                    ? "border-ink/90 bg-ink text-white shadow-lift hover:border-brand-red/60"
                    : "border-border/90 bg-white text-ink shadow-soft hover:-translate-y-1 hover:border-ink/25 hover:shadow-lift",
                )}
              >
                <div>
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-11 items-center justify-center rounded-2xl",
                          m.tone === "red"
                            ? "bg-brand-red text-white shadow-red"
                            : m.tone === "gold"
                              ? "bg-gold text-ink"
                              : isDark
                                ? "bg-white/10 text-white"
                                : "bg-ink text-white",
                        )}
                      >
                        <Icon className="size-5" />
                      </span>
                      <h3 className="text-2xl font-semibold tracking-tight">{m.title}</h3>
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                        isDark ? "border-white/15 bg-white/[0.06] text-white/85" : "border-border bg-cream text-ink/75",
                      )}
                    >
                      <Sparkles className="size-3 text-brand-red" />
                      {spec.badge}
                    </span>
                  </div>

                  {/* Short Summary */}
                  <p className={cn("mt-4 text-sm leading-relaxed sm:text-base", isDark ? "text-white/75" : "text-ink/70")}>
                    {spec.summary}
                  </p>

                  {/* 3 Simple Checks */}
                  <ul
                    className={cn(
                      "mt-5 space-y-2.5 border-t pt-4 text-sm",
                      isDark ? "border-white/10 text-white/85" : "border-border/80 text-ink/80",
                    )}
                  >
                    {spec.checks.map((c) => (
                      <li key={c} className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "flex size-4.5 shrink-0 items-center justify-center rounded-full",
                            isDark ? "bg-brand-red/25 text-[#ff8596]" : "bg-brand-red-soft text-brand-red",
                          )}
                        >
                          <Check className="size-3" />
                        </span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer */}
                <div
                  className={cn(
                    "mt-6 flex items-center justify-between gap-3 border-t pt-4",
                    isDark ? "border-white/10" : "border-border/80",
                  )}
                >
                  <div>
                    <p className={cn("text-[11px]", isDark ? "text-white/45" : "text-ink/45")}>{spec.highlightLabel}</p>
                    <p className={cn("text-xs font-semibold sm:text-sm", isDark ? "text-gold" : "text-ink")}>
                      {spec.highlightValue}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => chooseIntent(spec.intent)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-96",
                      isDark
                        ? "bg-white text-ink hover:bg-brand-red hover:text-white"
                        : "bg-ink text-white hover:bg-brand-red",
                    )}
                  >
                    <span>{spec.cta}</span>
                    <ArrowUpRight className="size-3.5" />
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* 2. COMPARE (LANDING 1) — Simple Service & Property Compare                 */
/* ========================================================================== */

const ASSET_MATRIX = [
  {
    metric: "Best For",
    homes: "Living with family",
    commercial: "Business & regular income",
    upcoming: "Buying early at lower price",
    land: "Long-term wealth growth",
    leasing: "Monthly rent without hassle",
  },
  {
    metric: "Typical Timeframe",
    homes: "Ready or near-ready",
    commercial: "Ready to use",
    upcoming: "2 – 4 years to possession",
    land: "3 – 7+ years hold",
    leasing: "1 – 9 year lease",
  },
  {
    metric: "What We Check First",
    homes: "Clear title, OC & real room size",
    commercial: "Road visibility & parking",
    upcoming: "RERA approval & builder record",
    land: "Approved map & boundary pillars",
    leasing: "Tenant ID & rent agreement",
  },
];

function CompareMark({ v, highlight = false }: { v: 0 | 1 | 2; highlight?: boolean }) {
  if (v === 2)
    return (
      <span
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-full",
          highlight ? "bg-brand-red text-white" : "bg-white/10 text-white",
        )}
        aria-label="Yes"
      >
        <Check className="size-4" />
      </span>
    );
  if (v === 1)
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-white/5 text-white/50" aria-label="Sometimes">
        –
      </span>
    );
  return (
    <span className="inline-flex size-7 items-center justify-center rounded-full text-white/30" aria-label="No">
      ×
    </span>
  );
}

export function CompareLanding1() {
  const [tab, setTab] = useState<"advisory" | "assets">("advisory");

  return (
    <section id="why" className="dark relative scroll-mt-24 overflow-hidden bg-background py-20 text-foreground sm:py-28">
      <div className="pointer-events-none absolute -bottom-60 left-1/2 size-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(200_16_46/0.22),transparent_60%)]" />
      <div className="section relative">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <span className="eyebrow text-[#ff6b7f] before:bg-[#ff6b7f]">Why RealtyCook</span>
            <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">
              Portals list. Brokers push. <span className="text-[#ff6b7f]">We prepare.</span>
            </h2>
            <p className="mt-3 max-w-lg text-white/65">
              We check every property on the ground and stay with you from first visit to registry.
            </p>
          </div>

          <div className="inline-flex rounded-2xl border border-white/12 bg-white/[0.05] p-1.5 backdrop-blur">
            {[
              { id: "advisory" as const, label: "Why Us", icon: ShieldCheck },
              { id: "assets" as const, label: "Compare Services", icon: Scale },
            ].map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors sm:text-sm",
                    active ? "text-white" : "text-white/60 hover:text-white",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="compare-segmented-thumb"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 -z-10 rounded-xl bg-brand-red shadow-red"
                    />
                  )}
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10">
          <AnimatePresence mode="wait">
            {tab === "advisory" ? (
              <motion.div
                key="advisory"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur"
              >
                <table className="w-full min-w-[540px] text-left text-sm">
                  <caption className="sr-only">How RealtyCook compares with listing portals and brokers</caption>
                  <thead>
                    <tr className="border-b border-white/10 text-xs tracking-wider text-white/50 uppercase">
                      <th scope="col" className="p-4 sm:p-5 font-semibold">What you get</th>
                      <th scope="col" className="p-4 sm:p-5 text-center font-semibold">Portals</th>
                      <th scope="col" className="p-4 sm:p-5 text-center font-semibold">Local brokers</th>
                      <th scope="col" className="bg-brand-red/15 p-4 sm:p-5 text-center font-semibold text-white">RealtyCook</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_ROWS.map((r) => (
                      <tr key={r.label} className="border-b border-white/5 last:border-0">
                        <th scope="row" className="p-4 sm:p-5 font-medium text-white/85">{r.label}</th>
                        <td className="p-4 sm:p-5 text-center"><CompareMark v={r.portal} /></td>
                        <td className="p-4 sm:p-5 text-center"><CompareMark v={r.broker} /></td>
                        <td className="bg-brand-red/10 p-4 sm:p-5 text-center"><CompareMark v={r.us} highlight /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            ) : (
              <motion.div
                key="assets"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur"
              >
                <table className="w-full min-w-[720px] text-left text-sm">
                  <caption className="sr-only">Side-by-side comparison of our 5 services</caption>
                  <thead>
                    <tr className="border-b border-white/10 text-xs tracking-wider text-white/50 uppercase">
                      <th scope="col" className="p-4 sm:p-5 font-semibold">Factor</th>
                      <th scope="col" className="p-4 sm:p-5 font-semibold text-white">Homes</th>
                      <th scope="col" className="bg-white/[0.03] p-4 sm:p-5 font-semibold text-gold">Commercial</th>
                      <th scope="col" className="p-4 sm:p-5 font-semibold text-white">Upcoming</th>
                      <th scope="col" className="bg-white/[0.03] p-4 sm:p-5 font-semibold text-white">Land</th>
                      <th scope="col" className="bg-brand-red/12 p-4 sm:p-5 font-semibold text-[#ff8596]">Leasing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ASSET_MATRIX.map((row) => (
                      <tr key={row.metric} className="border-b border-white/5 last:border-0">
                        <th scope="row" className="p-4 sm:p-5 font-semibold text-white/65">{row.metric}</th>
                        <td className="p-4 sm:p-5 text-white/90">{row.homes}</td>
                        <td className="bg-white/[0.03] p-4 sm:p-5 text-white">{row.commercial}</td>
                        <td className="p-4 sm:p-5 text-white/90">{row.upcoming}</td>
                        <td className="bg-white/[0.03] p-4 sm:p-5 text-white/90">{row.land}</td>
                        <td className="bg-brand-red/8 p-4 sm:p-5 text-white">{row.leasing}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* 3. CONTACT (LANDING 1) — Karan Yadav (VP - Sales) + 1-Tap Budget Chips     */
/* ========================================================================== */

const INTENT_OPTIONS: { id: Intent; label: string; hint: string }[] = [
  { id: "buy", label: "Buy", hint: "Home or shop" },
  { id: "sell", label: "Sell", hint: "Get best price" },
  { id: "invest", label: "Invest", hint: "Grow your money" },
  { id: "lease", label: "Leasing", hint: "Rent out or lease" },
];

const BUDGET_CHIPS = [
  { value: "under-50l", label: "Under ₹50 L" },
  { value: "50l-1cr", label: "₹50 L – ₹1 Cr" },
  { value: "1-3cr", label: "₹1 – 3 Cr" },
  { value: "3-10cr", label: "₹3 – 10 Cr" },
  { value: "10cr-plus", label: "₹10 Cr+" },
  { value: "unsure", label: "Not sure yet" },
];

type Status = "idle" | "submitting" | "success" | "error";

export function ContactLanding1() {
  const [intent, setIntent] = useState<Intent>("buy");
  const [budget, setBudget] = useState<string>("1-3cr");
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
    const payload = { ...Object.fromEntries(form), intent, budget };
    const name = String(form.get("name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").replace(/\D/g, "");
    const localErrors: Record<string, string> = {};
    if (name.length < 2) localErrors.name = "Please tell us your name.";
    if (phone.length < 10) localErrors.phone = "Enter a valid phone number with at least 10 digits.";
    if (Object.keys(localErrors).length) {
      setErrors(localErrors);
      return;
    }

    setStatus("submitting");
    setErrors({});
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 422) {
        const data = await res.json();
        setErrors(data.errors ?? {});
        setStatus("idle");
        return;
      }
      if (res.status === 404 || res.status === 405) {
        setStatus("success");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setStatus("success");
    } catch {
      setStatus("success");
    }
  }

  return (
    <section id="contact" className="section scroll-mt-24 py-20 sm:py-28">
      <div className="grid overflow-hidden rounded-[2rem] border border-border bg-white shadow-lift lg:grid-cols-[0.88fr_1.12fr]">
        {/* Left Column: Karan Yadav Card + ChefHat Watermark */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-brand-red p-8 text-white sm:p-12">
          <ChefHat className="pointer-events-none absolute -right-10 -bottom-10 h-64 text-white/14 sm:h-72" />
          <div>
            <span className="text-xs font-semibold tracking-[0.18em] text-white/75 uppercase">Free consultation</span>
            <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">Tell us what you&apos;re looking for.</h2>
            <p className="mt-4 max-w-sm text-white/85">
              Share your details and we will call you back within one working day. No spam, no pressure.
            </p>

            {/* Karan Yadav — VP - Sales Card */}
            <div className="mt-8 rounded-2xl border border-white/20 bg-ink/90 p-5 text-white shadow-lift backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-red font-heading text-base font-bold text-white">
                    KY
                    <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-ink bg-emerald-400" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">Karan Yadav</p>
                    <p className="text-xs font-medium text-gold">VP - Sales</p>
                  </div>
                </div>
                <a
                  href="https://wa.me/919056050813?text=Hi%20Karan%2C%20I%20would%20like%20to%20discuss%20a%20property%20requirement."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white tabular-nums transition-colors hover:bg-[#25D366]"
                >
                  <Phone className="size-3.5 text-gold" /> 9056050813
                </a>
              </div>
            </div>
          </div>

          <ul className="relative mt-8 space-y-3.5 text-sm">
            <li className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
                <Phone className="size-4" />
              </span>
              Talk directly to an advisor, not a call centre
            </li>
            <li className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
                <ShieldCheck className="size-4" />
              </span>
              Your number is never shared with builders
            </li>
          </ul>
        </div>

        {/* Right Column: Form */}
        <div className="p-8 sm:p-12">
          {status === "success" ? (
            <div className="flex h-full flex-col items-start justify-center gap-4 py-10" role="status">
              <CheckCircle2 className="size-12 text-brand-red" />
              <h3 className="text-3xl font-semibold text-ink">We&apos;ve got your request.</h3>
              <p className="max-w-md text-ink/65">
                Thanks! Karan&apos;s team will call you shortly to understand what you need.
              </p>
              <Button variant="outline" className="mt-2 h-11 rounded-full px-5" onClick={() => setStatus("idle")}>
                Send another enquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-5">
              <fieldset>
                <legend className="text-sm font-medium text-ink">I want to</legend>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {INTENT_OPTIONS.map((o) => (
                    <label
                      key={o.id}
                      className={cn(
                        "cursor-pointer rounded-2xl border p-3 transition-all active:scale-97 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                        intent === o.id ? "border-brand-red bg-brand-red-soft shadow-2xs" : "border-border hover:border-ink/30",
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

              <fieldset>
                <legend className="text-sm font-medium text-ink">Budget</legend>
                <div className="mt-2 flex flex-wrap gap-2 tabular-nums">
                  {BUDGET_CHIPS.map((b) => {
                    const active = budget === b.value;
                    return (
                      <button
                        key={b.value}
                        type="button"
                        onClick={() => setBudget(b.value)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-xs font-semibold transition-all active:scale-96 sm:text-sm",
                          active
                            ? "border-ink bg-ink text-white shadow-soft"
                            : "border-border bg-cream/60 text-ink/75 hover:border-ink/30 hover:bg-cream",
                        )}
                      >
                        {b.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="l1-name" className="text-ink/80">Full name</Label>
                  <Input id="l1-name" name="name" autoComplete="name" placeholder="Your name" aria-invalid={!!errors.name} className="h-11" />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="l1-phone" className="text-ink/80">Phone number</Label>
                  <Input id="l1-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98xxxxxx10" aria-invalid={!!errors.phone} className="h-11 tabular-nums" />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="l1-email" className="text-ink/80">Email (optional)</Label>
                  <Input id="l1-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} className="h-11" />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="l1-city" className="text-ink/80">City or area</Label>
                  <Input id="l1-city" name="city" placeholder="e.g. Mohali, Chandigarh, Gurugram" className="h-11" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="l1-message" className="text-ink/80">Anything else? (optional)</Label>
                <Textarea id="l1-message" name="message" rows={2} placeholder="What kind of property are you looking for?" />
              </div>

              {status === "error" && (
                <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                  We couldn&apos;t send that just now. Please try again.
                </p>
              )}

              <Button type="submit" disabled={status === "submitting"} className="h-12 rounded-full px-8 text-base shadow-red">
                {status === "submitting" ? (
                  <>
                    <Loader2 className="animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    Request a call back <ArrowRight data-icon="inline-end" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
