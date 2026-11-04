"use client";

import { Plus } from "lucide-react";
import type { CrmProperty } from "@/lib/crm-store";
import { Button } from "@/components/ui/button";
import { BUDGET_LABELS, PILLAR_LABELS } from "@/components/crm/crm-shared";

export type CrmInventoryViewProps = {
  properties: CrmProperty[];
  onAddProperty: () => void;
};

export function CrmInventoryView({ properties, onAddProperty }: CrmInventoryViewProps) {
  return (
    <div>
      <div className="mb-5 flex justify-end">
        <Button onClick={onAddProperty} className="h-10 rounded-xl bg-brand-red text-white shadow-red">
          <Plus className="size-4" />
          Add Property
        </Button>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((prop) => (
          <div
            key={prop.id}
            className="flex flex-col justify-between rounded-3xl border border-border bg-white p-6 shadow-soft"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-brand-red-soft px-3 py-1 text-xs font-semibold text-brand-red-deep">
                  {PILLAR_LABELS[prop.pillar]}
                </span>
                <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                  ✓ {prop.verification_badge}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-ink">{prop.title}</h3>
              <p className="mt-1 text-xs font-medium text-ink/55">{prop.locality}</p>
              <p className="mt-3 text-sm text-ink/75">{prop.specs}</p>
            </div>
            <div className="mt-6 space-y-2 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="font-heading text-xl font-bold text-ink tabular-nums">{prop.price_label}</span>
                <span className="text-xs font-medium text-ink/50">
                  Bracket: {BUDGET_LABELS[prop.budget_bracket] ?? prop.budget_bracket}
                </span>
              </div>
              <p className="text-[11px] text-ink/55">
                Added by <strong className="text-ink">{prop.added_by_name ?? "System"}</strong>
                {prop.added_by_role ? (
                  <span className="ml-1 font-mono text-[10px] uppercase text-brand-red">({prop.added_by_role})</span>
                ) : null}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
