"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Check,
  Compass,
  FileSignature,
  Layers,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { MODES } from "@/lib/content";
import { cn } from "@/lib/utils";
import { chooseIntent, type Intent } from "./intent";

const HeroBannerScene = dynamic(() => import("@/components/three/hero-banner-scene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#181b22]">
      <div className="size-10 animate-spin rounded-full border-2 border-white/20 border-t-brand-red" />
    </div>
  ),
});

const INTENTS: { id: Intent; label: string; brief: string; defaultAsset: string }[] = [
  { id: "buy", label: "Buy", brief: "Homes, kothis & builder floors", defaultAsset: "homes" },
  { id: "sell", label: "Sell", brief: "Right price & genuine buyers", defaultAsset: "homes" },
  { id: "invest", label: "Invest", brief: "Shops, new launches & land", defaultAsset: "commercial" },
  { id: "lease", label: "Leasing", brief: "Shops, offices & homes on rent", defaultAsset: "leasing" },
];

const TAB_LABELS: Record<string, string> = {
  homes: "Homes",
  commercial: "Commercial",
  upcoming: "Upcoming",
  land: "Land",
  leasing: "Leasing",
};

type CalloutPin = {
  x: string;
  y: string;
  title: string;
};

type DossierSpec = {
  id: string;
  tag: string;
  headline: string;
  subline: string;
  pins: CalloutPin[];
  metrics: { label: string; value: string }[];
  checks: string[];
  stamp: string;
};

const DOSSIERS: DossierSpec[] = [
  {
    id: "homes",
    tag: "Flats · Builder floors · Kothis",
    headline: "Homes we visit in person before we show you.",
    subline: "We check the actual room sizes, sunlight and paperwork so you don't waste weekends.",
    pins: [
      { x: "22%", y: "24%", title: "Apartments" },
      { x: "66%", y: "62%", title: "Independent Kothis" },
      { x: "76%", y: "28%", title: "Builder Floors" },
    ],
    metrics: [
      { label: "Options", value: "Flats · Floors · Kothis" },
      { label: "Status", value: "Ready & resale" },
      { label: "Support", value: "Loan to registry" },
    ],
    checks: [
      "Clear papers & society dues checked",
      "Real usable area & sunlight verified",
      "Fair price checked against recent sales",
    ],
    stamp: "Visited & Verified",
  },
  {
    id: "commercial",
    tag: "Retail shops · Showrooms",
    headline: "Main-road shops & showrooms that get noticed.",
    subline: "Picked for good visibility, easy parking and steady footfall.",
    pins: [
      { x: "30%", y: "30%", title: "Showrooms" },
      { x: "72%", y: "38%", title: "Retail Shops" },
      { x: "52%", y: "74%", title: "Easy Parking" },
    ],
    metrics: [
      { label: "Options", value: "Shops · Showrooms" },
      { label: "Location", value: "Main road & market" },
      { label: "Support", value: "Selection to registry" },
    ],
    checks: [
      "Wide road approach & customer parking",
      "Commercial approval & clear title",
      "Right price checked in the market",
    ],
    stamp: "Location Checked",
  },
  {
    id: "upcoming",
    tag: "New launches · Under construction",
    headline: "New projects from builders who deliver on time.",
    subline: "We check RERA papers and the builder's past record before you book.",
    pins: [
      { x: "38%", y: "30%", title: "On-Time Work" },
      { x: "58%", y: "18%", title: "Trusted Builders" },
      { x: "74%", y: "52%", title: "RERA Approved" },
    ],
    metrics: [
      { label: "Stage", value: "New launch" },
      { label: "Safety", value: "RERA registered" },
      { label: "Payment", value: "Linked to work" },
    ],
    checks: [
      "RERA registration & approvals checked",
      "Builder's past delivery record verified",
      "Safe, construction-linked payment plan",
    ],
    stamp: "RERA Checked",
  },
  {
    id: "land",
    tag: "Residential & commercial plots",
    headline: "Approved plots with clear boundaries.",
    subline: "We walk the plot with the map to check roads, boundaries and approvals.",
    pins: [
      { x: "26%", y: "42%", title: "Marked Boundaries" },
      { x: "56%", y: "50%", title: "Corner Plots" },
      { x: "76%", y: "34%", title: "Approved Layout" },
    ],
    metrics: [
      { label: "Options", value: "Plots & land" },
      { label: "Check", value: "Walked on site" },
      { label: "Goal", value: "Build or hold" },
    ],
    checks: [
      "Approved layout & clear ownership",
      "Boundary pillars & road width checked",
      "Good growth area with easy resale",
    ],
    stamp: "Plot Verified",
  },
  {
    id: "leasing",
    tag: "Shops · Offices · Homes",
    headline: "Hassle-free renting for owners and tenants.",
    subline: "We find reliable tenants, agree fair rent terms and register the lease.",
    pins: [
      { x: "28%", y: "28%", title: "Office Spaces" },
      { x: "68%", y: "44%", title: "Retail Shops" },
      { x: "50%", y: "74%", title: "Registered Lease" },
    ],
    metrics: [
      { label: "Spaces", value: "Shops · Offices · Homes" },
      { label: "Tenants", value: "Background checked" },
      { label: "Paperwork", value: "Registered lease" },
    ],
    checks: [
      "Tenant background & ID verified",
      "Lock-in period & security deposit fixed",
      "Registered rent agreement & handover",
    ],
    stamp: "Tenant Verified",
  },
];

