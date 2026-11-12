"use client";

import { Building2, X } from "lucide-react";
import type { CrmProperty } from "@/lib/crm-store";
import {
  formatInrAmount,
  INVENTORY_DETAIL_FIELDS,
  propertyInventory,
  propertyProjectName,
  propertySummary,
} from "@/lib/crm-inventory";
import { BUDGET_LABELS, PILLAR_LABELS } from "@/components/crm/crm-shared";

export type CrmInventoryRecordModalProps = {
  property: CrmProperty;
  onClose: () => void;
};

export function CrmInventoryRecordModal({ property, onClose }: CrmInventoryRecordModalProps) {
  const inv = propertyInventory(property);
  const summary = propertySummary(property);

  const detailRows = INVENTORY_DETAIL_FIELDS.map((field) => {
    const raw = inv?.[field.key];
    if (raw == null || raw === "") return null;
    const display = field.money && typeof raw === "number" ? formatInrAmount(raw) : String(raw);
    return (
      <div key={field.key} className="border-b border-border/60 py-3 last:border-b-0">
        <dt className="text-[10px] font-semibold tracking-[0.12em] text-ink/40 uppercase">{field.label}</dt>
        <dd className="mt-1.5 text-sm leading-relaxed break-words whitespace-pre-wrap text-ink">{display}</dd>
      </div>
    );
  }).filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px] sm:p-8"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-record-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[min(920px,92vh)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-lift"
      >
        <div className="shrink-0 border-b border-border px-8 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-red text-white">
                <Building2 className="size-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-ink/45 uppercase">Inventory record</p>
                <h2
                  id="inventory-record-title"
                  className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl"
                >
                  {propertyProjectName(property)}
                </h2>
                <p className="mt-1 text-sm text-ink/55">{property.locality}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-brand-red-soft px-3 py-1 text-xs font-semibold text-brand-red-deep">
                    {PILLAR_LABELS[property.pillar]}
                  </span>
                  <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                    {property.verification_badge}
                  </span>
                  {[inv?.configuration, inv?.possession_status, inv?.furnishing_status]
                    .filter(Boolean)
                    .map((chip) => (
                      <span
                        key={String(chip)}
                        className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-medium text-ink/70"
                      >
                        {chip}
                      </span>
                    ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border p-2 text-ink/50 transition hover:bg-cream hover:text-ink"
              aria-label="Close inventory record"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
            <aside className="border-b border-border bg-cream/30 px-8 py-8 lg:border-r lg:border-b-0">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase">Pricing</p>
              <p className="mt-3 font-heading text-3xl font-bold text-ink tabular-nums">{property.price_label}</p>
              <p className="mt-1 text-sm text-ink/55">
                {BUDGET_LABELS[property.budget_bracket] ?? property.budget_bracket}
                {inv?.price_per_sqft
                  ? ` · ₹${Number(inv.price_per_sqft).toLocaleString("en-IN")}/sq.ft`
                  : ""}
              </p>

              <div className="mt-8 space-y-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase">Summary</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/75">{summary}</p>
                </div>
                {inv?.developer_name ? (
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase">Developer</p>
                    <p className="mt-2 text-sm font-medium text-ink">{inv.developer_name}</p>
                  </div>
                ) : null}
                {inv?.rera_number ? (
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase">RERA</p>
                    <p className="mt-2 font-mono text-sm text-ink">{inv.rera_number}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase">Added by</p>
                  <p className="mt-2 text-sm text-ink">
                    {property.added_by_name}
                    {property.added_by_role ? (
                      <span className="ml-1 font-mono text-[10px] uppercase text-brand-red">
                        ({property.added_by_role})
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
            </aside>

            <section className="px-8 py-8">
              <h3 className="text-sm font-bold text-ink">Full inventory details</h3>
              <p className="mt-1 text-sm text-ink/55">All fields from Inventory Master for this unit.</p>
              {detailRows.length > 0 ? (
                <dl className="mt-6 grid gap-0 sm:grid-cols-2 sm:gap-x-10">{detailRows}</dl>
              ) : (
                <p className="mt-6 text-sm text-ink/60">{summary}</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
