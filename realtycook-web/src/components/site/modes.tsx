import { Check } from "lucide-react";
import { MODES } from "@/lib/content";
import { cn } from "@/lib/utils";
import { TiltCard } from "./tilt-card";

const TONE = {
  red: { chip: "bg-brand-red text-white", glow: "from-brand-red/10" },
  ink: { chip: "bg-ink text-white", glow: "from-ink/8" },
  gold: { chip: "bg-gold text-white", glow: "from-gold/15" },
} as const;

export function Modes() {
  return (
    <section id="modes" className="section scroll-mt-24 py-24 sm:py-32">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <span className="eyebrow">Six ways to deal</span>
          <h2 className="mt-4 text-4xl font-semibold text-ink sm:text-5xl">
            One kitchen. Every kind of property deal.
          </h2>
        </div>
        <p className="max-w-md text-ink/65">
          Most firms only buy, only sell or only invest. RealtyCook does all three, so your home, your next sale and
          your portfolio are planned together instead of in silos.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((m) => {
          const Icon = m.icon;
          const tone = TONE[m.tone];
          return (
            <TiltCard key={m.id} className="rounded-3xl">
              <article
                className={cn(
                  "relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-white p-7 shadow-soft transition-shadow duration-300 hover:shadow-lift",
                )}
              >
                <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b to-transparent", tone.glow)} />
                <div className="relative flex items-center justify-between [transform:translateZ(40px)]">
                  <span className={cn("flex size-12 items-center justify-center rounded-2xl shadow-soft", tone.chip)}>
                    <Icon className="size-5" />
                  </span>
                  <span className="text-right text-[11px] font-semibold tracking-wider text-ink/45 uppercase">{m.kicker}</span>
                </div>
                <h3 className="relative mt-7 text-2xl font-semibold text-ink [transform:translateZ(30px)]">{m.title}</h3>
                <p className="relative mt-3 leading-relaxed text-ink/65">{m.body}</p>
                <ul className="relative mt-6 space-y-2.5 border-t border-dashed border-border pt-5 text-sm text-ink/75">
                  {m.points.map((p) => (
                    <li key={p} className="flex gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand-red" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            </TiltCard>
          );
        })}
      </div>
    </section>
  );
}
