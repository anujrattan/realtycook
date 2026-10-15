"use client";

import { ArrowRight, BadgeCheck, FileSignature, TrendingUp, UserRound } from "lucide-react";
import dynamic from "next/dynamic";
import { Monogram } from "@/components/brand/logo";
import { CanvasShell, useReducedMotion } from "@/components/three/canvas-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { chooseIntent, type Intent } from "./intent";

const HeroScene = dynamic(() => import("@/components/three/hero-scene"), {
  ssr: false,
  loading: () => <SceneLoading />,
});

function SceneLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center" role="status" aria-label="Loading 3D city">
      <div className="size-56 animate-pulse rounded-full bg-gradient-to-b from-white to-cream-2 shadow-lift" />
    </div>
  );
}

function SceneFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex size-72 items-center justify-center rounded-full bg-white shadow-lift">
        <Monogram className="size-40 text-ink" />
      </div>
    </div>
  );
}

const INTENTS: { id: Intent; label: string }[] = [
  { id: "buy", label: "Buy" },
  { id: "sell", label: "Sell" },
  { id: "invest", label: "Invest" },
  { id: "rent", label: "Rent / Lease" },
];

export function Hero() {
  const reducedMotion = useReducedMotion();

  return (
    <section id="top" className="relative isolate overflow-hidden pt-[72px]">
      <div className="grain pointer-events-none absolute inset-0 -z-10 opacity-60" />
      <div className="pointer-events-none absolute -top-40 right-[-10%] -z-10 size-[720px] rounded-full bg-[radial-gradient(circle,rgb(200_16_46/0.12),transparent_65%)]" />

      <div className="section grid items-center gap-6 pb-12 lg:min-h-[calc(100svh-72px)] lg:grid-cols-[1.02fr_1fr] lg:gap-4 lg:pb-0">
        <div className="relative z-10 pt-10 lg:pt-0">
          <span className="eyebrow">Real estate · Buy · Sell · Invest</span>
          <h1 className="mt-5 text-[2.6rem] leading-[1.04] font-semibold text-ink sm:text-6xl lg:text-[4.1rem]">
            Every property deal needs a <span className="text-brand-red">good recipe.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">
            RealtyCook brings buying, selling and investing under one roof: homes, pre-leased commercial, plots and
            fractional ownership. One advisor handles verification, negotiation and paperwork, from the first site visit
            to registration.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-white/80 p-2 shadow-soft backdrop-blur sm:inline-flex sm:items-center sm:gap-2">
            <span className="block px-3 pt-1 pb-2 text-sm font-medium text-ink/60 sm:pb-1">I want to</span>
            <div className="grid grid-cols-2 gap-1.5 sm:flex">
              {INTENTS.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => chooseIntent(i.id)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:bg-brand-red hover:text-white hover:shadow-red focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {i.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href="#contact" className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-full px-6 text-base shadow-red")}>
              Book a free consultation <ArrowRight data-icon="inline-end" />
            </a>
            <a
              href="#calculator"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 rounded-full bg-white/70 px-6 text-base")}
            >
              Estimate returns
            </a>
          </div>

          <ul className="mt-10 grid max-w-xl grid-cols-1 gap-4 text-sm text-ink/70 sm:grid-cols-3">
            {[
              { icon: BadgeCheck, label: "RERA & title verified before you visit" },
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

        <div className="relative h-[380px] sm:h-[480px] lg:h-[min(760px,calc(100svh-72px))]">
          <CanvasShell
            className="absolute inset-0 lg:-right-24 lg:-left-10"
            fallback={<SceneFallback />}
            loading={<SceneLoading />}
          >
            <HeroScene reducedMotion={reducedMotion} />
          </CanvasShell>

          <div className="pointer-events-none absolute top-[10%] right-2 hidden sm:right-10 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-lift backdrop-blur sm:block">
            <p className="text-[11px] font-semibold tracking-wider text-ink/50 uppercase">Pre-leased office</p>
            <p className="mt-0.5 flex items-center gap-1.5 font-heading text-lg font-semibold text-ink">
              <TrendingUp className="size-4 text-gold" /> 7.8% rental yield
            </p>
          </div>
          <div className="pointer-events-none absolute right-2 bottom-[14%] rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-lift backdrop-blur sm:right-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="flex size-6 items-center justify-center rounded-full bg-brand-red text-white">
                <BadgeCheck className="size-3.5" />
              </span>
              Title chain verified
            </p>
            <p className="mt-0.5 pl-8 text-xs text-ink/55">3 BHK · Sector 65, Gurugram</p>
          </div>
          <p className="pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 text-xs text-ink/40 lg:block">
            Move your cursor to tilt the city
          </p>
        </div>
      </div>
    </section>
  );
}
