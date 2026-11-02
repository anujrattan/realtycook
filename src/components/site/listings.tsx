"use client";

import { ArrowUpRight, MapPin } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LISTINGS, type Listing } from "@/lib/content";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { chooseIntent } from "./intent";
import { IsoBuilding } from "./iso-building";
import { TiltCard } from "./tilt-card";

const FILTERS: { id: "all" | Listing["category"]; label: string }[] = [
  { id: "all", label: "All" },
  { id: "buy", label: "Homes to buy" },
  { id: "invest", label: "Investments" },
  { id: "rent", label: "Rentals" },
];

export function Listings() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const shown = filter === "all" ? LISTINGS : LISTINGS.filter((l) => l.category === filter);

  return (
    <section id="listings" className="section scroll-mt-24 py-24 sm:py-32">
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <span className="eyebrow">Fresh off the stove</span>
          <h2 className="mt-4 text-4xl font-semibold text-ink sm:text-5xl">Handpicked, pre-verified properties.</h2>
          <p className="mt-4 text-ink/65">
            A taste of what our advisors are working on this month. Every property here has passed our title, approval
            and pricing checks.
          </p>
        </div>
        <div role="tablist" aria-label="Filter properties" className="flex flex-wrap gap-1.5 rounded-full border border-border bg-white p-1.5 shadow-soft">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
                filter === f.id ? "bg-ink text-white shadow-soft" : "text-ink/65 hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="mt-14 rounded-3xl border border-dashed border-border p-12 text-center text-ink/60">
          Nothing on the menu in this category right now. Tell us what you&apos;re looking for and we&apos;ll source it.
        </p>
      ) : (
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((l) => (
            <TiltCard key={l.id} className="rounded-3xl" max={6}>
              <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-soft transition-shadow hover:shadow-lift">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <div className="h-full w-full transition-transform duration-500 group-hover/tilt:scale-105">
                    <IsoBuilding floors={l.floors} hue={l.hue} />
                  </div>
                  <Badge className="absolute top-4 left-4 h-6 rounded-full bg-white px-2.5 text-ink shadow-soft">{l.tag}</Badge>
                  {l.metric && (
                    <Badge className="absolute top-4 right-4 h-6 rounded-full bg-ink px-2.5 text-white">{l.metric}</Badge>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="flex items-center gap-1.5 text-sm text-ink/55">
                    <MapPin className="size-3.5 text-brand-red" /> {l.locality}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-ink">{l.title}</h3>
                  <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink/60">
                    {l.specs.map((s, i) => (
                      <span key={s} className="flex items-center gap-3">
                        {i > 0 && <span className="size-1 rounded-full bg-ink/25" />}
                        {s}
                      </span>
                    ))}
                  </p>
                  <div className="mt-auto flex items-end justify-between pt-6">
                    <p className="font-heading text-2xl font-semibold text-ink">
                      {formatINR(l.price)}
                      {l.category === "rent" && <span className="text-sm font-medium text-ink/50"> /mo</span>}
                    </p>
                    <button
                      type="button"
                      onClick={() => chooseIntent(l.category === "invest" ? "invest" : l.category === "rent" ? "lease" : "buy")}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand-red hover:bg-brand-red hover:text-white"
                      aria-label={`Enquire about ${l.title}`}
                    >
                      Enquire <ArrowUpRight className="size-4" />
                    </button>
                  </div>
                </div>
              </article>
            </TiltCard>
          ))}
        </div>
      )}
    </section>
  );
}
