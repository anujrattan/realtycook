"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, Compass, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { chooseIntent, type Intent } from "./intent";

/**
 * Animated Isometric Architectural Scene for each of the 5 Service Pillars.
 * Lives in its own dedicated right-hand column inside the expanded accordion card
 * so it never overlaps the text on the left.
 */
function AnimatedArchitecturalScene({ id }: { id: string }) {
  const stroke = "rgba(255,255,255,0.38)";
  const fill = "rgba(255,255,255,0.06)";
  const fillSide = "rgba(255,255,255,0.11)";
  const grid = "rgba(255,255,255,0.08)";

  if (id === "homes") {
    return (
      <svg viewBox="0 0 420 300" className="h-full w-full" fill="none" aria-hidden="true">
        {/* Isometric ground base */}
        <path d="M 24 228 L 210 132 L 396 228 L 210 286 Z" fill={fill} stroke={grid} strokeWidth="1.2" />
        <path d="M 75 202 L 260 260 M 140 168 L 325 228" stroke={grid} strokeDasharray="4 4" />

        {/* 01. High-Rise Point Tower (Left) — animated float */}
        <motion.g
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: [0, -4, 0] }}
          transition={{
            opacity: { duration: 0.4 },
            y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <path d="M 58 46 L 112 20 L 166 46 L 112 72 Z" fill="rgba(200,16,46,0.32)" stroke="#c8102e" strokeWidth="1.6" />
          <path d="M 58 46 L 58 206 L 112 232 L 112 72 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M 166 46 L 166 206 L 112 232 L 112 72 Z" fill={fillSide} stroke={stroke} strokeWidth="1.5" />
          {[72, 98, 124, 150, 176].map((y, idx) => (
            <g key={y}>
              <path d={`M 58 ${y} L 112 ${y + 26} L 166 ${y}`} stroke={stroke} strokeWidth="1.1" />
              {idx % 2 === 0 && (
                <motion.path
                  d={`M 120 ${y + 18} L 156 ${y + 1} L 156 ${y + 14} L 120 ${y + 31} Z`}
                  fill="#c9952b"
                  animate={{ fillOpacity: [0.25, 0.7, 0.25] }}
                  transition={{ duration: 2.8, delay: idx * 0.3, repeat: Infinity }}
                />
              )}
            </g>
          ))}
        </motion.g>

        {/* 02. Independent Courtyard Kothi (Center-Front) */}
        <motion.g
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: [0, -3, 0] }}
          transition={{
            opacity: { duration: 0.45, delay: 0.1 },
            y: { duration: 4, delay: 0.5, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <path d="M 156 154 L 224 120 L 292 154 L 224 188 Z" fill="rgba(201,149,43,0.22)" stroke="#c9952b" strokeWidth="1.6" />
          <path d="M 156 154 L 156 220 L 224 254 L 224 188 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M 292 154 L 292 220 L 224 254 L 224 188 Z" fill={fillSide} stroke={stroke} strokeWidth="1.5" />
          <path d="M 174 132 L 224 108 L 274 132 L 224 156 Z" fill="#c8102e" fillOpacity="0.92" />
        </motion.g>

        {/* 03. Low-Rise Builder Floors (Right) */}
        <motion.g
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: [0, -3.5, 0] }}
          transition={{
            opacity: { duration: 0.45, delay: 0.18 },
            y: { duration: 4.2, delay: 0.9, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <path d="M 274 96 L 330 68 L 386 96 L 330 124 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M 274 96 L 274 192 L 330 220 L 330 124 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M 386 96 L 386 192 L 330 220 L 330 124 Z" fill={fillSide} stroke={stroke} strokeWidth="1.5" />
          {[120, 144, 168].map((y) => (
            <path key={y} d={`M 270 ${y} L 330 ${y + 28} L 390 ${y}`} stroke="#c9952b" strokeWidth="1.5" />
          ))}
        </motion.g>
      </svg>
    );
  }

  if (id === "commercial") {
    return (
      <svg viewBox="0 0 420 300" className="h-full w-full" fill="none" aria-hidden="true">
        <path d="M 24 228 L 210 132 L 396 228 L 210 286 Z" fill={fill} stroke={grid} strokeWidth="1.2" />
        <motion.g
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [0, -4, 0] }}
          transition={{
            opacity: { duration: 0.4 },
            y: { duration: 4.4, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          {/* Flagship Double-Height Glazed Showroom */}
          <path d="M 64 68 L 194 12 L 324 68 L 194 126 Z" fill={fill} stroke={stroke} strokeWidth="1.6" />
          <path d="M 64 68 L 64 202 L 194 260 L 194 126 Z" fill={fill} stroke={stroke} strokeWidth="1.6" />
          <path d="M 324 68 L 324 202 L 194 260 L 194 126 Z" fill="rgba(201,149,43,0.16)" stroke="#c9952b" strokeWidth="1.6" />
          {/* Signature Red Vertical Blade */}
          <path d="M 64 58 L 90 46 L 90 214 L 64 202 Z" fill="#c8102e" />
          {/* Curtain-wall mullions */}
          {[222, 250, 278, 306].map((x, idx) => (
            <line key={x} x1={x} y1={112 - idx * 12} x2={x} y2={246 - idx * 12} stroke={stroke} strokeWidth="1.2" />
          ))}
          {/* Pulsing Showroom Display Atrium */}
          <motion.path
            d="M 204 176 L 314 128 L 314 188 L 204 236 Z"
            fill="#c9952b"
            animate={{ fillOpacity: [0.15, 0.45, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Cantilevered Entrance Canopy */}
          <path d="M 194 194 L 332 132 L 352 144 L 214 206 Z" fill="#c8102e" />
        </motion.g>
      </svg>
    );
  }

  if (id === "upcoming") {
    return (
      <svg viewBox="0 0 420 300" className="h-full w-full" fill="none" aria-hidden="true">
        <path d="M 24 228 L 210 132 L 396 228 L 210 286 Z" fill={fill} stroke={grid} strokeWidth="1.2" />
        {/* Stepped Post-Tensioned Floor Slabs */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const y = 210 - i * 20;
          return (
            <motion.path
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              d={`M 98 ${y} L 202 ${y - 42} L 306 ${y} L 202 ${y + 42} Z`}
              fill={i < 2 ? "rgba(201,149,43,0.2)" : fill}
              stroke={i === 6 ? "#c8102e" : stroke}
              strokeWidth="1.5"
            />
          );
        })}
        {/* Central Slip-Form Core */}
        <path d="M 178 44 L 202 32 L 226 44 L 226 224 L 202 236 L 178 224 Z" fill="rgba(200,16,46,0.25)" stroke="#c8102e" strokeWidth="1.6" />
        {/* Tower Crane Mast */}
        <line x1="330" y1="24" x2="330" y2="226" stroke="#c9952b" strokeWidth="4" />
        {/* Animated Slewing Crane Jib & Hoist Load */}
        <motion.g
          animate={{ x: [-6, 6, -6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <line x1="142" y1="38" x2="380" y2="38" stroke="#c9952b" strokeWidth="3" />
          <rect x="350" y="40" width="26" height="14" fill="#c8102e" />
          <motion.line
            x1="188"
            y1="38"
            x2="188"
            y2="94"
            stroke={stroke}
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
          <motion.rect
            x="170"
            y="92"
            width="36"
            height="14"
            fill="#c9952b"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.g>
      </svg>
    );
  }

  if (id === "leasing") {
    return (
      <svg viewBox="0 0 420 300" className="h-full w-full" fill="none" aria-hidden="true">
        <path d="M 24 228 L 210 132 L 396 228 L 210 286 Z" fill={fill} stroke={grid} strokeWidth="1.2" />
        {/* Corporate Leased Tower (Left) */}
        <motion.g
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [0, -4, 0] }}
          transition={{
            opacity: { duration: 0.4 },
            y: { duration: 4.3, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <path d="M 62 48 L 128 18 L 194 48 L 128 78 Z" fill="rgba(201,149,43,0.25)" stroke="#c9952b" strokeWidth="1.6" />
          <path d="M 62 48 L 62 208 L 128 238 L 128 78 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M 194 48 L 194 208 L 128 238 L 128 78 Z" fill={fillSide} stroke={stroke} strokeWidth="1.5" />
          {[78, 108, 138, 168].map((y) => (
            <path key={y} d={`M 62 ${y} L 128 ${y + 30} L 194 ${y}`} stroke={stroke} strokeWidth="1.1" />
          ))}
        </motion.g>

        {/* High-Street Retail Anchor Wing (Right) */}
        <motion.g
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: [0, -3, 0] }}
          transition={{
            opacity: { duration: 0.45, delay: 0.12 },
            y: { duration: 3.8, delay: 0.5, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <path d="M 212 108 L 296 70 L 380 108 L 296 146 Z" fill={fill} stroke={stroke} strokeWidth="1.6" />
          <path d="M 212 108 L 212 212 L 296 250 L 296 146 Z" fill={fill} stroke={stroke} strokeWidth="1.6" />
          <path d="M 380 108 L 380 212 L 296 250 L 296 146 Z" fill="rgba(200,16,46,0.22)" stroke="#c8102e" strokeWidth="1.6" />
          <path d="M 296 190 L 384 150 L 398 160 L 310 200 Z" fill="#c9952b" />
          <motion.circle
            cx="296"
            cy="110"
            r="7"
            fill="#c8102e"
            animate={{ scale: [1, 1.35, 1] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          />
        </motion.g>
      </svg>
    );
  }

  // Land parcels masterplan
  return (
    <svg viewBox="0 0 420 300" className="h-full w-full" fill="none" aria-hidden="true">
      <path d="M 28 166 L 210 68 L 392 166 L 210 264 Z" fill={fill} stroke={stroke} strokeWidth="1.8" strokeDasharray="8 5" />
      <path d="M 78 190 L 260 92 L 292 108 L 110 206 Z" fill="rgba(201,149,43,0.2)" stroke="#c9952b" strokeWidth="1.5" />
      {[
        { d: "M 70 152 L 130 120 L 172 142 L 112 174 Z", prime: false },
        { d: "M 142 114 L 202 82 L 244 104 L 184 136 Z", prime: false },
        { d: "M 138 214 L 202 180 L 248 204 L 184 238 Z", prime: true },
        { d: "M 214 174 L 278 140 L 324 164 L 260 198 Z", prime: false },
        { d: "M 288 134 L 346 104 L 388 126 L 330 156 Z", prime: false },
      ].map((p, idx) => (
        <motion.path
          key={idx}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.08, duration: 0.35 }}
          d={p.d}
          fill={p.prime ? "rgba(200,16,46,0.32)" : fillSide}
          stroke={p.prime ? "#c8102e" : stroke}
          strokeWidth={p.prime ? "2.2" : "1.4"}
        />
      ))}
      <motion.g
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <line x1="194" y1="206" x2="194" y2="142" stroke="#c8102e" strokeWidth="2.5" />
        <circle cx="194" cy="138" r="6" fill="#c8102e" />
        <circle cx="194" cy="138" r="14" stroke="#c8102e" strokeOpacity="0.5" strokeWidth="1.5" />
      </motion.g>
    </svg>
  );
}

const MODES_ACCORDION_META = [
  {
    id: "homes",
    num: "01",
    title: "Homes",
    kicker: "High-rise · Low-rise · Kothis",
    body: "High-rise apartments, low-rise builder floors and independent kothis shortlisted around how you live, not whatever a portal is pushing this week.",
    statValue: "100%",
    statLabel: "Walked & checked in person before you visit",
    points: [
      "Every home walked in person before you visit",
      "Carpet-to-super-area ratio & society upkeep checked",
      "Home-loan tie-ups, eligibility & negotiation handled by us",
    ],
    intent: "buy" as Intent,
    cta: "Shortlist residences",
    accent: "from-[#181b22] via-[#1f2430] to-[#12141a]",
  },
  {
    id: "commercial",
    num: "02",
    title: "Commercial",
    kicker: "Retail shops · Showrooms · Built-up",
    body: "High-street retail shops and multi-floor showrooms, chosen for frontage, visibility and whether a business can actually thrive there.",
    statValue: "100%",
    statLabel: "Main-road frontage & commercial title verified",
    points: [
      "Frontage, visibility and footfall checked on site",
      "Clear approach road and customer parking verified",
      "Purchase or sale structured through to registration",
    ],
    intent: "invest" as Intent,
    cta: "Explore retail & showrooms",
    accent: "from-[#1e181b] via-[#2b1820] to-[#141114]",
  },
  {
    id: "upcoming",
    num: "03",
    title: "Upcoming projects",
    kicker: "New launch · Under construction",
    body: "Projects still coming up. The builder, the approvals and the possession date are checked before any money is committed.",
    statValue: "3x",
    statLabel: "Past builder deliveries audited on the ground",
    points: [
      "RERA registration, sanction plans and approvals read",
      "Builder track record verified, not taken from a brochure",
      "Possession date and construction-linked plan agreed in writing",
    ],
    intent: "invest" as Intent,
    cta: "Review upcoming launches",
    accent: "from-[#1f1b14] via-[#2b2316] to-[#14120e]",
  },
  {
    id: "land",
    num: "04",
    title: "Land parcels",
    kicker: "Plotted · Held for growth",
    body: "Land parcels in approved layouts, bought to hold, with zoning and access walked on the ground rather than taken from a brochure.",
    statValue: "30m+",
    statLabel: "Sector road approach & boundary pillars walked",
    points: [
      "Layout approval and master-plan zoning checks",
      "On-ground site visits with the survey map",
      "A clear reason to hold, and when to exit",
    ],
    intent: "invest" as Intent,
    cta: "Inspect plotted & land parcels",
    accent: "from-[#161d19] via-[#1c2822] to-[#101512]",
  },
  {
    id: "leasing",
    num: "05",
    title: "Leasing",
    kicker: "Retail · Office · Residential",
    body: "Tenant placement, brand representation and end-to-end lease structuring for showrooms, corporate offices and residences—from LOI to registered lease deeds.",
    statValue: "3–9 Yr",
    statLabel: "Structured lock-in, escalation & vetted tenant KYC",
    points: [
      "Tenant covenant, background and business-viability checks",
      "Rent escalation, lock-in period and security deposit structuring",
      "Fit-out terms, handover checklist and lease deed registration",
    ],
    intent: "lease" as Intent,
    cta: "Discuss a leasing mandate",
    accent: "from-[#1b1924] via-[#252034] to-[#121118]",
  },
];

export function Modes() {
  const [expandedId, setExpandedId] = useState<string>("homes");

  return (
    <section id="modes" className="relative scroll-mt-24 overflow-hidden py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(17_17_17/0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(17_17_17/0.035)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000_60%,transparent_100%)]"
      />

      <div className="section">
        {/* Section Header */}
        <div className="grid gap-8 border-b border-border pb-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-brand-red/20 bg-brand-red-soft/60 px-3.5 py-1.5 text-xs font-semibold tracking-[0.16em] text-brand-red uppercase">
              <Compass className="size-3.5" />
              <span>Five service pillars</span>
            </div>
            <h2 className="mt-5 text-4xl leading-[1.06] font-semibold tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
              One kitchen.{" "}
              <span className="text-brand-red">Every property &amp; lease.</span>
            </h2>
          </div>

          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end lg:flex-col lg:items-end">
            <p className="max-w-md text-base leading-relaxed text-ink/68 lg:text-right">
              High-rise and low-rise residences, independent kothis, flagship showrooms, under-construction launches,
              approved land parcels and full-service leasing—advised together under one roof.
            </p>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-white/90 px-4 py-2.5 text-xs font-medium text-ink/75 shadow-soft backdrop-blur">
              <ShieldCheck className="size-4 shrink-0 text-brand-red" />
              <span>Every property &amp; lease walked and checked before you sign</span>
            </div>
          </div>
        </div>

        {/* 5-Pillar Expanding Architectural Accordion Gallery */}
        <div className="mt-12 flex flex-col gap-3.5 lg:h-[520px] lg:flex-row">
          {MODES_ACCORDION_META.map((panel) => {
            const isOpen = expandedId === panel.id;
            return (
              <article
                key={panel.id}
                onClick={() => setExpandedId(panel.id)}
                onMouseEnter={() => setExpandedId(panel.id)}
                className={cn(
                  "group relative cursor-pointer overflow-hidden rounded-[2rem] border border-ink/15 bg-gradient-to-br text-white shadow-lift transition-[flex,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  panel.accent,
                  isOpen ? "lg:flex-[4.4]" : "lg:flex-[0.75] hover:border-brand-red/50",
                )}
              >
                <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8">
                  {/* Top Row: Number + Kicker */}
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-2xl font-heading text-base font-bold transition-colors duration-300",
                        isOpen ? "bg-brand-red text-white shadow-red" : "bg-white/10 text-white/75",
                      )}
                    >
                      {panel.num}
                    </span>
                    {isOpen && (
                      <span className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-semibold whitespace-nowrap text-gold backdrop-blur">
                        {panel.kicker}
                      </span>
                    )}
                  </div>

                  {/* Collapsed Vertical Spine Label (Desktop only when closed) */}
                  {!isOpen ? (
                    <div className="my-auto hidden lg:block">
                      <p className="text-lg font-semibold tracking-tight text-white/90">{panel.title}</p>
                      <p className="mt-1.5 line-clamp-2 text-xs text-white/50">{panel.kicker}</p>
                      <span className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-brand-red">
                        Inspect <ArrowUpRight className="size-3.5" />
                      </span>
                    </div>
                  ) : null}

                  {/* Expanded Full Dossier View: 2-Column Non-Overlapping Grid */}
                  <div className={cn("mt-5", !isOpen && "lg:hidden")}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={panel.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="grid items-center gap-6 lg:grid-cols-[1.22fr_0.78fr]"
                      >
                        {/* Left Column: Text, Stat Pill, Checklist & CTA (Never overlapped) */}
                        <div className="min-w-0">
                          <h3 className="text-2xl font-semibold text-white sm:text-3xl">{panel.title}</h3>
                          <p className="mt-2 text-sm leading-relaxed text-white/75 sm:text-base">{panel.body}</p>

                          <div className="mt-4 inline-flex flex-wrap items-baseline gap-2.5 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-2.5 backdrop-blur">
                            <span className="font-heading text-2xl font-bold text-gold tabular-nums">
                              {panel.statValue}
                            </span>
                            <span className="text-xs text-white/80">{panel.statLabel}</span>
                          </div>

                          <ul className="mt-4 space-y-2 text-xs text-white/85 sm:text-sm">
                            {panel.points.map((pt) => (
                              <li key={pt} className="flex items-start gap-2.5">
                                <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-brand-red/25 text-[#ff8596]">
                                  <Check className="size-3" />
                                </span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>

                          <div className="mt-6">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                chooseIntent(panel.intent);
                              }}
                              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-brand-red hover:text-white sm:text-sm"
                            >
                              <span>{panel.cta}</span>
                              <ArrowRight className="size-4" />
                            </button>
                          </div>
                        </div>

                        {/* Right Column: Dedicated Animated Isometric Stage Box */}
                        <div className="relative hidden h-64 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-3 lg:flex">
                          <AnimatedArchitecturalScene id={panel.id} />
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
