"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, FileSignature, TrendingUp, UserRound } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { chooseIntent, type Intent } from "./intent";

const HeroBannerScene = dynamic(() => import("@/components/three/hero-banner-scene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-cream-2/60">
      <div className="size-9 animate-spin rounded-full border-2 border-ink/15 border-t-brand-red" />
    </div>
  ),
});

const WEALTH_DECK_DATA = [
  {
    id: "homes",
    title: "Luxury Residences & Kothis",
    tag: "End-Use & Legacy",
    intent: "buy" as Intent,
    cagr: "11.4% – 14.2%",
    horizon: "5 – 10 Yrs",
    liquidity: "High (End-User Pool)",
    steps: [
      {
        num: "01",
        label: "Mandate",
        verdict: "Budget, preferred sector & configuration (tower, builder floor or kothi) locked in a 30-min call.",
      },
      {
        num: "02",
        label: "Site Audit",
        verdict: "Walked in person for carpet truth, natural light, OC status & society maintenance health.",
      },
      {
        num: "03",
        label: "Negotiation",
        verdict: "Price benchmarked against the last 6 months of registered sub-registrar deeds in the sector.",
      },
      {
        num: "04",
        label: "Registration",
        verdict: "Home-loan sanction, sale deed drafting, stamp duty & possession handover managed end-to-end.",
      },
    ],
  },
  {
    id: "commercial",
    title: "Commercial Showrooms & Retail",
    tag: "High-Street & Flagship",
    intent: "invest" as Intent,
    cagr: "13.5% – 17.8%",
    horizon: "5 – 8 Yrs",
    liquidity: "High (Prime Frontage)",
    steps: [
      {
        num: "01",
        label: "Mandate",
        verdict: "Target catchment, main-road frontage width & capital bracket defined upfront.",
      },
      {
        num: "02",
        label: "Site Audit",
        verdict: "Vetted on site for signage visibility, approach road turning radius, parking & fire NOC.",
      },
      {
        num: "03",
        label: "Negotiation",
        verdict: "Commercial title chain, permitted trade use & deal terms structured directly with the owner.",
      },
      {
        num: "04",
        label: "Registration",
        verdict: "Conveyance deed execution, commercial mutation & possession checklist completed.",
      },
    ],
  },
  {
    id: "upcoming",
    title: "RERA Under-Construction Launches",
    tag: "Stage-Gate Alpha",
    intent: "invest" as Intent,
    cagr: "16.5% – 21.0%",
    horizon: "3 – 4 Yrs to Keys",
    liquidity: "Peaks at Structure/OC",
    steps: [
      {
        num: "01",
        label: "Mandate",
        verdict: "Entry stage, construction-linked cashflow schedule & possession horizon aligned.",
      },
      {
        num: "02",
        label: "Site Audit",
        verdict: "RERA escrow filings, sanction plans & builder's last 3 delivered projects audited on the ground.",
      },
      {
        num: "03",
        label: "Negotiation",
        verdict: "Inaugural allotment pricing, floor-rise waiver & milestone-linked payment protection locked.",
      },
      {
        num: "04",
        label: "Registration",
        verdict: "Builder-buyer agreement vetted, on-site slab progress tracked & final OC handover.",
      },
    ],
  },
  {
    id: "land",
    title: "Approved Plotted & Corridor Land",
    tag: "Generational Compounding",
    intent: "invest" as Intent,
    cagr: "18.0% – 24.5%",
    horizon: "4 – 8 Yrs",
    liquidity: "High in Plotted Sectors",
    steps: [
      {
        num: "01",
        label: "Mandate",
        verdict: "Plot size, permitted FAR & growth-corridor holding horizon calibrated to your capital.",
      },
      {
        num: "02",
        label: "Site Audit",
        verdict: "Demarcated boundary pillars, 30m sector road approach & master-plan zoning walked with survey map.",
      },
      {
        num: "03",
        label: "Negotiation",
        verdict: "Revenue records, zero-encumbrance title chain & payment schedule verified and locked.",
      },
      {
        num: "04",
        label: "Registration",
        verdict: "Sub-registrar conveyance, physical possession demarcation & annual exit-timing reviews.",
      },
    ],
  },
  {
    id: "leasing",
    title: "Corporate, Retail & Home Leasing",
    tag: "Verified Tenants & Lock-In",
    intent: "lease" as Intent,
    cagr: "6.5% – 9.0% Yield",
    horizon: "3 – 9 Yr Lease",
    liquidity: " steady Monthly Cashflow",
    steps: [
      {
        num: "01",
        label: "Mandate",
        verdict: "Rent expectations, tenant profile, fit-out requirements & lock-in horizon agreed upfront.",
      },
      {
        num: "02",
        label: "Site Audit",
        verdict: "Property readiness, signage visibility, power load, parking & OC compliance verified on site.",
      },
      {
        num: "03",
        label: "Negotiation",
        verdict: "LOI terms, security deposit, rent-free fit-out period & 15% escalation clauses structured.",
      },
      {
        num: "04",
        label: "Registration",
        verdict: "Tenant KYC, registered lease deed execution & documented possession handover completed.",
      },
    ],
  },
];

const STEP_DURATION_MS = 4200;

