"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List, Plus, Search, X } from "lucide-react";
import type { CrmProperty } from "@/lib/crm-store";
import {
  EMPTY_INVENTORY_FILTERS,
  filterInventory,
  propertyInventory,
  propertyProjectName,
  propertySummary,
  uniqueInventoryValues,
  type InventoryFilters,
} from "@/lib/crm-inventory";
import { Button } from "@/components/ui/button";
import { BUDGET_LABELS, PILLAR_LABELS } from "@/components/crm/crm-shared";
import { cn } from "@/lib/utils";

export type CrmInventoryViewProps = {
  properties: CrmProperty[];
  selectedPropertyId: string | null;
  onSelectProperty: (propertyId: string) => void;
  canManageInventory: boolean;
  onAddProperty: () => void;
};

type ViewMode = "cards" | "list";

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-[140px] flex-1">
      <span className="mb-1.5 block text-[10px] font-semibold tracking-[0.12em] text-ink/40 uppercase">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-ink"
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {label === "Budget" ? (BUDGET_LABELS[opt] ?? opt) : opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function locationPrimary(prop: CrmProperty) {
  const inv = propertyInventory(prop);
  return inv?.locality_area || prop.locality || inv?.city || "—";
}

function locationSecondary(prop: CrmProperty) {
  const inv = propertyInventory(prop);
  const city = inv?.city || "";
  if (!city) return null;
  // Avoid repeating the same value under the locality line.
  const primary = String(inv?.locality_area || prop.locality || "").trim().toLowerCase();
  if (city.trim().toLowerCase() === primary) return null;
  return city;
}

function CollapsedMeta({ prop }: { prop: CrmProperty }) {
  const inv = propertyInventory(prop);
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {[inv?.configuration, inv?.expected_possession_date, inv?.furnishing_status, inv?.property_type]
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
  );
}

export function CrmInventoryView({
  properties,
  selectedPropertyId,
  onSelectProperty,
  canManageInventory,
  onAddProperty,
}: CrmInventoryViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filters, setFilters] = useState<InventoryFilters>(EMPTY_INVENTORY_FILTERS);

  const cities = useMemo(() => uniqueInventoryValues(properties, "city"), [properties]);
  const propertyTypes = useMemo(() => uniqueInventoryValues(properties, "property_type"), [properties]);
  const configurations = useMemo(() => uniqueInventoryValues(properties, "configuration"), [properties]);
  const possessions = useMemo(() => uniqueInventoryValues(properties, "possession_status"), [properties]);
  const furnishings = useMemo(() => uniqueInventoryValues(properties, "furnishing_status"), [properties]);
  const verifications = useMemo(() => uniqueInventoryValues(properties, "verification_status"), [properties]);
  const budgets = useMemo(
    () => [...new Set(properties.map((p) => p.budget_bracket).filter(Boolean))].sort(),
    [properties],
  );

  const filtered = useMemo(() => filterInventory(properties, filters), [properties, filters]);
  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== "query" && Boolean(v)).length;

  function patchFilter<K extends keyof InventoryFilters>(key: K, value: InventoryFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink/35" />
          <input
            value={filters.query}
            onChange={(e) => patchFilter("query", e.target.value)}
            placeholder="Search project, locality, developer, RERA…"
            className="h-11 w-full rounded-2xl border border-border bg-white pr-4 pl-10 text-sm text-ink shadow-soft"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-2xl border border-border bg-white p-1 shadow-soft">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold",
                viewMode === "cards" ? "bg-brand-red text-white" : "text-ink/60 hover:text-ink",
              )}
              aria-pressed={viewMode === "cards"}
            >
              <LayoutGrid className="size-3.5" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold",
                viewMode === "list" ? "bg-brand-red text-white" : "text-ink/60 hover:text-ink",
              )}
              aria-pressed={viewMode === "list"}
            >
              <List className="size-3.5" />
              List
            </button>
          </div>
          {canManageInventory ? (
            <Button onClick={onAddProperty} className="h-10 rounded-xl bg-brand-red text-white shadow-red">
              <Plus className="size-4" />
              Add Property
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 rounded-3xl border border-border bg-white/80 p-4 shadow-soft">
        <FilterSelect label="City" value={filters.city} options={cities} onChange={(v) => patchFilter("city", v)} />
        <FilterSelect
          label="Type"
          value={filters.propertyType}
          options={propertyTypes}
          onChange={(v) => patchFilter("propertyType", v)}
        />
        <FilterSelect
          label="Config"
          value={filters.configuration}
          options={configurations}
          onChange={(v) => patchFilter("configuration", v)}
        />
        <FilterSelect
          label="Possession"
          value={filters.possession}
          options={possessions}
          onChange={(v) => patchFilter("possession", v)}
        />
        <FilterSelect
          label="Furnishing"
          value={filters.furnishing}
          options={furnishings}
          onChange={(v) => patchFilter("furnishing", v)}
        />
        <FilterSelect
          label="Verification"
          value={filters.verification}
          options={verifications}
          onChange={(v) => patchFilter("verification", v)}
        />
        <FilterSelect
          label="Budget"
          value={filters.budget}
          options={budgets}
          onChange={(v) => patchFilter("budget", v)}
        />
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-ink/55">
          Showing <span className="font-semibold text-ink">{filtered.length}</span> of {properties.length} inventory
          units
          {activeFilterCount ? ` · ${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""}` : ""}
        </p>
        {(activeFilterCount > 0 || filters.query) && (
          <button
            type="button"
            onClick={() => setFilters(EMPTY_INVENTORY_FILTERS)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-red hover:underline"
          >
            <X className="size-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-ink">No inventory matches</p>
          <p className="mt-2 text-sm text-ink/55">Try clearing filters or searching another locality / configuration.</p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((prop) => {
            const selected = selectedPropertyId === prop.id;
            const inv = propertyInventory(prop);
            const localityLine = locationSecondary(prop);
            return (
              <button
                key={prop.id}
                type="button"
                onClick={() => onSelectProperty(prop.id)}
                className={cn(
                  "flex flex-col rounded-3xl border bg-white p-5 text-left shadow-soft transition hover:border-brand-red/25",
                  selected ? "border-brand-red ring-2 ring-brand-red/20" : "border-border",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-brand-red-soft px-3 py-1 text-xs font-semibold text-brand-red-deep">
                    {PILLAR_LABELS[prop.pillar]}
                  </span>
                  <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                    {prop.verification_badge}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-ink">{propertyProjectName(prop)}</h3>
                <p className="mt-1 text-xs font-medium text-ink/55">{locationPrimary(prop)}</p>
                {localityLine ? <p className="text-[11px] text-ink/45">{localityLine}</p> : null}
                <CollapsedMeta prop={prop} />
                <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-3">
                  <div>
                    <p className="font-heading text-xl font-bold text-ink tabular-nums">{prop.price_label}</p>
                    <p className="text-[11px] text-ink/50">
                      {BUDGET_LABELS[prop.budget_bracket] ?? prop.budget_bracket}
                      {inv?.price_per_sqft ? ` · ₹${Number(inv.price_per_sqft).toLocaleString("en-IN")}/sq.ft` : ""}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-brand-red">Open</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-cream/50 text-[10px] font-semibold tracking-[0.12em] text-ink/45 uppercase">
                <tr>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Config</th>
                  <th className="px-4 py-3">Possession</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Property Type</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((prop) => {
                  const selected = selectedPropertyId === prop.id;
                  const inv = propertyInventory(prop);
                  const localityLine = locationSecondary(prop);
                  return (
                    <tr
                      key={prop.id}
                      onClick={() => onSelectProperty(prop.id)}
                      className={cn(
                        "cursor-pointer border-b border-border/70 transition hover:bg-cream/40",
                        selected && "bg-brand-red-soft/30",
                      )}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">{propertyProjectName(prop)}</p>
                        <p className="text-xs text-ink/50">{inv?.developer_name || propertySummary(prop)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-ink/75">{locationPrimary(prop)}</p>
                        {localityLine ? <p className="text-xs text-ink/50">{localityLine}</p> : null}
                      </td>
                      <td className="px-4 py-3 text-ink/75">{inv?.configuration || "—"}</td>
                      <td className="px-4 py-3 text-ink/75">{inv?.expected_possession_date || "—"}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-ink">{prop.price_label}</td>
                      <td className="px-4 py-3 text-ink/75">{inv?.property_type || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
