"use client";

import { useEffect, useState } from "react";
import { Building2, Pencil, X } from "lucide-react";
import type { CrmProperty, LeadIntent, ServicePillar } from "@/lib/crm-store";
import {
  formatInrAmount,
  INVENTORY_DETAIL_FIELDS,
  propertyInventory,
  propertyProjectName,
  propertySummary,
} from "@/lib/crm-inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BUDGET_LABELS, PILLAR_LABELS } from "@/components/crm/crm-shared";

export type InventoryEditForm = {
  title: string;
  locality: string;
  price_label: string;
  budget_bracket: string;
  pillar: ServicePillar;
  intent: LeadIntent;
  verification_badge: string;
  project_name: string;
  property_type: string;
  city: string;
  locality_area: string;
  developer_name: string;
  rera_number: string;
  configuration: string;
  unit_details: string;
  possession_status: string;
  availability_status: string;
  furnishing_status: string;
  verification_status: string;
  quoted_price: string;
  price_per_sqft: string;
  amenities: string;
  internal_notes: string;
  parking_included: string;
  power_backup: string;
  summary: string;
};

function formFromProperty(property: CrmProperty): InventoryEditForm {
  const inv = propertyInventory(property);
  return {
    title: property.title,
    locality: property.locality,
    price_label: property.price_label,
    budget_bracket: property.budget_bracket,
    pillar: property.pillar,
    intent: property.intent,
    verification_badge: property.verification_badge,
    project_name: inv?.project_name || propertyProjectName(property),
    property_type: inv?.property_type || "",
    city: inv?.city || "",
    locality_area: inv?.locality_area || "",
    developer_name: inv?.developer_name || "",
    rera_number: inv?.rera_number || "",
    configuration: inv?.configuration || "",
    unit_details: inv?.unit_details || "",
    possession_status: inv?.possession_status || "",
    availability_status: inv?.availability_status || "",
    furnishing_status: inv?.furnishing_status || "",
    verification_status: inv?.verification_status || property.verification_badge || "",
    quoted_price: inv?.quoted_price != null ? String(inv.quoted_price) : "",
    price_per_sqft: inv?.price_per_sqft != null ? String(inv.price_per_sqft) : "",
    amenities: inv?.amenities || "",
    internal_notes: inv?.internal_notes || "",
    parking_included: inv?.parking_included || "",
    power_backup: inv?.power_backup || "",
    summary: propertySummary(property),
  };
}

export type CrmInventoryRecordModalProps = {
  property: CrmProperty;
  canEdit: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: (form: InventoryEditForm) => Promise<boolean> | boolean;
};

export function CrmInventoryRecordModal({
  property,
  canEdit,
  busy,
  onClose,
  onSave,
}: CrmInventoryRecordModalProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<InventoryEditForm>(() => formFromProperty(property));

  useEffect(() => {
    setForm(formFromProperty(property));
    setEditing(false);
  }, [property.id]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await onSave(form);
    if (ok) setEditing(false);
  }

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
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && !editing ? (
                <Button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="h-10 rounded-xl bg-brand-red px-4 text-white shadow-red"
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>
              ) : null}
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
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-5 px-8 py-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="inv-title">Title</Label>
                  <Input
                    id="inv-title"
                    required
                    value={form.title}
                    onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-project">Project name</Label>
                  <Input
                    id="inv-project"
                    value={form.project_name}
                    onChange={(e) => setForm((s) => ({ ...s, project_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-type">Property type</Label>
                  <Input
                    id="inv-type"
                    value={form.property_type}
                    onChange={(e) => setForm((s) => ({ ...s, property_type: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-city">City</Label>
                  <Input
                    id="inv-city"
                    value={form.city}
                    onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-area">Locality / area</Label>
                  <Input
                    id="inv-area"
                    value={form.locality_area}
                    onChange={(e) => setForm((s) => ({ ...s, locality_area: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="inv-locality">Display locality</Label>
                  <Input
                    id="inv-locality"
                    required
                    value={form.locality}
                    onChange={(e) => setForm((s) => ({ ...s, locality: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-price">Price label</Label>
                  <Input
                    id="inv-price"
                    required
                    value={form.price_label}
                    onChange={(e) => setForm((s) => ({ ...s, price_label: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-quoted">Quoted price (₹)</Label>
                  <Input
                    id="inv-quoted"
                    type="number"
                    value={form.quoted_price}
                    onChange={(e) => setForm((s) => ({ ...s, quoted_price: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-psf">Price / sq.ft</Label>
                  <Input
                    id="inv-psf"
                    type="number"
                    value={form.price_per_sqft}
                    onChange={(e) => setForm((s) => ({ ...s, price_per_sqft: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-budget">Budget bracket</Label>
                  <select
                    id="inv-budget"
                    value={form.budget_bracket}
                    onChange={(e) => setForm((s) => ({ ...s, budget_bracket: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm"
                  >
                    {Object.entries(BUDGET_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-config">Configuration</Label>
                  <Input
                    id="inv-config"
                    value={form.configuration}
                    onChange={(e) => setForm((s) => ({ ...s, configuration: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-possession">Possession</Label>
                  <Input
                    id="inv-possession"
                    value={form.possession_status}
                    onChange={(e) => setForm((s) => ({ ...s, possession_status: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-furnish">Furnishing</Label>
                  <Input
                    id="inv-furnish"
                    value={form.furnishing_status}
                    onChange={(e) => setForm((s) => ({ ...s, furnishing_status: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-avail">Availability</Label>
                  <Input
                    id="inv-avail"
                    value={form.availability_status}
                    onChange={(e) => setForm((s) => ({ ...s, availability_status: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-dev">Developer</Label>
                  <Input
                    id="inv-dev"
                    value={form.developer_name}
                    onChange={(e) => setForm((s) => ({ ...s, developer_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-rera">RERA</Label>
                  <Input
                    id="inv-rera"
                    value={form.rera_number}
                    onChange={(e) => setForm((s) => ({ ...s, rera_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-verify">Verification status</Label>
                  <Input
                    id="inv-verify"
                    value={form.verification_status}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        verification_status: e.target.value,
                        verification_badge: e.target.value || s.verification_badge,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-pillar">Pillar</Label>
                  <select
                    id="inv-pillar"
                    value={form.pillar}
                    onChange={(e) => setForm((s) => ({ ...s, pillar: e.target.value as ServicePillar }))}
                    className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm"
                  >
                    {Object.entries(PILLAR_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="inv-unit">Unit / tower / floor</Label>
                  <Input
                    id="inv-unit"
                    value={form.unit_details}
                    onChange={(e) => setForm((s) => ({ ...s, unit_details: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="inv-summary">Summary</Label>
                  <Input
                    id="inv-summary"
                    value={form.summary}
                    onChange={(e) => setForm((s) => ({ ...s, summary: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="inv-amenities">Amenities</Label>
                  <Textarea
                    id="inv-amenities"
                    rows={3}
                    value={form.amenities}
                    onChange={(e) => setForm((s) => ({ ...s, amenities: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="inv-notes">Internal notes</Label>
                  <Textarea
                    id="inv-notes"
                    rows={4}
                    value={form.internal_notes}
                    onChange={(e) => setForm((s) => ({ ...s, internal_notes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-5">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setForm(formFromProperty(property));
                    setEditing(false);
                  }}
                  className="h-10 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={busy}
                  className="h-10 rounded-xl bg-brand-red text-white shadow-red"
                >
                  Save changes
                </Button>
              </div>
            </form>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
