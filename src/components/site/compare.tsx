import { Check, Minus, X } from "lucide-react";
import { COMPARE_ROWS } from "@/lib/content";
import { cn } from "@/lib/utils";

function Mark({ v, highlight = false }: { v: 0 | 1 | 2; highlight?: boolean }) {
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
        <Minus className="size-4" />
      </span>
    );
  return (
    <span className="inline-flex size-7 items-center justify-center rounded-full text-white/30" aria-label="No">
      <X className="size-4" />
    </span>
  );
}

export function Compare() {
  return (
    <section id="why" className="dark relative scroll-mt-24 overflow-hidden bg-background py-24 text-foreground sm:py-32">
      <div className="pointer-events-none absolute -bottom-60 left-1/2 size-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(200_16_46/0.22),transparent_60%)]" />
      <div className="section relative">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <span className="eyebrow text-[#ff6b7f] before:bg-[#ff6b7f]">Why RealtyCook</span>
            <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">
              Portals list. Brokers push. <span className="text-[#ff6b7f]">We prepare.</span>
            </h2>
            <p className="mt-6 max-w-md text-white/65">
              Listing portals give you endless inventory and leave the checking to you. Local brokers know one
              neighbourhood and earn when you sign. RealtyCook works on your side: we check every listing, plan the
              investment and stay with you after the deal closes.
            </p>
            <p className="font-script mt-10 text-4xl text-white/80">Trust for growth…</p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur">
            <table className="w-full min-w-[520px] text-left text-sm">
              <caption className="sr-only">How RealtyCook compares with listing portals and traditional brokers</caption>
              <thead>
                <tr className="border-b border-white/10 text-xs tracking-wider text-white/50 uppercase">
                  <th scope="col" className="p-5 font-semibold">What you get</th>
                  <th scope="col" className="p-5 text-center font-semibold">Listing portals</th>
                  <th scope="col" className="p-5 text-center font-semibold">Local brokers</th>
                  <th scope="col" className="bg-brand-red/15 p-5 text-center font-semibold text-white">RealtyCook</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((r) => (
                  <tr key={r.label} className="border-b border-white/5 last:border-0">
                    <th scope="row" className="p-5 font-medium text-white/85">{r.label}</th>
                    <td className="p-5 text-center"><Mark v={r.portal} /></td>
                    <td className="p-5 text-center"><Mark v={r.broker} /></td>
                    <td className="bg-brand-red/10 p-5 text-center"><Mark v={r.us} highlight /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
