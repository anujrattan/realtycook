"use client";

import { FileSpreadsheet, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { REASONS_BY_STAGE, STAGES } from "@/components/crm/crm-shared";
import type { CrmUser, LeadIntent, LeadStage, ServicePillar, StageReason } from "@/lib/crm-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type NewLeadFormState = {
  name: string;
  phone: string;
  email: string;
  city: string;
  intent: LeadIntent;
  pillar: ServicePillar;
  budget: string;
  message: string;
};

export type PropertyFormState = {
  title: string;
  pillar: ServicePillar;
  intent: LeadIntent;
  locality: string;
  price_label: string;
  budget_bracket: string;
  specs: string;
  verification_badge: string;
};

export type CrmNewLeadModalProps = {
  open: boolean;
  onClose: () => void;
  busy: boolean;
  form: NewLeadFormState;
  setForm: React.Dispatch<React.SetStateAction<NewLeadFormState>>;
  onSubmit: (e: React.FormEvent) => void;
};

export function CrmNewLeadModal({ open, onClose, busy, form, setForm, onSubmit }: CrmNewLeadModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-6 shadow-lift sm:p-8">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-xl font-bold text-ink">Add New Lead</h2>
          <button type="button" onClick={onClose} className="text-xs font-semibold text-ink/50 hover:text-ink">
            Close ✕
          </button>
        </div>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="nl-name">Client Name</Label>
              <Input
                id="nl-name"
                required
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="Client full name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nl-phone">WhatsApp / Phone</Label>
              <Input
                id="nl-phone"
                required
                value={form.phone}
                onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                placeholder="+91 98xxxxxx10"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="nl-intent">Intent</Label>
              <select
                id="nl-intent"
                value={form.intent}
                onChange={(e) => setForm((s) => ({ ...s, intent: e.target.value as LeadIntent }))}
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-xs font-semibold"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
                <option value="invest">Invest</option>
                <option value="lease">Leasing</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="nl-pillar">Service Pillar</Label>
              <select
                id="nl-pillar"
                value={form.pillar}
                onChange={(e) => setForm((s) => ({ ...s, pillar: e.target.value as ServicePillar }))}
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-xs font-semibold"
              >
                <option value="homes">Homes & Kothis</option>
                <option value="commercial">Commercial</option>
                <option value="upcoming">Upcoming</option>
                <option value="land">Land Parcels</option>
                <option value="leasing">Leasing</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="nl-budget">Budget</Label>
              <select
                id="nl-budget"
                value={form.budget}
                onChange={(e) => setForm((s) => ({ ...s, budget: e.target.value }))}
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-xs font-semibold"
              >
                <option value="under-50l">Under ₹50 L</option>
                <option value="50l-1cr">₹50 L – ₹1 Cr</option>
                <option value="1-3cr">₹1 – 3 Cr</option>
                <option value="3-10cr">₹3 – 10 Cr</option>
                <option value="10cr-plus">₹10 Cr+</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="nl-city">Preferred City / Sector</Label>
            <Input
              id="nl-city"
              value={form.city}
              onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
              placeholder="e.g. Sector 65 Gurugram"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nl-msg">Initial Conversation Note</Label>
            <Textarea
              id="nl-msg"
              rows={2}
              value={form.message}
              onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
              placeholder="Specific requirement details…"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={busy} className="rounded-xl bg-brand-red text-white shadow-red">
              Save Lead to CRM
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export type CrmBulkUploadModalProps = {
  open: boolean;
  onClose: () => void;
  busy: boolean;
  bulkPreviewCount: number;
  onFileSelected: (file: File) => void;
  onImport: () => void;
};

export function CrmBulkUploadModal({
  open,
  onClose,
  busy,
  bulkPreviewCount,
  onFileSelected,
  onImport,
}: CrmBulkUploadModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-6 shadow-lift sm:p-8">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-brand-red" />
            <h2 className="text-xl font-bold text-ink">Bulk Upload Leads</h2>
          </div>
          <button type="button" onClick={onClose} className="text-xs font-semibold text-ink/50">
            Close ✕
          </button>
        </div>
        <p className="mt-4 text-xs text-ink/65">
          Upload an Excel sheet (<code>.xlsx</code> / <code>.xls</code> / <code>.csv</code>) with columns like{" "}
          <strong>Name</strong>, <strong>Phone</strong>, Email, City, Intent, Pillar, Budget, Notes.
        </p>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          className="mt-4 block w-full text-xs"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelected(file);
          }}
        />
        {bulkPreviewCount > 0 && (
          <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-xs font-semibold text-ink">
            Ready to import <span className="text-brand-red">{bulkPreviewCount}</span> valid leads.
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || bulkPreviewCount === 0}
            onClick={onImport}
            className="rounded-xl bg-brand-red text-white shadow-red"
          >
            <Upload className="size-4" />
            Import {bulkPreviewCount || ""} Leads
          </Button>
        </div>
      </div>
    </div>
  );
}

export type CrmAddPropertyModalProps = {
  open: boolean;
  onClose: () => void;
  busy: boolean;
  actor: CrmUser;
  form: PropertyFormState;
  setForm: React.Dispatch<React.SetStateAction<PropertyFormState>>;
  onSubmit: (e: React.FormEvent) => void;
};

