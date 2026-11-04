import type { CrmLead, LeadIntent, LeadStage, ServicePillar } from "@/lib/crm-store";

export const STAGES: { id: LeadStage; num: string; label: string; color: string }[] = [
  { id: "new_enquiry", num: "01", label: "New Enquiry", color: "bg-brand-red text-white" },
  { id: "mandate_locked", num: "02", label: "Mandate Locked", color: "bg-amber-500 text-ink" },
  { id: "shortlist_shared", num: "03", label: "Shortlist Shared", color: "bg-sky-500 text-white" },
  { id: "site_visit_scheduled", num: "04", label: "Site Visit", color: "bg-indigo-500 text-white" },
  { id: "negotiation", num: "05", label: "Negotiation", color: "bg-purple-500 text-white" },
  { id: "paperwork_registry", num: "06", label: "Registry / Lease", color: "bg-emerald-600 text-white" },
  { id: "closed_won", num: "07", label: "Closed Won", color: "bg-emerald-500 text-ink" },
  { id: "lost_hold", num: "08", label: "On Hold / Lost", color: "bg-stone-500 text-white" },
];

export const BUDGET_LABELS: Record<string, string> = {
  "under-50l": "Under ₹50 L",
  "50l-1cr": "₹50 L – ₹1 Cr",
  "1-3cr": "₹1 – 3 Cr",
  "3-10cr": "₹3 – 10 Cr",
  "10cr-plus": "₹10 Cr+",
  unsure: "Flexible",
};

export const PILLAR_LABELS: Record<ServicePillar, string> = {
  homes: "Homes & Kothis",
  commercial: "Commercial",
  upcoming: "Upcoming",
  land: "Land Parcels",
  leasing: "Leasing",
};

export type FollowupStatus = "today" | "upcoming" | "missed";
export type FollowupBucket = "all" | FollowupStatus;
export type CrmNavId = "pipeline" | "followups" | "inventory" | "team" | "dashboard";

export function followupKey(lead: CrmLead) {
  return `${lead.id}:${lead.next_followup_at ?? ""}`;
}

export function followupStatusStyles(status: FollowupStatus) {
  if (status === "missed") {
    return {
      row: "bg-brand-red-soft/45",
      badge: "bg-brand-red text-white",
      text: "text-brand-red",
      label: "Missed",
    };
  }
  if (status === "today") {
    return {
      row: "bg-emerald-500/10",
      badge: "bg-emerald-600 text-white",
      text: "text-emerald-800",
      label: "Today",
    };
  }
  return {
    row: "bg-amber-400/15",
    badge: "bg-amber-500 text-ink",
    text: "text-amber-800",
    label: "Upcoming",
  };
}

export function cleanAdvisorName(name: string) {
  return name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
}

export function buildWhatsAppUrl(phone: string, leadName: string, pillar: ServicePillar, actorName: string) {
  const digits = phone.replace(/\D/g, "");
  const clean = digits.length === 10 ? `91${digits}` : digits;
  const advisor = cleanAdvisorName(actorName);
  const text = `Hi ${leadName}, ${advisor} here from RealtyCook. Following up on your ${PILLAR_LABELS[pillar]} enquiry — when would be a good time to connect?`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

export function formatShortDate(iso: string | null) {
  if (!iso) return "Not scheduled";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Not scheduled";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatSiteVisit(date: string | null | undefined, time?: string | null) {
  if (!date) return "Not scheduled";
  try {
    const d = new Date(`${date}T${time || "00:00"}:00`);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...(time ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
  } catch {
    return time ? `${date} · ${time}` : date;
  }
}

function endOfLocalDay(ms: number) {
  const d = new Date(ms);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function isFollowupOverdue(iso: string | null, nowMs: number | null) {
  if (!iso || nowMs === null) return false;
  return new Date(iso).getTime() < nowMs;
}

export function classifyFollowup(iso: string | null, nowMs: number | null): FollowupStatus | null {
  if (!iso || nowMs === null) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  if (t < nowMs) return "missed";
  if (t <= endOfLocalDay(nowMs)) return "today";
  return "upcoming";
}

export function normalizeIntent(v: unknown): LeadIntent {
  const s = String(v ?? "buy").trim().toLowerCase();
  if (s === "sell" || s === "invest" || s === "lease") return s;
  return "buy";
}

export function normalizePillar(v: unknown): ServicePillar {
  const s = String(v ?? "homes").trim().toLowerCase();
  if (s === "commercial" || s === "upcoming" || s === "land" || s === "leasing") return s;
  return "homes";
}

export function normalizeBudget(v: unknown): string {
  const s = String(v ?? "1-3cr").trim().toLowerCase().replace(/\s+/g, "");
  const map: Record<string, string> = {
    "under-50l": "under-50l",
    under50l: "under-50l",
    "50l-1cr": "50l-1cr",
    "1-3cr": "1-3cr",
    "3-10cr": "3-10cr",
    "10cr-plus": "10cr-plus",
    "10cr+": "10cr-plus",
    unsure: "unsure",
    flexible: "unsure",
  };
  return map[s] ?? "1-3cr";
}

export type BulkLeadRow = {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  intent?: LeadIntent;
  pillar?: ServicePillar;
  budget?: string;
  notes_summary?: string;
};
