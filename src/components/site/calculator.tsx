"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { CanvasShell } from "@/components/three/canvas-shell";
import { Slider } from "@/components/ui/slider";
import { formatINR, projectInvestment } from "@/lib/format";

const GrowthScene = dynamic(() => import("@/components/three/growth-scene"), {
  ssr: false,
  loading: () => <ChartLoading />,
});

function ChartLoading() {
  return (
    <div className="flex h-full items-end justify-center gap-2 px-10 pb-16" role="status" aria-label="Loading 3D chart">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="w-6 animate-pulse rounded-md bg-ink/10" style={{ height: `${20 + i * 7}%` }} />
      ))}
    </div>
  );
}

function ChartFallback({ rows }: { rows: ReturnType<typeof projectInvestment> }) {
  const last = rows[rows.length - 1];
  const max = last.value + last.cumulativeRent;
  return (
    <div className="flex h-full items-end justify-center gap-1.5 px-8 pb-12">
      {rows.map((r) => (
        <div key={r.year} className="flex w-5 flex-col-reverse overflow-hidden rounded-md">
          <div className="bg-ink" style={{ height: `${(r.value / max) * 260}px` }} />
          <div className="bg-gold" style={{ height: `${(r.cumulativeRent / max) * 260}px` }} />
        </div>
      ))}
    </div>
  );
}

type Field = {
  key: "price" | "appreciation" | "rentalYield" | "years";
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
};

const FIELDS: Field[] = [
  { key: "price", label: "Property price", min: 25_00_000, max: 10_00_00_000, step: 5_00_000, format: formatINR },
  { key: "appreciation", label: "Expected appreciation / yr", min: 0, max: 12, step: 0.5, format: (v) => `${v}%` },
  { key: "rentalYield", label: "Rental yield / yr", min: 0, max: 9, step: 0.25, format: (v) => `${v}%` },
  { key: "years", label: "Holding period", min: 1, max: 15, step: 1, format: (v) => `${v} yr${v > 1 ? "s" : ""}` },
];

export function Calculator() {
  const [inputs, setInputs] = useState({ price: 1_50_00_000, appreciation: 6, rentalYield: 3.5, years: 10 });
  const rows = useMemo(() => projectInvestment(inputs), [inputs]);
  const last = rows[rows.length - 1];
  const appreciationGain = last.value - inputs.price;
  const totalGain = appreciationGain + last.cumulativeRent;
  const multiple = (inputs.price + totalGain) / inputs.price;

  return (
    <section id="calculator" className="relative scroll-mt-24 bg-cream-2/60 py-24 sm:py-32">
      <div className="section">
        <div className="max-w-2xl">
          <span className="eyebrow">Taste-test your returns</span>
          <h2 className="mt-4 text-4xl font-semibold text-ink sm:text-5xl">See how a property could grow.</h2>
          <p className="mt-4 text-ink/65">
            Move the sliders to see how appreciation and rent could add up over the years you hold a property. Your
            advisor will rerun this with real comparable deals and tax inputs.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-border bg-white p-7 shadow-soft sm:p-8">
            <div className="space-y-8">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <div className="flex items-baseline justify-between gap-4">
                    <label id={`lbl-${f.key}`} className="text-sm font-medium text-ink/70">
                      {f.label}
                    </label>
                    <span className="font-heading text-lg font-semibold text-ink tabular-nums">{f.format(inputs[f.key])}</span>
                  </div>
                  <Slider
                    aria-labelledby={`lbl-${f.key}`}
                    className="mt-4 [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-brand-red [&_[data-slot=slider-track]]:h-1.5"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={[inputs[f.key]]}
                    onValueChange={(v) => {
                      const n = Array.isArray(v) ? v[0] : (v as number);
                      setInputs((s) => ({ ...s, [f.key]: n }));
                    }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-8 text-xs leading-relaxed text-ink/45">
              Illustrative only. Not investment advice. Ignores loan interest, maintenance, vacancy, stamp duty and tax,
              and assumes rent grows with the property value but isn&apos;t reinvested.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-white to-cream shadow-soft">
            <div className="grid grid-cols-3 divide-x divide-border border-b border-border bg-white/70 backdrop-blur">
              {[
                { label: `Value in ${inputs.years} yrs`, value: formatINR(last.value), tone: "text-ink" },
                { label: "Rent collected", value: formatINR(last.cumulativeRent), tone: "text-gold" },
                { label: "Total gain", value: formatINR(totalGain), tone: "text-brand-red" },
              ].map((s) => (
                <div key={s.label} className="p-4 sm:p-5">
                  <p className="text-[11px] font-semibold tracking-wider text-ink/45 uppercase">{s.label}</p>
                  <p className={`mt-1 font-heading text-lg font-semibold tabular-nums sm:text-2xl ${s.tone}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <CanvasShell className="h-[340px] sm:h-[400px]" loading={<ChartLoading />} fallback={<ChartFallback rows={rows} />}>
              <GrowthScene rows={rows} />
            </CanvasShell>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-sm">
              <div className="flex items-center gap-4 text-ink/60">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-ink" /> Property value
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-gold" /> Rent collected
                </span>
              </div>
              <span className="font-semibold text-ink">
                {multiple.toFixed(2)}× your money over {inputs.years} {inputs.years > 1 ? "years" : "year"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