export function CrmAddPropertyModal({
  open,
  onClose,
  busy,
  actor,
  form,
  setForm,
  onSubmit,
}: CrmAddPropertyModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-6 shadow-lift sm:p-8">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-xl font-bold text-ink">Add Verified Property</h2>
          <button type="button" onClick={onClose} className="text-xs font-semibold text-ink/50">
            Close ✕
          </button>
        </div>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="p-title">Property Title</Label>
            <Input
              id="p-title"
              required
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              placeholder="e.g. Park-Facing 4 BHK Residence"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="p-locality">Locality / Sector</Label>
              <Input
                id="p-locality"
                required
                value={form.locality}
                onChange={(e) => setForm((s) => ({ ...s, locality: e.target.value }))}
                placeholder="Sector 65, Gurugram"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="p-price">Price Label</Label>
              <Input
                id="p-price"
                required
                value={form.price_label}
                onChange={(e) => setForm((s) => ({ ...s, price_label: e.target.value }))}
                placeholder="₹3.45 Cr"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="p-pillar">Pillar</Label>
              <select
                id="p-pillar"
                value={form.pillar}
                onChange={(e) => setForm((s) => ({ ...s, pillar: e.target.value as ServicePillar }))}
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-xs font-semibold"
              >
                <option value="homes">Homes</option>
                <option value="commercial">Commercial</option>
                <option value="upcoming">Upcoming</option>
                <option value="land">Land</option>
                <option value="leasing">Leasing</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="p-intent">Intent</Label>
              <select
                id="p-intent"
                value={form.intent}
                onChange={(e) => setForm((s) => ({ ...s, intent: e.target.value as LeadIntent }))}
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-xs font-semibold"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
                <option value="invest">Invest</option>
                <option value="lease">Lease</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="p-budget">Budget Bracket</Label>
              <select
                id="p-budget"
                value={form.budget_bracket}
                onChange={(e) => setForm((s) => ({ ...s, budget_bracket: e.target.value }))}
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-xs font-semibold"
              >
                <option value="under-50l">Under ₹50 L</option>
                <option value="50l-1cr">₹50 L – ₹1 Cr</option>
                <option value="1-3cr">₹1 – 3 Cr</option>
                <option value="3-10cr">₹3 – 10 Cr</option>
                <option value="10cr-plus">₹10 Cr+</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="p-specs">Specs</Label>
            <Input
              id="p-specs"
              value={form.specs}
              onChange={(e) => setForm((s) => ({ ...s, specs: e.target.value }))}
              placeholder="2,180 sq.ft · OC Received · 2 Parking"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="p-badge">Verification Badge</Label>
            <Input
              id="p-badge"
              value={form.verification_badge}
              onChange={(e) => setForm((s) => ({ ...s, verification_badge: e.target.value }))}
              placeholder="OC & Title Verified"
            />
          </div>
          <p className="text-[11px] text-ink/55">
            Will be attributed to <strong>{actor.name}</strong> ({actor.role}).
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={busy} className="rounded-xl bg-brand-red text-white shadow-red">
              Save Property
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export type CrmStageReasonModalProps = {
  open: boolean;
  leadName: string;
  targetStage: LeadStage;
  busy: boolean;
  onClose: () => void;
  onConfirm: (reason: StageReason) => void;
};

/** @deprecated Use CrmStageReasonModal */
export type CrmCloseLeadModalProps = CrmStageReasonModalProps;

export function CrmStageReasonModal({
  open,
  leadName,
  targetStage,
  busy,
  onClose,
  onConfirm,
}: CrmStageReasonModalProps) {
  const [reason, setReason] = useState<StageReason | "">("");
  const options = REASONS_BY_STAGE[targetStage] ?? [];
  const groups = useMemo(() => {
    const map = new Map<string, typeof options>();
    for (const option of options) {
      const list = map.get(option.group) ?? [];
      list.push(option);
      map.set(option.group, list);
    }
    return [...map.entries()];
  }, [options]);

  if (!open) return null;

  const stageLabel = STAGES.find((stage) => stage.id === targetStage)?.label ?? targetStage;
  const title = targetStage === "closed" ? "Close lead" : "Call outcome";
  const subtitle =
    targetStage === "closed"
      ? `Choose why ${leadName} is leaving the active pipeline.`
      : `How did the call with ${leadName} go? Retry outcomes stay on New with a follow-up.`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-border bg-white p-6 shadow-lift">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-ink/40 uppercase">{stageLabel}</p>
        <h2 className="mt-1 text-xl font-bold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-ink/60">{subtitle}</p>

        <div className="mt-5 max-h-[50vh] space-y-4 overflow-y-auto pr-1">
          {groups.map(([group, items]) => (
            <div key={group}>
              <Label className="text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase">
                {group}
              </Label>
              <div className="mt-2 grid gap-2">
                {items.map((item) => (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border px-3 py-2.5 text-sm hover:bg-cream"
                  >
                    <input
                      type="radio"
                      name="stage-reason"
                      className="mt-1"
                      checked={reason === item.id}
                      onChange={() => setReason(item.id)}
                    />
                    <span>
                      <span className="block font-semibold text-ink">{item.label}</span>
                      <span className="mt-0.5 block text-xs text-ink/55">{item.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || !reason}
            onClick={() => reason && onConfirm(reason)}
            className="rounded-xl bg-brand-red text-white shadow-red"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export const CrmCloseLeadModal = CrmStageReasonModal;