const CYCLE_MS = 6400;

export function HeroLanding1() {
  const [activeId, setActiveId] = useState<string>(DOSSIERS[0].id);
  const [selectedIntent, setSelectedIntent] = useState<Intent>("buy");
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const stripX = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setActiveId((prev) => {
        const idx = DOSSIERS.findIndex((d) => d.id === prev);
        return DOSSIERS[(idx + 1) % DOSSIERS.length].id;
      });
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const activeDossier = DOSSIERS.find((d) => d.id === activeId) ?? DOSSIERS[0];
  const activeMode = MODES.find((m) => m.id === activeId) ?? MODES[0];
  const ActiveIcon = activeMode.icon;

  return (
    <section ref={containerRef} id="top" className="relative isolate overflow-hidden pt-[72px]">
      <div className="grain pointer-events-none absolute inset-0 -z-10 opacity-60" />
      <div className="pointer-events-none absolute -top-48 right-[-8%] -z-10 size-[680px] rounded-full bg-[radial-gradient(circle,rgb(200_16_46/0.11),transparent_65%)]" />

      {/* Main Split Editorial Hero — Equal Height Left & Right Columns */}
      <div className="section pt-8 pb-14 lg:pt-10 lg:pb-16">
        <div className="grid items-stretch gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
          {/* Left Column */}
          <div className="relative z-10 flex h-full flex-col justify-between py-1">
            <div>
              <span className="eyebrow">Buy · Sell · Invest · Lease</span>
              <h1 className="mt-4 text-[2.55rem] leading-[1.03] font-semibold text-ink sm:text-6xl lg:text-[3.85rem]">
                Every property deal needs a <span className="text-brand-red">good recipe.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/70 sm:text-lg">
                Homes, shops, new projects, plots and leasing. One dedicated advisor checks the property, negotiates the
                best price and handles all paperwork till registry.
              </p>

              {/* Segmented Intent Selector */}
              <div className="mt-6 max-w-xl rounded-2xl border border-border bg-white/90 p-2.5 shadow-soft backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2">
                  <span className="text-xs font-semibold tracking-wider text-ink/50 uppercase">I want to</span>
                  <span className="text-xs font-medium text-brand-red">
                    {INTENTS.find((i) => i.id === selectedIntent)?.brief}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-cream p-1 sm:grid-cols-4">
                  {INTENTS.map((i) => {
                    const active = selectedIntent === i.id;
                    return (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => {
                          setSelectedIntent(i.id);
                          setActiveId(i.defaultAsset);
                        }}
                        className={cn(
                          "relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
                          active ? "text-white" : "text-ink/70 hover:text-ink",
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="l1-hero-intent-pill"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="absolute inset-0 rounded-lg bg-ink shadow-2xs"
                          />
                        )}
                        <span className="relative z-10">{i.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => chooseIntent(selectedIntent)}
                  className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-full px-6 text-base shadow-red")}
                >
                  Book a free call <ArrowRight data-icon="inline-end" />
                </button>
                <a
                  href="#modes"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-12 rounded-full bg-white/80 px-6 text-base",
                  )}
                >
                  See what we do
                </a>
              </div>
            </div>

            <ul className="mt-8 grid max-w-xl grid-cols-1 gap-4 border-t border-border/80 pt-6 text-sm text-ink/75 sm:grid-cols-3">
              {[
                { icon: BadgeCheck, label: "Checked on site first" },
                { icon: UserRound, label: "One advisor throughout" },
                { icon: FileSignature, label: "Clear fees upfront" },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 size-4 shrink-0 text-brand-red" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Single-Row Non-Wrapping Tabs + Equal-Height Showcase Card */}
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="relative flex h-full flex-col"
          >
            {/* Category Switcher Tabs — Single Non-Wrapping Row of 5 */}
            <div
              role="tablist"
              aria-label="Property categories"
              className="grid grid-cols-5 gap-1 rounded-2xl border border-border bg-white/95 p-1.5 shadow-soft backdrop-blur"
            >
              {MODES.map((m) => {
                const Icon = m.icon;
                const selected = m.id === activeId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveId(m.id)}
                    className={cn(
                      "relative flex items-center justify-center gap-1.5 overflow-hidden rounded-xl px-2 py-2.5 text-xs font-semibold whitespace-nowrap transition-all",
                      selected ? "bg-ink text-white shadow-soft" : "text-ink/65 hover:bg-cream-2/70 hover:text-ink",
                    )}
                  >
                    <Icon className={cn("size-3.5 shrink-0", selected ? "text-brand-red" : "text-ink/45")} />
                    <span className="truncate">{TAB_LABELS[m.id] ?? m.title}</span>
                    {selected && !paused && (
                      <motion.span
                        key={`${activeId}-progress`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: CYCLE_MS / 1000, ease: "linear" }}
                        className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-brand-red"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Main Showcase Card */}
            <div className="mt-2.5 flex flex-1 flex-col justify-between overflow-hidden rounded-[1.85rem] border border-ink/15 bg-ink text-white shadow-lift">
              {/* Top Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-brand-red text-white">
                    <ActiveIcon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{activeMode.title}</p>
                    <p className="text-xs font-medium text-gold">{activeDossier.tag}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/85">
                  <ShieldCheck className="size-3.5 text-brand-red" />
                  {activeDossier.stamp}
                </span>
              </div>

              {/* Isometric 3D Architectural Viewport + Callout Pins */}
              <div className="relative h-[225px] w-full overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#151821] via-[#1e2330] to-[#262220] sm:h-[245px]">
                <div className="pointer-events-none absolute inset-x-0 bottom-8 h-24 bg-[radial-gradient(ellipse_at_center,rgba(255,190,110,0.18),transparent_70%)]" />

                <HeroBannerScene activeId={activeDossier.id} />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeDossier.id}-scan`}
                    initial={{ x: "-100%", opacity: 0.8 }}
                    animate={{ x: "200%", opacity: 0 }}
                    transition={{ duration: 1.25, ease: "easeInOut" }}
                    className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-brand-red/20 to-transparent"
                  />
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeDossier.id}-pins`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="pointer-events-none absolute inset-0"
                  >
                    {activeDossier.pins.map((pin, idx) => (
                      <motion.div
                        key={pin.title}
                        style={{ left: pin.x, top: pin.y }}
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.2 + idx * 0.14, duration: 0.35, ease: "easeOut" }}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                      >
                        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-ink/85 px-2.5 py-1 shadow-soft backdrop-blur-md">
                          <span className="relative flex size-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-red opacity-75" />
                            <span className="relative inline-flex size-2 rounded-full bg-brand-red" />
                          </span>
                          <p className="text-[11px] font-semibold whitespace-nowrap text-white">{pin.title}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Dossier Details — Short & Simple */}
              <div className="p-5 sm:p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeDossier.id}-copy`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <h2 className="text-lg font-semibold text-white sm:text-xl">{activeDossier.headline}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-white/65 sm:text-sm">{activeDossier.subline}</p>

                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      {activeDossier.metrics.map((m) => (
                        <div key={m.label}>
                          <p className="text-[10px] font-medium tracking-wider text-white/45 uppercase">{m.label}</p>
                          <p className="mt-0.5 text-xs font-semibold text-white">{m.value}</p>
                        </div>
                      ))}
                    </div>

                    <ul className="mt-4 space-y-1.5 text-xs text-white/85">
                      {activeDossier.checks.map((c, idx) => (
                        <motion.li
                          key={c}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.06 + idx * 0.05, duration: 0.2 }}
                          className="flex items-center gap-2"
                        >
                          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-red/20 text-brand-red">
                            <Check className="size-3" />
                          </span>
                          <span>{c}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Scroll Strip */}
      <div className="overflow-hidden border-y border-border bg-cream-2/75 py-4">
        <motion.div style={{ x: stripX }} className="flex w-max items-center gap-6 px-6">
          {[
            { icon: Compass, title: "Site Visited First", detail: "We check roads, area & surroundings in person" },
            { icon: Building2, title: "Papers & RERA Checked", detail: "Ownership & approvals verified before you visit" },
            { icon: Layers, title: "Right Price Check", detail: "Compared with real recent sales, not portal rates" },
            { icon: MapPin, title: "Full Paperwork", detail: "Loan, agreement & registry handled end to end" },
            { icon: Sparkles, title: "Leasing & Care", detail: "Finding tenants, rent agreements & resale help" },
          ].map(({ icon: Icon, title, detail }) => (
            <div
              key={title}
              className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-2.5 shadow-soft"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-red-soft text-brand-red">
                <Icon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="text-xs text-ink/60">{detail}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