export function Hero() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const current = WEALTH_DECK_DATA[selectedIdx];
  const currentStep = current.steps[activeStepIdx] ?? current.steps[0];

  // Auto-advance through 01 Mandate -> 02 Site Audit -> 03 Negotiation -> 04 Registration
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActiveStepIdx((prev) => (prev + 1) % 4);
    }, STEP_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [paused, selectedIdx]);

  return (
    <section id="top" className="relative isolate overflow-hidden bg-cream pt-[72px] pb-16 lg:pb-24">
      <div className="grain pointer-events-none absolute inset-0 -z-10 opacity-60" />
      <div className="pointer-events-none absolute -top-48 right-[-8%] -z-10 size-[720px] rounded-full bg-[radial-gradient(circle,rgb(200_16_46/0.11),transparent_65%)]" />

      <div className="section pt-10 lg:pt-14">
        {/* Main Command Deck Grid */}
        <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
          {/* Left: High-Contrast Editorial Advisory Pitch */}
          <div>
            <span className="eyebrow">Real estate advisory · Buy · Sell · Invest · Lease</span>
            <h1 className="mt-5 text-[2.6rem] leading-[1.03] font-semibold text-ink sm:text-6xl lg:text-[4.05rem]">
              Every property deal needs a <span className="text-brand-red">good recipe.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">
              Whether you are buying a family kothi or apartment, investing in a main-road showroom or plotted land
              parcel, or leasing out a commercial or residential asset, one advisor handles verification, negotiation
              and registration start to finish.
            </p>

            {/* 5-Selector Pills for the Command Matrix */}
            <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {WEALTH_DECK_DATA.map((item, idx) => {
                const active = idx === selectedIdx;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedIdx(idx);
                      setActiveStepIdx(0);
                    }}
                    className={cn(
                      "rounded-2xl border p-3.5 text-left transition-all active:scale-97",
                      active
                        ? "border-brand-red bg-ink text-white shadow-lift"
                        : "border-border bg-white/85 text-ink/75 shadow-2xs hover:border-ink/30 hover:bg-white hover:text-ink",
                    )}
                  >
                    <p className={cn("font-mono text-[10px] font-bold", active ? "text-gold" : "text-brand-red")}>
                      0{idx + 1}
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-snug">{item.title}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => chooseIntent(current.intent)}
                className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-full px-7 text-base shadow-red")}
              >
                Book a free consultation <ArrowRight data-icon="inline-end" />
              </button>
              <a
                href="#modes"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 rounded-full bg-white/80 px-6 text-base",
                )}
              >
                Explore what we deal in
              </a>
            </div>

            <ul className="mt-10 grid max-w-xl grid-cols-1 gap-4 border-t border-border/80 pt-7 text-sm text-ink/75 sm:grid-cols-3">
              {[
                { icon: BadgeCheck, label: "Walked & checked before you visit" },
                { icon: UserRound, label: "One advisor, start to finish" },
                { icon: FileSignature, label: "Fees agreed in writing, upfront" },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 size-4 shrink-0 text-brand-red" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Light-Theme Interactive 3D Isometric Command Card */}
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="overflow-hidden rounded-[2rem] border border-border bg-white p-6 shadow-lift sm:p-7"
          >
            {/* Card Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <span className="text-xs font-semibold tracking-wider text-brand-red uppercase">{current.tag}</span>
                <h2 className="mt-0.5 text-xl font-semibold text-ink sm:text-2xl">{current.title}</h2>
              </div>
              <span className="rounded-full border border-emerald-600/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-800">
                ✓ Verified Desk Active
              </span>
            </div>

            {/* 3 Quantitative Pillars */}
            <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl border border-border/80 bg-cream/70 p-3.5 tabular-nums">
              <div>
                <p className="text-[11px] font-medium text-ink/50">Return / Yield</p>
                <p className="mt-0.5 text-sm font-bold text-brand-red sm:text-base">{current.cagr}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-ink/50">Ideal Holding Horizon</p>
                <p className="mt-0.5 text-sm font-bold text-ink sm:text-base">{current.horizon}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-ink/50">Exit Liquidity</p>
                <p className="mt-0.5 text-sm font-bold text-ink sm:text-base">{current.liquidity}</p>
              </div>
            </div>

            {/* Live 3D Isometric WebGL Architectural Viewport + Animated Step Verdict Banner */}
            <div className="relative mt-4 h-[260px] w-full overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-[#f3efe7] via-[#eae3d6] to-[#dfd7c8] sm:h-[290px]">
              <HeroBannerScene activeId={current.id} />

              {/* Animated Step Verdict Overlay */}
              <div className="pointer-events-none absolute inset-x-3.5 bottom-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${current.id}-${currentStep.num}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                    className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-white/95 px-3.5 py-2.5 text-xs shadow-soft backdrop-blur"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-brand-red font-mono text-[10px] font-bold text-white">
                      {currentStep.num}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-ink">{currentStep.label}: </span>
                      <span className="text-ink/80">{currentStep.verdict}</span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Interactive 4-Step Deal Recipe Selector Pills (Clickable + Auto-Cycling Progress) */}
            <div
              role="tablist"
              aria-label="Deal recipe stages"
              className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {current.steps.map((step, idx) => {
                const isActive = idx === activeStepIdx;
                return (
                  <button
                    key={step.num}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveStepIdx(idx)}
                    className={cn(
                      "relative flex items-center justify-center gap-1.5 overflow-hidden rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all active:scale-97",
                      isActive
                        ? "border-brand-red bg-brand-red text-white shadow-red"
                        : "border-border bg-cream/60 text-ink/70 hover:border-ink/30 hover:bg-cream hover:text-ink",
                    )}
                  >
                    <span className={cn("font-mono text-[10px]", isActive ? "text-white/85" : "text-brand-red")}>
                      {step.num}
                    </span>
                    <span className="truncate">{step.label}</span>

                    {isActive && !paused && (
                      <motion.span
                        key={`${current.id}-${activeStepIdx}-bar`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: STEP_DURATION_MS / 1000, ease: "linear" }}
                        className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-white/80"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
