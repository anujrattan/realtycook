"use client";

import {
  AlertCircle,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  GripVertical,
  Kanban,
  LayoutList,
  MapPin,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  CrmLead,
  CrmProperty,
  CrmStateSnapshot,
  CrmUser,
  LeadIntent,
  LeadStage,
  ServicePillar,
  UserRole,
} from "@/lib/crm-store";
import { cn } from "@/lib/utils";

const STAGES: { id: LeadStage; num: string; label: string; color: string }[] = [
  { id: "new_enquiry", num: "01", label: "New Enquiry", color: "bg-brand-red text-white" },
  { id: "mandate_locked", num: "02", label: "Mandate Locked", color: "bg-amber-500 text-ink" },
  { id: "shortlist_shared", num: "03", label: "Shortlist Shared", color: "bg-sky-500 text-white" },
  { id: "site_visit_scheduled", num: "04", label: "Site Visit", color: "bg-indigo-500 text-white" },
  { id: "negotiation", num: "05", label: "Negotiation", color: "bg-purple-500 text-white" },
  { id: "paperwork_registry", num: "06", label: "Registry / Lease", color: "bg-emerald-600 text-white" },
  { id: "closed_won", num: "07", label: "Closed Won", color: "bg-emerald-500 text-ink" },
  { id: "lost_hold", num: "08", label: "On Hold / Lost", color: "bg-stone-500 text-white" },
];

const BUDGET_LABELS: Record<string, string> = {
  "under-50l": "Under ₹50 L",
  "50l-1cr": "₹50 L – ₹1 Cr",
  "1-3cr": "₹1 – 3 Cr",
  "3-10cr": "₹3 – 10 Cr",
  "10cr-plus": "₹10 Cr+",
  unsure: "Flexible",
};

const PILLAR_LABELS: Record<ServicePillar, string> = {
  homes: "Homes & Kothis",
  commercial: "Commercial",
  upcoming: "Upcoming",
  land: "Land Parcels",
  leasing: "Leasing",
};

type FollowupBucket = "today" | "upcoming" | "missed";
type MainTab = "pipeline" | "followups" | "inventory" | "team" | "oversight";

function cleanAdvisorName(name: string) {
  return name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
}

function buildWhatsAppUrl(phone: string, leadName: string, pillar: ServicePillar, actorName: string) {
  const digits = phone.replace(/\D/g, "");
  const clean = digits.length === 10 ? `91${digits}` : digits;
  const advisor = cleanAdvisorName(actorName);
  const text = `Hi ${leadName}, ${advisor} here from RealtyCook. Following up on your ${PILLAR_LABELS[pillar]} enquiry — when would be a good time to connect?`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

function formatShortDate(iso: string | null) {
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

function formatSiteVisit(date: string | null | undefined, time?: string | null) {
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

function startOfLocalDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfLocalDay(ms: number) {
  const d = new Date(ms);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function isFollowupOverdue(iso: string | null, nowMs: number | null) {
  if (!iso || nowMs === null) return false;
  return new Date(iso).getTime() < nowMs;
}

function classifyFollowup(iso: string | null, nowMs: number | null): FollowupBucket | null {
  if (!iso || nowMs === null) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  if (t < nowMs && t < startOfLocalDay(nowMs)) return "missed";
  if (t < nowMs) return "missed";
  if (t <= endOfLocalDay(nowMs)) return "today";
  return "upcoming";
}

function normalizeIntent(v: unknown): LeadIntent {
  const s = String(v ?? "buy").trim().toLowerCase();
  if (s === "sell" || s === "invest" || s === "lease") return s;
  return "buy";
}

function normalizePillar(v: unknown): ServicePillar {
  const s = String(v ?? "homes").trim().toLowerCase();
  if (s === "commercial" || s === "upcoming" || s === "land" || s === "leasing") return s;
  return "homes";
}

function normalizeBudget(v: unknown): string {
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

export function CrmDashboard({ initialSnapshot }: { initialSnapshot: CrmStateSnapshot }) {
  const [snapshot, setSnapshot] = useState<CrmStateSnapshot>(initialSnapshot);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [actorId, setActorId] = useState<string>(initialSnapshot.users[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<MainTab>("pipeline");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [followupBucket, setFollowupBucket] = useState<FollowupBucket>("today");

  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<"all" | "mine" | "unassigned">("all");

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [followupInput, setFollowupInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dropStageId, setDropStageId] = useState<LeadStage | null>(null);

  const [followupPopup, setFollowupPopup] = useState<CrmLead | null>(null);
  const notifiedFollowups = useRef<Set<string>>(new Set());
  const daySnapshotShown = useRef(false);

  const [showNewLead, setShowNewLead] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [bulkPreviewCount, setBulkPreviewCount] = useState(0);
  const [bulkRows, setBulkRows] = useState<
    Array<{
      name: string;
      phone: string;
      email?: string;
      city?: string;
      intent?: LeadIntent;
      pillar?: ServicePillar;
      budget?: string;
      notes_summary?: string;
    }>
  >([]);

  const [newLeadForm, setNewLeadForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    intent: "buy" as LeadIntent,
    pillar: "homes" as ServicePillar,
    budget: "1-3cr",
    message: "",
  });

  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "sales" as UserRole,
    designation: "Sales Advisor",
  });

  const [propertyForm, setPropertyForm] = useState({
    title: "",
    pillar: "homes" as ServicePillar,
    intent: "buy" as LeadIntent,
    locality: "",
    price_label: "",
    budget_bracket: "1-3cr",
    specs: "",
    verification_badge: "Ground Verified",
  });

  const [siteVisitDate, setSiteVisitDate] = useState("");
  const [siteVisitTime, setSiteVisitTime] = useState("");
  const [siteVisitProperty, setSiteVisitProperty] = useState("");

  const actor: CrmUser = useMemo(
    () => snapshot.users.find((u) => u.id === actorId) ?? snapshot.users[0],
    [snapshot.users, actorId],
  );

  const assignableUsers = useMemo(() => {
    if (!actor) return [];
    if (actor.role === "sales") return snapshot.users.filter((u) => u.role === "sales");
    return snapshot.users;
  }, [snapshot.users, actor]);

  const filteredLeads = useMemo(() => {
    return snapshot.leads.filter((lead) => {
      if (assigneeFilter === "mine" && lead.assigned_to !== actor?.id) return false;
      if (assigneeFilter === "unassigned" && lead.assigned_to !== null) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          lead.name.toLowerCase().includes(q) ||
          lead.phone.includes(q) ||
          lead.city.toLowerCase().includes(q) ||
          lead.notes_summary.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [snapshot.leads, assigneeFilter, search, actor]);

  const myFollowups = useMemo(() => {
    if (!actor || nowMs === null) return { today: [] as CrmLead[], upcoming: [] as CrmLead[], missed: [] as CrmLead[] };
    const scoped =
      actor.role === "superadmin"
        ? snapshot.leads
        : snapshot.leads.filter((l) => l.assigned_to === actor.id);

    const today: CrmLead[] = [];
    const upcoming: CrmLead[] = [];
    const missed: CrmLead[] = [];

    for (const lead of scoped) {
      const bucket = classifyFollowup(lead.next_followup_at, nowMs);
      if (bucket === "today") today.push(lead);
      else if (bucket === "upcoming") upcoming.push(lead);
      else if (bucket === "missed") missed.push(lead);
    }

    const byTime = (a: CrmLead, b: CrmLead) =>
      new Date(a.next_followup_at ?? 0).getTime() - new Date(b.next_followup_at ?? 0).getTime();

    return {
      today: today.sort(byTime),
      upcoming: upcoming.sort(byTime),
      missed: missed.sort(byTime),
    };
  }, [snapshot.leads, actor, nowMs]);

  const selectedLead: CrmLead | null = useMemo(
    () => snapshot.leads.find((l) => l.id === selectedLeadId) ?? null,
    [snapshot.leads, selectedLeadId],
  );

  const selectedLeadComments = useMemo(
    () => snapshot.comments.filter((c) => c.lead_id === selectedLeadId),
    [snapshot.comments, selectedLeadId],
  );

  const matchedProperties = useMemo(() => {
    if (!selectedLead) return snapshot.properties;
    return snapshot.properties.filter(
      (p) => p.pillar === selectedLead.pillar || p.budget_bracket === selectedLead.budget,
    );
  }, [snapshot.properties, selectedLead]);

  const recentActivity = useMemo(
    () =>
      [...snapshot.comments]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 25),
    [snapshot.comments],
  );

  useEffect(() => {
    setNowMs(Date.now());
    const tick = window.setInterval(() => setNowMs(Date.now()), 30_000);
    try {
      const saved = window.localStorage.getItem("rc_crm_snapshot_v2");
      if (saved) {
        const parsed = JSON.parse(saved) as CrmStateSnapshot;
        if (parsed?.users?.length && parsed?.leads?.length) setSnapshot(parsed);
      }
    } catch {
      // ignore
    }
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!selectedLead) return;
    setSiteVisitDate(selectedLead.site_visit_date ?? "");
    setSiteVisitTime(selectedLead.site_visit_time ?? "");
    setSiteVisitProperty(selectedLead.site_visit_property ?? "");
  }, [selectedLead?.id, selectedLead?.site_visit_date, selectedLead?.site_visit_time, selectedLead?.site_visit_property]);

  useEffect(() => {
    if (!selectedLeadId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedLeadId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedLeadId]);

  // Morning day snapshot + timed follow-up popups for the logged-in user
  useEffect(() => {
    if (!actor || nowMs === null) return;

    if (!daySnapshotShown.current && myFollowups.today.length + myFollowups.missed.length > 0) {
      daySnapshotShown.current = true;
      const first = myFollowups.missed[0] ?? myFollowups.today[0];
      if (first) setFollowupPopup(first);
    }

    for (const lead of [...myFollowups.today, ...myFollowups.missed]) {
      if (!lead.next_followup_at) continue;
      const due = new Date(lead.next_followup_at).getTime();
      const key = `${lead.id}:${lead.next_followup_at}`;
      if (due <= nowMs && !notifiedFollowups.current.has(key)) {
        notifiedFollowups.current.add(key);
        setFollowupPopup(lead);
        break;
      }
    }
  }, [actor, nowMs, myFollowups]);

  function saveLocalSnapshot(next: CrmStateSnapshot) {
    setSnapshot(next);
    try {
      window.localStorage.setItem("rc_crm_snapshot_v2", JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function applyLocalFallbackAction(body: Record<string, unknown>): boolean {
    const action = String(body.action ?? "");
    const now = new Date().toISOString();

    if (action === "create_lead") {
      const name = String(body.name ?? "").trim();
      const phone = String(body.phone ?? "").replace(/\D/g, "");
      if (name.length < 2 || phone.length < 10) {
        setBannerError("Name and a valid 10-digit phone number are required.");
        return false;
      }
      const newLead: CrmLead = {
        id: `lead-${Date.now()}`,
        name,
        phone: phone.length === 10 ? `91${phone}` : phone,
        email: String(body.email ?? "").trim(),
        city: String(body.city ?? "").trim(),
        intent: (body.intent as LeadIntent) ?? "buy",
        pillar: (body.pillar as ServicePillar) ?? "homes",
        budget: String(body.budget ?? "1-3cr"),
        stage: "new_enquiry",
        source: String(body.source ?? "Direct Entry"),
        assigned_to: body.assignedTo ? String(body.assignedTo) : null,
        next_followup_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        site_visit_date: null,
        site_visit_time: null,
        site_visit_property: null,
        notes_summary: String(body.message ?? "New enquiry logged.").trim(),
        created_at: now,
        updated_at: now,
      };
      saveLocalSnapshot({ ...snapshot, leads: [newLead, ...snapshot.leads] });
      return true;
    }

    if (action === "bulk_create_leads") {
      const rows = Array.isArray(body.leads) ? body.leads : [];
      const created: CrmLead[] = [];
      for (const row of rows as Array<Record<string, unknown>>) {
        const name = String(row.name ?? "").trim();
        const phone = String(row.phone ?? "").replace(/\D/g, "");
        if (name.length < 2 || phone.length < 10) continue;
        created.push({
          id: `lead-${Date.now()}-${created.length}`,
          name,
          phone: phone.length === 10 ? `91${phone}` : phone,
          email: String(row.email ?? "").trim(),
          city: String(row.city ?? "").trim(),
          intent: normalizeIntent(row.intent),
          pillar: normalizePillar(row.pillar),
          budget: normalizeBudget(row.budget),
          stage: "new_enquiry",
          source: `Excel Upload (${actor.name})`,
          assigned_to: actor.role === "sales" ? actor.id : null,
          next_followup_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
          site_visit_date: null,
          site_visit_time: null,
          site_visit_property: null,
          notes_summary: String(row.notes_summary ?? "Imported via Excel Bulk Upload"),
          created_at: now,
          updated_at: now,
        });
      }
      if (!created.length) {
        setBannerError("No valid leads found in uploaded sheet.");
        return false;
      }
      saveLocalSnapshot({ ...snapshot, leads: [...created, ...snapshot.leads] });
      setBannerSuccess(`Imported ${created.length} leads from Excel.`);
      return true;
    }

    if (action === "add_property") {
      const title = String(body.title ?? "").trim();
      const locality = String(body.locality ?? "").trim();
      const price_label = String(body.price_label ?? "").trim();
      if (title.length < 3 || locality.length < 2 || !price_label) {
        setBannerError("Property title, locality, and price are required.");
        return false;
      }
      const prop: CrmProperty = {
        id: `prop-${Date.now()}`,
        title,
        pillar: (body.pillar as ServicePillar) ?? "homes",
        intent: (body.intent as LeadIntent) ?? "buy",
        locality,
        price_label,
        budget_bracket: String(body.budget_bracket ?? "1-3cr"),
        specs: String(body.specs ?? "").trim() || "Verified RealtyCook Mandate",
        verification_badge: String(body.verification_badge ?? "Ground Verified").trim(),
        added_by_id: actor.id,
        added_by_name: actor.name,
        added_by_role: actor.role,
        created_at: now,
        active: true,
      };
      saveLocalSnapshot({ ...snapshot, properties: [prop, ...snapshot.properties] });
      return true;
    }

    if (action === "assign_lead") {
      const targetUserId = body.targetUserId ? String(body.targetUserId) : null;
      if (actor.role === "sales") {
        const target = snapshot.users.find((u) => u.id === targetUserId);
        if (!target || target.role !== "sales") {
          setBannerError("Sales accounts can only assign leads to themselves or other Sales accounts.");
          return false;
        }
      }
      const leadId = String(body.leadId ?? "");
      saveLocalSnapshot({
        ...snapshot,
        leads: snapshot.leads.map((l) =>
          l.id === leadId ? { ...l, assigned_to: targetUserId, updated_at: now } : l,
        ),
      });
      return true;
    }

    if (action === "update_stage") {
      const leadId = String(body.leadId ?? "");
      const stage = body.stage as LeadStage | undefined;
      saveLocalSnapshot({
        ...snapshot,
        leads: snapshot.leads.map((l) => {
          if (l.id !== leadId) return l;
          const next = {
            ...l,
            stage: stage ?? l.stage,
            next_followup_at:
              body.nextFollowupAt !== undefined
                ? (body.nextFollowupAt as string | null)
                : l.next_followup_at,
            site_visit_date:
              body.siteVisitDate !== undefined
                ? (body.siteVisitDate as string | null)
                : l.site_visit_date,
            site_visit_time:
              body.siteVisitTime !== undefined
                ? (body.siteVisitTime as string | null)
                : l.site_visit_time,
            site_visit_property:
              body.siteVisitProperty !== undefined
                ? (body.siteVisitProperty as string | null)
                : l.site_visit_property,
            updated_at: now,
          };
          return next;
        }),
        comments:
          body.siteVisitDate
            ? [
                {
                  id: `c-${Date.now()}`,
                  lead_id: leadId,
                  author_id: actor.id,
                  author_name: actor.name,
                  author_role: actor.role,
                  body: `Scheduled Site Visit on ${String(body.siteVisitDate)}${
                    body.siteVisitTime ? ` at ${String(body.siteVisitTime)}` : " (time flexible)"
                  }${body.siteVisitProperty ? ` for ${String(body.siteVisitProperty)}` : ""}.`,
                  followup_scheduled_for: null,
                  created_at: now,
                },
                ...snapshot.comments,
              ]
            : stage
              ? [
                  {
                    id: `c-${Date.now()}`,
                    lead_id: leadId,
                    author_id: actor.id,
                    author_name: actor.name,
                    author_role: actor.role,
                    body: `Moved stage → ${String(stage).replace(/_/g, " ")}.`,
                    followup_scheduled_for: null,
                    created_at: now,
                  },
                  ...snapshot.comments,
                ]
              : snapshot.comments,
      });
      return true;
    }

    if (action === "add_comment") {
      const leadId = String(body.leadId ?? "");
      const text = String(body.body ?? "").trim();
      if (!text) return false;
      const nextFollowupAt = body.nextFollowupAt ? String(body.nextFollowupAt) : null;
      saveLocalSnapshot({
        ...snapshot,
        comments: [
          {
            id: `c-${Date.now()}`,
            lead_id: leadId,
            author_id: actor.id,
            author_name: actor.name,
            author_role: actor.role,
            body: text,
            followup_scheduled_for: nextFollowupAt,
            created_at: now,
          },
          ...snapshot.comments,
        ],
        leads: snapshot.leads.map((l) =>
          l.id === leadId
            ? {
                ...l,
                notes_summary: text,
                next_followup_at: nextFollowupAt ?? l.next_followup_at,
                updated_at: now,
              }
            : l,
        ),
      });
      return true;
    }

    if (action === "add_user") {
      if (actor.role === "sales") {
        setBannerError("Sales accounts do not have permission to add users.");
        return false;
      }
      const role = (body.role as UserRole) ?? "sales";
      if (actor.role === "admin" && role === "superadmin") {
        setBannerError("Only Superadmin can create another Superadmin.");
        return false;
      }
      saveLocalSnapshot({
        ...snapshot,
        users: [
          ...snapshot.users,
          {
            id: `user-${Date.now()}`,
            name: String(body.name ?? "").trim(),
            email: String(body.email ?? "").trim().toLowerCase(),
            phone: String(body.phone ?? "").replace(/\D/g, ""),
            role,
            designation: String(body.designation ?? "Sales Advisor").trim(),
            active: true,
            created_at: now,
          },
        ],
      });
      return true;
    }

    if (action === "remove_user") {
      const targetId = String(body.targetUserId ?? "");
      const target = snapshot.users.find((u) => u.id === targetId);
      if (!target) return false;
      if (
        actor.role === "sales" ||
        target.role === "superadmin" ||
        (actor.role === "admin" && target.role !== "sales")
      ) {
        setBannerError("You do not have permission to remove this user.");
        return false;
      }
      saveLocalSnapshot({
        ...snapshot,
        users: snapshot.users.filter((u) => u.id !== targetId),
        leads: snapshot.leads.map((l) => (l.assigned_to === targetId ? { ...l, assigned_to: null } : l)),
      });
      return true;
    }

    return false;
  }

  async function refreshSnapshot() {
    setBusy(true);
    setBannerError(null);
    try {
      const res = await fetch("/api/crm", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as CrmStateSnapshot;
        saveLocalSnapshot(data);
      }
    } catch {
      // static edge fallback
    } finally {
      setBusy(false);
    }
  }

  async function postCrmAction(body: Record<string, unknown>) {
    setBusy(true);
    setBannerError(null);
    setBannerSuccess(null);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, actorId: actor.id }),
      });
      if (res.status === 404 || res.status === 405) {
        return applyLocalFallbackAction(body);
      }
      const data = await res.json();
      if (!res.ok) {
        setBannerError(data.error ?? "Action not permitted.");
        return false;
      }
      if (data.snapshot) saveLocalSnapshot(data.snapshot as CrmStateSnapshot);
      if (typeof data.importedCount === "number") {
        setBannerSuccess(`Imported ${data.importedCount} leads from Excel.`);
      }
      return true;
    } catch {
      return applyLocalFallbackAction(body);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLead || !commentText.trim()) return;
    const isoFollowup = followupInput ? new Date(followupInput).toISOString() : null;
    const ok = await postCrmAction({
      action: "add_comment",
      leadId: selectedLead.id,
      body: commentText,
      nextFollowupAt: isoFollowup,
    });
    if (ok) {
      setCommentText("");
      setFollowupInput("");
    }
  }

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    const ok = await postCrmAction({
      action: "create_lead",
      ...newLeadForm,
      assignedTo: actor.role === "sales" ? actor.id : null,
      source: `Manual (${actor.name})`,
    });
    if (ok) {
      setShowNewLead(false);
      setNewLeadForm({
        name: "",
        phone: "",
        email: "",
        city: "",
        intent: "buy",
        pillar: "homes",
        budget: "1-3cr",
        message: "",
      });
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    const ok = await postCrmAction({ action: "add_user", ...newUserForm });
    if (ok) {
      setNewUserForm({
        name: "",
        email: "",
        phone: "",
        role: "sales",
        designation: "Sales Advisor",
      });
    }
  }

  async function handleAddProperty(e: React.FormEvent) {
    e.preventDefault();
    const ok = await postCrmAction({ action: "add_property", ...propertyForm });
    if (ok) {
      setShowAddProperty(false);
      setPropertyForm({
        title: "",
        pillar: "homes",
        intent: "buy",
        locality: "",
        price_label: "",
        budget_bracket: "1-3cr",
        specs: "",
        verification_badge: "Ground Verified",
      });
    }
  }

  async function handleSaveSiteVisit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLead) return;
    if (!siteVisitDate.trim()) {
      setBannerError("Site visit date is mandatory.");
      return;
    }
    const ok = await postCrmAction({
      action: "update_stage",
      leadId: selectedLead.id,
      stage: "site_visit_scheduled",
      siteVisitDate: siteVisitDate.trim(),
      siteVisitTime: siteVisitTime.trim() || null,
      siteVisitProperty: siteVisitProperty.trim() || null,
    });
    if (ok) setBannerSuccess("Site visit schedule saved.");
  }

  async function handleStageDrop(targetStage: LeadStage) {
    if (!draggingLeadId) return;
    const lead = snapshot.leads.find((l) => l.id === draggingLeadId);
    setDraggingLeadId(null);
    setDropStageId(null);
    if (!lead || lead.stage === targetStage) return;
    await postCrmAction({
      action: "update_stage",
      leadId: lead.id,
      stage: targetStage,
    });
    setSelectedLeadId(lead.id);
  }

  function parseExcelFile(file: File) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
        const rows = json
          .map((row) => {
            const pick = (...keys: string[]) => {
              for (const k of keys) {
                const found = Object.entries(row).find(([rk]) => rk.trim().toLowerCase() === k);
                if (found && String(found[1]).trim()) return String(found[1]).trim();
              }
              return "";
            };
            return {
              name: pick("name", "client name", "client", "full name"),
              phone: pick("phone", "mobile", "whatsapp", "contact"),
              email: pick("email", "mail"),
              city: pick("city", "sector", "locality", "location"),
              intent: normalizeIntent(pick("intent", "requirement")),
              pillar: normalizePillar(pick("pillar", "service", "category")),
              budget: normalizeBudget(pick("budget", "budget bracket")),
              notes_summary: pick("notes", "message", "remarks", "requirement details"),
            };
          })
          .filter((r) => r.name.length >= 2 && r.phone.replace(/\D/g, "").length >= 10);
        setBulkRows(rows);
        setBulkPreviewCount(rows.length);
        if (!rows.length) setBannerError("No valid rows found. Need Name + Phone columns.");
      } catch {
        setBannerError("Could not parse that Excel file. Use .xlsx / .xls / .csv.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleBulkImport() {
    if (!bulkRows.length) return;
    const ok = await postCrmAction({ action: "bulk_create_leads", leads: bulkRows });
    if (ok) {
      setShowBulkUpload(false);
      setBulkRows([]);
      setBulkPreviewCount(0);
      setActiveTab("pipeline");
    }
  }

  const followupQueue = myFollowups[followupBucket];

  return (
    <div className="min-h-svh bg-cream text-ink">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="shrink-0" aria-label="Back to RealtyCook website">
              <Logo className="h-11" />
            </Link>
            <div className="hidden h-6 w-px bg-border sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-ink">RealtyCook CRM</span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase",
                    snapshot.storageMode === "supabase"
                      ? "bg-emerald-500/15 text-emerald-800"
                      : "bg-gold-soft text-ink",
                  )}
                >
                  {snapshot.storageMode === "supabase" ? "Supabase Connected" : "Local Server Store (.env Ready)"}
                </span>
              </div>
              <p className="text-xs text-ink/55">
                Drag-and-drop Pipeline · Follow-Up Desk · Site Visit Scheduler · Excel Bulk Upload
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-cream px-3 py-1.5">
              <Shield className="size-4 text-brand-red" />
              <span className="text-xs font-medium text-ink/60">Acting as:</span>
              <select
                aria-label="Switch active CRM user account"
                value={actor?.id ?? ""}
                onChange={(e) => {
                  setActorId(e.target.value);
                  daySnapshotShown.current = false;
                }}
                className="bg-transparent text-xs font-semibold text-ink focus:outline-none"
              >
                {snapshot.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.toUpperCase()} — {u.designation})
                  </option>
                ))}
              </select>
            </div>

            <Button variant="outline" size="sm" onClick={refreshSnapshot} disabled={busy} className="h-9 rounded-xl bg-white">
              <RefreshCw className={cn("size-3.5", busy && "animate-spin")} />
              <span>Sync</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkUpload(true)}
              className="h-9 rounded-xl bg-white"
            >
              <Upload className="size-3.5" />
              <span>Bulk Upload</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setShowNewLead(true)}
              className="h-9 rounded-xl bg-brand-red text-white shadow-red hover:bg-brand-red-deep"
            >
              <Plus className="size-4" />
              <span>New Lead</span>
            </Button>
          </div>
        </div>

        <div className="border-t border-border/70 bg-cream/65">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-5 py-2">
            <div className="flex flex-wrap items-center gap-1">
              {(
                [
                  { id: "pipeline" as const, label: `Lead Pipeline (${snapshot.leads.length})`, icon: Kanban },
                  {
                    id: "followups" as const,
                    label: `Follow-Ups (${myFollowups.today.length + myFollowups.missed.length})`,
                    icon: CalendarClock,
                  },
                  {
                    id: "inventory" as const,
                    label: `Verified Inventory (${snapshot.properties.length})`,
                    icon: Building2,
                  },
                  { id: "team" as const, label: `Team & Roles (${snapshot.users.length})`, icon: Users },
                  ...(actor?.role === "superadmin"
                    ? [
                        {
                          id: "oversight" as const,
                          label: `Superadmin Desk (${myFollowups.missed.length} missed)`,
                          icon: Shield,
                        },
                      ]
                    : []),
                ] as const
              ).map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
                      active ? "bg-ink text-white shadow-2xs" : "text-ink/65 hover:bg-ink/5 hover:text-ink",
                    )}
                  >
                    <Icon className={cn("size-3.5", active ? "text-brand-red" : "text-ink/45")} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-xs text-ink/65">
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase",
                  actor?.role === "superadmin"
                    ? "bg-brand-red text-white"
                    : actor?.role === "admin"
                      ? "bg-ink text-gold"
                      : "bg-emerald-600/15 text-emerald-800",
                )}
              >
                {actor?.role}
              </span>
              <span>
                {actor?.role === "superadmin" && "Full system access · Oversight of all leads, activity & missed follow-ups"}
                {actor?.role === "admin" && "Can add/remove Sales accounts & assign leads to any Sales advisor"}
                {actor?.role === "sales" && "Assign to self/sales · Log notes · Schedule site visits & follow-ups"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {(bannerError || bannerSuccess) && (
        <div className="mx-auto mt-4 max-w-[1600px] px-5">
          <div
            className={cn(
              "flex items-center justify-between rounded-2xl border px-4 py-3 text-xs font-semibold",
              bannerError
                ? "border-brand-red/30 bg-brand-red-soft text-brand-red-deep"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-900",
            )}
          >
            <span className="flex items-center gap-2">
              {bannerError ? <AlertCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
              {bannerError ?? bannerSuccess}
            </span>
            <button
              type="button"
              onClick={() => {
                setBannerError(null);
                setBannerSuccess(null);
              }}
              className="underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1600px] px-5 py-6">
        {/* PIPELINE — full-width board/table; lead details open in popup */}
        {activeTab === "pipeline" && (
          <div className="min-w-0">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-3 shadow-soft">
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <div className="relative min-w-[220px] flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink/40" />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search client name, phone, sector or notes…"
                      className="h-9 w-full rounded-xl border border-border bg-cream/50 pr-3 pl-9 text-xs text-ink placeholder:text-ink/45 focus:border-brand-red focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1 rounded-xl bg-cream p-1">
                    {(
                      [
                        { id: "all", label: "All Leads" },
                        { id: "mine", label: "Assigned to Me" },
                        { id: "unassigned", label: "Unassigned" },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setAssigneeFilter(f.id)}
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                          assigneeFilter === f.id ? "bg-brand-red text-white" : "text-ink/60 hover:text-ink",
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 rounded-xl border border-border bg-cream p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("kanban")}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold",
                      viewMode === "kanban" ? "bg-white text-ink shadow-2xs" : "text-ink/55",
                    )}
                  >
                    <Kanban className="size-3.5" /> Board
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold",
                      viewMode === "list" ? "bg-white text-ink shadow-2xs" : "text-ink/55",
                    )}
                  >
                    <LayoutList className="size-3.5" /> Table
                  </button>
                </div>
              </div>

              {viewMode === "kanban" && (
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {STAGES.slice(0, 7).map((stage) => {
                    const stageLeads = filteredLeads.filter((l) => l.stage === stage.id);
                    const isDropTarget = dropStageId === stage.id;
                    return (
                      <div
                        key={stage.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDropStageId(stage.id);
                        }}
                        onDragLeave={() => setDropStageId((s) => (s === stage.id ? null : s))}
                        onDrop={(e) => {
                          e.preventDefault();
                          void handleStageDrop(stage.id);
                        }}
                        className={cn(
                          "flex w-[275px] shrink-0 flex-col rounded-2xl border p-3 transition-colors",
                          isDropTarget
                            ? "border-brand-red bg-brand-red-soft/40"
                            : "border-border/80 bg-cream-2/55",
                        )}
                      >
                        <div className="mb-3 flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <span className={cn("rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold", stage.color)}>
                              {stage.num}
                            </span>
                            <h3 className="text-xs font-bold text-ink">{stage.label}</h3>
                          </div>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-ink/65">
                            {stageLeads.length}
                          </span>
                        </div>

                        <div className="min-h-[120px] space-y-2.5">
                          {stageLeads.map((lead) => {
                            const assignee = snapshot.users.find((u) => u.id === lead.assigned_to);
                            const isSelected = lead.id === selectedLeadId;
                            const overdue = isFollowupOverdue(lead.next_followup_at, nowMs);
                            return (
                              <div
                                key={lead.id}
                                draggable
                                onDragStart={() => setDraggingLeadId(lead.id)}
                                onDragEnd={() => {
                                  setDraggingLeadId(null);
                                  setDropStageId(null);
                                }}
                                onClick={() => setSelectedLeadId(lead.id)}
                                className={cn(
                                  "cursor-grab rounded-2xl border bg-white p-3.5 transition-all hover:shadow-soft active:cursor-grabbing",
                                  isSelected ? "border-brand-red ring-2 ring-brand-red/20" : "border-border",
                                  draggingLeadId === lead.id && "opacity-50",
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-1.5">
                                    <GripVertical className="mt-0.5 size-3.5 shrink-0 text-ink/30" />
                                    <div>
                                      <p className="text-sm font-semibold text-ink">{lead.name}</p>
                                      <p className="text-[11px] text-ink/55">{lead.city || "Location pending"}</p>
                                    </div>
                                  </div>
                                  <span className="rounded-md bg-cream px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-red">
                                    {lead.intent} · {lead.pillar}
                                  </span>
                                </div>

                                <p className="mt-2 line-clamp-2 text-xs text-ink/70">
                                  {lead.notes_summary || "No conversation notes yet."}
                                </p>

                                {lead.stage === "site_visit_scheduled" && lead.site_visit_date && (
                                  <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">
                                    <MapPin className="size-3" />
                                    Visit: {formatSiteVisit(lead.site_visit_date, lead.site_visit_time)}
                                  </p>
                                )}

                                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/70 pt-2.5 text-[11px]">
                                  <span className="font-semibold text-ink/75 tabular-nums">
                                    {BUDGET_LABELS[lead.budget] ?? lead.budget}
                                  </span>
                                  <span
                                    className={cn(
                                      "truncate rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                      assignee ? "bg-ink/8 text-ink" : "bg-amber-500/15 text-amber-800",
                                    )}
                                  >
                                    {assignee ? assignee.name.split(" ")[0] : "Unassigned"}
                                  </span>
                                </div>

                                <div className="mt-2.5 flex items-center justify-between gap-2 pt-1">
                                  <span
                                    className={cn(
                                      "flex items-center gap-1 text-[10px] font-medium",
                                      overdue ? "font-semibold text-brand-red" : "text-ink/55",
                                    )}
                                  >
                                    <Clock className="size-3" />
                                    {formatShortDate(lead.next_followup_at)}
                                  </span>
                                  <a
                                    href={buildWhatsAppUrl(lead.phone, lead.name, lead.pillar, actor.name)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 rounded-full bg-[#25D366] px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-[#1ebe5d]"
                                  >
                                    <MessageCircle className="size-3 fill-white" />
                                    WhatsApp
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                          {stageLeads.length === 0 && (
                            <p className="rounded-xl border border-dashed border-border/80 p-4 text-center text-[11px] text-ink/40">
                              Drop leads here
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {viewMode === "list" && (
                <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-soft">
                  <table className="w-full min-w-[740px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-cream/60 text-[11px] font-semibold tracking-wider text-ink/55 uppercase">
                        <th className="p-3.5">Client</th>
                        <th className="p-3.5">Requirement</th>
                        <th className="p-3.5">Stage</th>
                        <th className="p-3.5">Assigned To</th>
                        <th className="p-3.5">Next Follow-Up</th>
                        <th className="p-3.5 text-right">WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => {
                        const assignee = snapshot.users.find((u) => u.id === lead.assigned_to);
                        const stageObj = STAGES.find((s) => s.id === lead.stage) ?? STAGES[0];
                        const overdue = isFollowupOverdue(lead.next_followup_at, nowMs);
                        return (
                          <tr
                            key={lead.id}
                            onClick={() => setSelectedLeadId(lead.id)}
                            className={cn(
                              "cursor-pointer border-b border-border/60 transition-colors hover:bg-cream/50",
                              selectedLeadId === lead.id && "bg-brand-red-soft/35",
                            )}
                          >
                            <td className="p-3.5">
                              <p className="font-semibold text-ink">{lead.name}</p>
                              <p className="text-ink/55 tabular-nums">+{lead.phone}</p>
                            </td>
                            <td className="p-3.5">
                              <span className="font-semibold uppercase text-brand-red">
                                {lead.intent} · {PILLAR_LABELS[lead.pillar]}
                              </span>
                              <p className="text-ink/60">
                                {BUDGET_LABELS[lead.budget] ?? lead.budget} · {lead.city || "Any sector"}
                              </p>
                            </td>
                            <td className="p-3.5">
                              <span className={cn("rounded-md px-2 py-1 text-[10px] font-bold", stageObj.color)}>
                                {stageObj.num} {stageObj.label}
                              </span>
                            </td>
                            <td className="p-3.5 font-medium text-ink">
                              {assignee ? `${assignee.name} (${assignee.role})` : "Unassigned"}
                            </td>
                            <td className={cn("p-3.5 tabular-nums", overdue ? "font-semibold text-brand-red" : "text-ink/75")}>
                              {formatShortDate(lead.next_followup_at)}
                            </td>
                            <td className="p-3.5 text-right">
                              <a
                                href={buildWhatsAppUrl(lead.phone, lead.name, lead.pillar, actor.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1ebe5d]"
                              >
                                <MessageCircle className="size-3.5 fill-white" />
                                WhatsApp
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}

        {/* HubSpot-style Lead Record Popup */}
        {selectedLead && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px] sm:p-8"
            onClick={() => setSelectedLeadId(null)}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="lead-record-title"
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[min(920px,92vh)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-lift"
            >
              {/* Record header */}
              <div className="shrink-0 border-b border-border px-8 py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-red font-heading text-lg font-bold text-white">
                      {selectedLead.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold tracking-[0.14em] text-ink/45 uppercase">Lead record</p>
                      <h2 id="lead-record-title" className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                        {selectedLead.name}
                      </h2>
                      <p className="mt-1.5 text-sm text-ink/60">
                        <span className="tabular-nums">+{selectedLead.phone}</span>
                        <span className="mx-2 text-ink/25">·</span>
                        {selectedLead.city || "Location flexible"}
                        {selectedLead.email ? (
                          <>
                            <span className="mx-2 text-ink/25">·</span>
                            {selectedLead.email}
                          </>
                        ) : null}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-brand-red-soft px-3 py-1 text-[11px] font-semibold uppercase text-brand-red-deep">
                          {selectedLead.intent}
                        </span>
                        <span className="rounded-full bg-cream px-3 py-1 text-[11px] font-semibold text-ink/70">
                          {PILLAR_LABELS[selectedLead.pillar]}
                        </span>
                        <span className="rounded-full bg-cream px-3 py-1 text-[11px] font-semibold text-ink/70">
                          {BUDGET_LABELS[selectedLead.budget] ?? selectedLead.budget}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={buildWhatsAppUrl(selectedLead.phone, selectedLead.name, selectedLead.pillar, actor.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5d]"
                    >
                      <MessageCircle className="size-4 fill-white" />
                      WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={() => setSelectedLeadId(null)}
                      aria-label="Close lead record"
                      className="inline-flex size-10 items-center justify-center rounded-full border border-border text-ink/50 transition-colors hover:bg-cream hover:text-ink"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Record body — two calm columns */}
              <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[0.92fr_1.08fr]">
                {/* About column */}
                <div className="overflow-y-auto border-b border-border px-8 py-8 lg:border-r lg:border-b-0">
                  <h3 className="text-sm font-bold text-ink">About this lead</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink/55">
                    Update stage and ownership here. Keep notes and follow-ups on the right.
                  </p>

                  <div className="mt-8 space-y-7">
                    <div>
                      <Label className="text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase">
                        Pipeline stage
                      </Label>
                      <select
                        value={selectedLead.stage}
                        onChange={(e) =>
                          postCrmAction({
                            action: "update_stage",
                            leadId: selectedLead.id,
                            stage: e.target.value as LeadStage,
                          })
                        }
                        className="mt-2 h-11 w-full rounded-2xl border border-border bg-cream/40 px-3.5 text-sm font-semibold text-ink focus:border-brand-red focus:outline-none"
                      >
                        {STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.num} · {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <Label className="text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase">
                          Owner
                        </Label>
                        {actor.role === "sales" && selectedLead.assigned_to !== actor.id && (
                          <button
                            type="button"
                            onClick={() =>
                              postCrmAction({
                                action: "assign_lead",
                                leadId: selectedLead.id,
                                targetUserId: actor.id,
                              })
                            }
                            className="text-xs font-semibold text-brand-red hover:underline"
                          >
                            Assign to me
                          </button>
                        )}
                      </div>
                      <select
                        value={selectedLead.assigned_to ?? ""}
                        onChange={(e) =>
                          postCrmAction({
                            action: "assign_lead",
                            leadId: selectedLead.id,
                            targetUserId: e.target.value || null,
                          })
                        }
                        className="mt-2 h-11 w-full rounded-2xl border border-border bg-cream/40 px-3.5 text-sm font-semibold text-ink focus:border-brand-red focus:outline-none"
                      >
                        {actor.role !== "sales" && <option value="">Unassigned</option>}
                        {assignableUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} · {u.designation}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase">Next follow-up</p>
                      <p
                        className={cn(
                          "mt-2 text-base font-semibold",
                          isFollowupOverdue(selectedLead.next_followup_at, nowMs)
                            ? "text-brand-red"
                            : "text-ink",
                        )}
                      >
                        {formatShortDate(selectedLead.next_followup_at)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase">Latest note</p>
                      <p className="mt-2 text-sm leading-relaxed text-ink/75">
                        {selectedLead.notes_summary || "No conversation notes yet."}
                      </p>
                    </div>

                    {selectedLead.stage === "site_visit_scheduled" && (
                      <form
                        onSubmit={handleSaveSiteVisit}
                        className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-5"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4 text-indigo-700" />
                          <p className="text-sm font-bold text-indigo-950">Site visit</p>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-indigo-900/65">
                          Date is required. Leave time blank if the slot is flexible.
                        </p>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="sv-date" className="text-[11px] font-semibold text-indigo-900/55 uppercase">
                              Date *
                            </Label>
                            <input
                              id="sv-date"
                              type="date"
                              required
                              value={siteVisitDate}
                              onChange={(e) => setSiteVisitDate(e.target.value)}
                              className="mt-2 h-11 w-full rounded-2xl border border-indigo-200 bg-white px-3 text-sm text-ink"
                            />
                          </div>
                          <div>
                            <Label htmlFor="sv-time" className="text-[11px] font-semibold text-indigo-900/55 uppercase">
                              Time (optional)
                            </Label>
                            <input
                              id="sv-time"
                              type="time"
                              value={siteVisitTime}
                              onChange={(e) => setSiteVisitTime(e.target.value)}
                              className="mt-2 h-11 w-full rounded-2xl border border-indigo-200 bg-white px-3 text-sm text-ink"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <Label htmlFor="sv-prop" className="text-[11px] font-semibold text-indigo-900/55 uppercase">
                            Property / location
                          </Label>
                          <input
                            id="sv-prop"
                            type="text"
                            value={siteVisitProperty}
                            onChange={(e) => setSiteVisitProperty(e.target.value)}
                            placeholder="e.g. Park-Facing 4 BHK · Sector 65"
                            className="mt-2 h-11 w-full rounded-2xl border border-indigo-200 bg-white px-3 text-sm text-ink"
                          />
                        </div>
                        {selectedLead.site_visit_date && (
                          <p className="mt-4 text-sm font-medium text-indigo-950">
                            Scheduled: {formatSiteVisit(selectedLead.site_visit_date, selectedLead.site_visit_time)}
                            {selectedLead.site_visit_property ? ` · ${selectedLead.site_visit_property}` : ""}
                          </p>
                        )}
                        <Button
                          type="submit"
                          disabled={busy || !siteVisitDate}
                          className="mt-5 h-11 rounded-2xl bg-indigo-700 px-5 text-sm font-semibold text-white hover:bg-indigo-800"
                        >
                          <CalendarClock className="size-4" />
                          Save site visit
                        </Button>
                      </form>
                    )}

                    {matchedProperties.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase">
                          Matched inventory
                        </p>
                        <div className="mt-3 space-y-3">
                          {matchedProperties.slice(0, 3).map((prop) => {
                            const shareText = `Hi ${selectedLead.name}, ${cleanAdvisorName(actor.name)} here from RealtyCook. Sharing a verified option:\n*${prop.title}* (${prop.locality})\n• Price: ${prop.price_label}\n• Specs: ${prop.specs}\n• Status: ${prop.verification_badge}`;
                            const digits = selectedLead.phone.replace(/\D/g, "");
                            const clean = digits.length === 10 ? `91${digits}` : digits;
                            const shareUrl = `https://wa.me/${clean}?text=${encodeURIComponent(shareText)}`;
                            return (
                              <div
                                key={prop.id}
                                className="rounded-2xl border border-border/80 bg-cream/30 px-4 py-3.5"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-ink">{prop.title}</p>
                                    <p className="mt-1 text-xs text-ink/55">
                                      {prop.locality} ·{" "}
                                      <span className="font-semibold text-brand-red">{prop.price_label}</span>
                                    </p>
                                  </div>
                                  <a
                                    href={shareUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 rounded-full bg-[#25D366] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#1ebe5d]"
                                  >
                                    Share
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity column */}
                <div className="flex min-h-0 flex-col overflow-hidden bg-cream/25">
                  <div className="shrink-0 border-b border-border px-8 py-8">
                    <h3 className="text-sm font-bold text-ink">Activity</h3>
                    <p className="mt-1 text-sm text-ink/55">Log the call or WhatsApp update, then set the next follow-up.</p>

                    <form onSubmit={handleAddComment} className="mt-6 space-y-4">
                      <Textarea
                        id="crm-comment"
                        rows={4}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="What was discussed? Next steps?"
                        className="min-h-[110px] resize-none rounded-2xl border-border bg-white text-sm leading-relaxed"
                      />
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                          <label
                            htmlFor="crm-followup"
                            className="block text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase"
                          >
                            Next follow-up
                          </label>
                          <input
                            id="crm-followup"
                            type="datetime-local"
                            value={followupInput}
                            onChange={(e) => setFollowupInput(e.target.value)}
                            className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3.5 text-sm text-ink"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={busy || !commentText.trim()}
                          className="h-11 rounded-2xl bg-ink px-5 text-sm font-semibold text-white hover:bg-brand-red"
                        >
                          <Send className="size-4" />
                          Save activity
                        </Button>
                      </div>
                    </form>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
                    <p className="text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase">
                      Timeline · {selectedLeadComments.length}
                    </p>
                    <div className="mt-5 space-y-0">
                      {selectedLeadComments.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-border bg-white/60 px-6 py-12 text-center">
                          <p className="text-sm text-ink/50">No activity yet. Save the first note above.</p>
                        </div>
                      ) : (
                        selectedLeadComments.map((c, idx) => (
                          <div key={c.id} className="relative flex gap-4 pb-8 last:pb-2">
                            {idx < selectedLeadComments.length - 1 && (
                              <span className="absolute top-3 left-[11px] h-[calc(100%-12px)] w-px bg-border" />
                            )}
                            <span className="relative z-[1] mt-1.5 size-[22px] shrink-0 rounded-full border-[3px] border-white bg-brand-red shadow-2xs" />
                            <div className="min-w-0 flex-1 rounded-2xl border border-border/70 bg-white px-4 py-3.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-ink">
                                  {c.author_name}
                                  <span className="ml-2 text-[10px] font-bold tracking-wide text-ink/35 uppercase">
                                    {c.author_role}
                                  </span>
                                </p>
                                <p className="text-xs text-ink/45">{formatShortDate(c.created_at)}</p>
                              </div>
                              <p className="mt-2 text-sm leading-relaxed text-ink/75">{c.body}</p>
                              {c.followup_scheduled_for && (
                                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-2.5 py-1 text-[11px] font-semibold text-ink">
                                  <CalendarClock className="size-3" />
                                  Follow-up {formatShortDate(c.followup_scheduled_for)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOLLOW-UPS */}
        {activeTab === "followups" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-3 shadow-soft">
              <div className="flex items-center gap-1 rounded-xl bg-cream p-1">
                {(
                  [
                    { id: "today" as const, label: `Today's Follow-Ups (${myFollowups.today.length})` },
                    { id: "upcoming" as const, label: `Upcoming (${myFollowups.upcoming.length})` },
                    { id: "missed" as const, label: `Missed (${myFollowups.missed.length})` },
                  ] as const
                ).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setFollowupBucket(b.id)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                      followupBucket === b.id
                        ? b.id === "missed"
                          ? "bg-brand-red text-white"
                          : "bg-ink text-white"
                        : b.id === "missed"
                          ? "text-brand-red hover:bg-brand-red-soft"
                          : "text-ink/60 hover:text-ink",
                    )}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-ink/55">
                {actor.role === "superadmin"
                  ? "Showing follow-ups across the whole team"
                  : "Showing follow-ups assigned to you"}
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-soft">
              <table className="w-full min-w-[740px] text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-cream/60 text-[11px] font-semibold tracking-wider text-ink/55 uppercase">
                    <th className="p-3.5">Client</th>
                    <th className="p-3.5">Assigned To</th>
                    <th className="p-3.5">Stage</th>
                    <th className="p-3.5">Scheduled</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {followupQueue.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-sm text-ink/50">
                        No {followupBucket} follow-ups right now.
                      </td>
                    </tr>
                  ) : (
                    followupQueue.map((lead) => {
                      const assignee = snapshot.users.find((u) => u.id === lead.assigned_to);
                      const stageObj = STAGES.find((s) => s.id === lead.stage) ?? STAGES[0];
                      const missed = followupBucket === "missed";
                      return (
                        <tr
                          key={lead.id}
                          className={cn(
                            "border-b border-border/60",
                            missed ? "bg-brand-red-soft/40" : "hover:bg-cream/50",
                          )}
                        >
                          <td className="p-3.5">
                            <p className="font-semibold text-ink">{lead.name}</p>
                            <p className="text-ink/55">
                              {lead.intent.toUpperCase()} · {PILLAR_LABELS[lead.pillar]}
                            </p>
                          </td>
                          <td className="p-3.5">{assignee?.name ?? "Unassigned"}</td>
                          <td className="p-3.5">
                            <span className={cn("rounded-md px-2 py-1 text-[10px] font-bold", stageObj.color)}>
                              {stageObj.label}
                            </span>
                          </td>
                          <td className={cn("p-3.5 tabular-nums", missed && "font-bold text-brand-red")}>
                            {formatShortDate(lead.next_followup_at)}
                            {missed && <span className="ml-2 text-[10px] uppercase">Missed</span>}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLeadId(lead.id);
                                  setActiveTab("pipeline");
                                }}
                                className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold hover:bg-cream"
                              >
                                Open
                              </button>
                              <a
                                href={buildWhatsAppUrl(lead.phone, lead.name, lead.pillar, actor.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-full bg-[#25D366] px-2.5 py-1.5 text-[11px] font-bold text-white"
                              >
                                <MessageCircle className="size-3 fill-white" /> WA
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* INVENTORY */}
        {activeTab === "inventory" && (
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-ink">Verified Inventory Bank</h2>
                <p className="text-xs text-ink/55">Any CRM user can add properties. Each card shows who added it.</p>
              </div>
              <Button
                onClick={() => setShowAddProperty(true)}
                className="h-10 rounded-xl bg-brand-red text-white shadow-red"
              >
                <Plus className="size-4" />
                Add Property
              </Button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {snapshot.properties.map((prop) => (
                <div key={prop.id} className="flex flex-col justify-between rounded-3xl border border-border bg-white p-6 shadow-soft">
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
        )}

        {/* TEAM */}
        {activeTab === "team" && (
          <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-lg font-bold text-ink">System Accounts &amp; Role Hierarchy</h2>
                <p className="text-xs text-ink/60">
                  1 Superadmin · Admin · Sales — with assignment and follow-up rules enforced on the backend
                </p>
              </div>
              <div className="divide-y divide-border/70">
                {snapshot.users.map((u) => {
                  const assignedCount = snapshot.leads.filter((l) => l.assigned_to === u.id).length;
                  const canRemove =
                    u.role !== "superadmin" &&
                    (actor.role === "superadmin" || (actor.role === "admin" && u.role === "sales"));
                  return (
                    <div key={u.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={cn(
                            "flex size-11 shrink-0 items-center justify-center rounded-2xl font-heading text-sm font-bold text-white",
                            u.role === "superadmin" ? "bg-brand-red" : u.role === "admin" ? "bg-ink text-gold" : "bg-emerald-700",
                          )}
                        >
                          {u.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-ink">{u.name}</p>
                            <span
                              className={cn(
                                "rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase",
                                u.role === "superadmin"
                                  ? "bg-brand-red-soft text-brand-red-deep"
                                  : u.role === "admin"
                                    ? "bg-gold-soft text-ink"
                                    : "bg-emerald-500/12 text-emerald-800",
                              )}
                            >
                              {u.role}
                            </span>
                          </div>
                          <p className="text-xs text-ink/60">
                            {u.designation} · {u.email} · +{u.phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink/75">
                          {assignedCount} active leads
                        </span>
                        {canRemove && (
                          <button
                            type="button"
                            onClick={() => postCrmAction({ action: "remove_user", targetUserId: u.id })}
                            aria-label={`Remove ${u.name}`}
                            className="inline-flex size-8 items-center justify-center rounded-xl border border-border text-ink/50 transition-colors hover:border-brand-red hover:bg-brand-red-soft hover:text-brand-red"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-white p-6 shadow-soft">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-brand-red-soft text-brand-red">
                  <UserPlus className="size-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-ink">Add Team Member</h3>
                  <p className="text-xs text-ink/55">
                    {actor.role === "sales"
                      ? "Switch to Admin or Superadmin to add users."
                      : "Create a new Sales or Admin account."}
                  </p>
                </div>
              </div>
              {actor.role === "sales" ? (
                <div className="mt-5 rounded-2xl border border-dashed border-border bg-cream/50 p-6 text-center text-xs text-ink/60">
                  Sales accounts cannot add or remove system users.
                </div>
              ) : (
                <form onSubmit={handleAddUser} className="mt-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="u-name">Full Name</Label>
                    <Input
                      id="u-name"
                      required
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm((s) => ({ ...s, name: e.target.value }))}
                      placeholder="e.g. Simran Kaur"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="u-email">Email</Label>
                      <Input
                        id="u-email"
                        type="email"
                        required
                        value={newUserForm.email}
                        onChange={(e) => setNewUserForm((s) => ({ ...s, email: e.target.value }))}
                        placeholder="simran@realtycook.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="u-phone">WhatsApp Phone</Label>
                      <Input
                        id="u-phone"
                        required
                        value={newUserForm.phone}
                        onChange={(e) => setNewUserForm((s) => ({ ...s, phone: e.target.value }))}
                        placeholder="919876543219"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="u-role">System Role</Label>
                      <select
                        id="u-role"
                        value={newUserForm.role}
                        onChange={(e) => setNewUserForm((s) => ({ ...s, role: e.target.value as UserRole }))}
                        className="h-10 w-full rounded-xl border border-border bg-white px-3 text-xs font-semibold text-ink"
                      >
                        <option value="sales">Sales Account</option>
                        {actor.role === "superadmin" && <option value="admin">Admin Account</option>}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="u-desig">Designation</Label>
                      <Input
                        id="u-desig"
                        value={newUserForm.designation}
                        onChange={(e) => setNewUserForm((s) => ({ ...s, designation: e.target.value }))}
                        placeholder="Sales Advisor — Homes"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl bg-brand-red text-white shadow-red">
                    <UserPlus className="size-4" />
                    <span>Add Account to CRM</span>
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* SUPERADMIN OVERSIGHT */}
        {activeTab === "oversight" && actor?.role === "superadmin" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-border bg-white p-6 shadow-soft">
              <h2 className="text-lg font-bold text-ink">Missed Follow-Ups Across Team</h2>
              <p className="mt-1 text-xs text-ink/55">Highlighted in red — these callbacks slipped past their scheduled time.</p>
              <div className="mt-4 space-y-2">
                {myFollowups.missed.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-ink/50">
                    No missed follow-ups. Team is on track.
                  </p>
                ) : (
                  myFollowups.missed.map((lead) => {
                    const assignee = snapshot.users.find((u) => u.id === lead.assigned_to);
                    return (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-brand-red/25 bg-brand-red-soft/50 p-3 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-ink">{lead.name}</p>
                          <p className="text-brand-red-deep">
                            Due {formatShortDate(lead.next_followup_at)} · {assignee?.name ?? "Unassigned"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLeadId(lead.id);
                            setActiveTab("pipeline");
                          }}
                          className="rounded-lg bg-brand-red px-2.5 py-1.5 text-[11px] font-bold text-white"
                        >
                          Review
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-white p-6 shadow-soft">
              <h2 className="text-lg font-bold text-ink">Recent Team Activity</h2>
              <p className="mt-1 text-xs text-ink/55">Latest comments, stage moves, assignments and site-visit schedules.</p>
              <div className="mt-4 max-h-[480px] space-y-2 overflow-y-auto pr-1">
                {recentActivity.map((c) => {
                  const lead = snapshot.leads.find((l) => l.id === c.lead_id);
                  return (
                    <div key={c.id} className="rounded-xl border border-border/80 bg-cream/40 p-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-ink">
                          {c.author_name}{" "}
                          <span className="font-mono text-[10px] text-brand-red uppercase">({c.author_role})</span>
                        </span>
                        <span className="text-[10px] text-ink/45">{formatShortDate(c.created_at)}</span>
                      </div>
                      <p className="mt-1 text-ink/55">Lead: {lead?.name ?? c.lead_id}</p>
                      <p className="mt-1 leading-relaxed text-ink/80">{c.body}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-white p-6 shadow-soft lg:col-span-2">
              <h2 className="text-lg font-bold text-ink">All Leads Snapshot</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold tracking-wider text-ink/55 uppercase">
                      <th className="p-2.5">Client</th>
                      <th className="p-2.5">Assignee</th>
                      <th className="p-2.5">Stage</th>
                      <th className="p-2.5">Follow-Up</th>
                      <th className="p-2.5">Site Visit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.leads.map((lead) => {
                      const assignee = snapshot.users.find((u) => u.id === lead.assigned_to);
                      const overdue = isFollowupOverdue(lead.next_followup_at, nowMs);
                      return (
                        <tr key={lead.id} className="border-b border-border/60">
                          <td className="p-2.5 font-semibold">{lead.name}</td>
                          <td className="p-2.5">{assignee?.name ?? "Unassigned"}</td>
                          <td className="p-2.5">{STAGES.find((s) => s.id === lead.stage)?.label}</td>
                          <td className={cn("p-2.5", overdue && "font-semibold text-brand-red")}>
                            {formatShortDate(lead.next_followup_at)}
                          </td>
                          <td className="p-2.5">
                            {lead.site_visit_date
                              ? formatSiteVisit(lead.site_visit_date, lead.site_visit_time)
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Follow-up popup */}
      {followupPopup && (
        <div className="fixed right-5 bottom-5 z-50 w-[min(100%,360px)] rounded-2xl border border-brand-red/30 bg-white p-4 shadow-lift">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-brand-red uppercase">Follow-Up Due</p>
              <h3 className="mt-1 text-base font-bold text-ink">{followupPopup.name}</h3>
              <p className="text-xs text-ink/60">
                Scheduled {formatShortDate(followupPopup.next_followup_at)} · {PILLAR_LABELS[followupPopup.pillar]}
              </p>
            </div>
            <button type="button" onClick={() => setFollowupPopup(null)} aria-label="Dismiss follow-up popup">
              <X className="size-4 text-ink/40" />
            </button>
          </div>
          <p className="mt-2 line-clamp-2 text-xs text-ink/75">{followupPopup.notes_summary}</p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              className="h-8 flex-1 rounded-xl bg-brand-red text-white"
              onClick={() => {
                setSelectedLeadId(followupPopup.id);
                setActiveTab("pipeline");
                setFollowupPopup(null);
              }}
            >
              Open Lead
            </Button>
            <a
              href={buildWhatsAppUrl(followupPopup.phone, followupPopup.name, followupPopup.pillar, actor.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-xl bg-[#25D366] text-xs font-bold text-white"
            >
              <MessageCircle className="size-3.5 fill-white" /> WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* New Lead Modal */}
      {showNewLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-6 shadow-lift sm:p-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-xl font-bold text-ink">Add New Lead</h2>
              <button type="button" onClick={() => setShowNewLead(false)} className="text-xs font-semibold text-ink/50 hover:text-ink">
                Close ✕
              </button>
            </div>
            <form onSubmit={handleCreateLead} className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="nl-name">Client Name</Label>
                  <Input
                    id="nl-name"
                    required
                    value={newLeadForm.name}
                    onChange={(e) => setNewLeadForm((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Client full name"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nl-phone">WhatsApp / Phone</Label>
                  <Input
                    id="nl-phone"
                    required
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm((s) => ({ ...s, phone: e.target.value }))}
                    placeholder="+91 98xxxxxx10"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="nl-intent">Intent</Label>
                  <select
                    id="nl-intent"
                    value={newLeadForm.intent}
                    onChange={(e) => setNewLeadForm((s) => ({ ...s, intent: e.target.value as LeadIntent }))}
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
                    value={newLeadForm.pillar}
                    onChange={(e) => setNewLeadForm((s) => ({ ...s, pillar: e.target.value as ServicePillar }))}
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
                    value={newLeadForm.budget}
                    onChange={(e) => setNewLeadForm((s) => ({ ...s, budget: e.target.value }))}
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
                  value={newLeadForm.city}
                  onChange={(e) => setNewLeadForm((s) => ({ ...s, city: e.target.value }))}
                  placeholder="e.g. Sector 65 Gurugram"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nl-msg">Initial Conversation Note</Label>
                <Textarea
                  id="nl-msg"
                  rows={2}
                  value={newLeadForm.message}
                  onChange={(e) => setNewLeadForm((s) => ({ ...s, message: e.target.value }))}
                  placeholder="Specific requirement details…"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowNewLead(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={busy} className="rounded-xl bg-brand-red text-white shadow-red">
                  Save Lead to CRM
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-6 shadow-lift sm:p-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="size-5 text-brand-red" />
                <h2 className="text-xl font-bold text-ink">Bulk Upload Leads</h2>
              </div>
              <button type="button" onClick={() => setShowBulkUpload(false)} className="text-xs font-semibold text-ink/50">
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
                if (file) parseExcelFile(file);
              }}
            />
            {bulkPreviewCount > 0 && (
              <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-xs font-semibold text-ink">
                Ready to import <span className="text-brand-red">{bulkPreviewCount}</span> valid leads.
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowBulkUpload(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                type="button"
                disabled={busy || bulkPreviewCount === 0}
                onClick={handleBulkImport}
                className="rounded-xl bg-brand-red text-white shadow-red"
              >
                <Upload className="size-4" />
                Import {bulkPreviewCount || ""} Leads
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Property Modal */}
      {showAddProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-6 shadow-lift sm:p-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-xl font-bold text-ink">Add Verified Property</h2>
              <button type="button" onClick={() => setShowAddProperty(false)} className="text-xs font-semibold text-ink/50">
                Close ✕
              </button>
            </div>
            <form onSubmit={handleAddProperty} className="mt-5 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="p-title">Property Title</Label>
                <Input
                  id="p-title"
                  required
                  value={propertyForm.title}
                  onChange={(e) => setPropertyForm((s) => ({ ...s, title: e.target.value }))}
                  placeholder="e.g. Park-Facing 4 BHK Residence"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="p-locality">Locality / Sector</Label>
                  <Input
                    id="p-locality"
                    required
                    value={propertyForm.locality}
                    onChange={(e) => setPropertyForm((s) => ({ ...s, locality: e.target.value }))}
                    placeholder="Sector 65, Gurugram"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="p-price">Price Label</Label>
                  <Input
                    id="p-price"
                    required
                    value={propertyForm.price_label}
                    onChange={(e) => setPropertyForm((s) => ({ ...s, price_label: e.target.value }))}
                    placeholder="₹3.45 Cr"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="p-pillar">Pillar</Label>
                  <select
                    id="p-pillar"
                    value={propertyForm.pillar}
                    onChange={(e) => setPropertyForm((s) => ({ ...s, pillar: e.target.value as ServicePillar }))}
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
                    value={propertyForm.intent}
                    onChange={(e) => setPropertyForm((s) => ({ ...s, intent: e.target.value as LeadIntent }))}
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
                    value={propertyForm.budget_bracket}
                    onChange={(e) => setPropertyForm((s) => ({ ...s, budget_bracket: e.target.value }))}
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
                  value={propertyForm.specs}
                  onChange={(e) => setPropertyForm((s) => ({ ...s, specs: e.target.value }))}
                  placeholder="2,180 sq.ft · OC Received · 2 Parking"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="p-badge">Verification Badge</Label>
                <Input
                  id="p-badge"
                  value={propertyForm.verification_badge}
                  onChange={(e) => setPropertyForm((s) => ({ ...s, verification_badge: e.target.value }))}
                  placeholder="OC & Title Verified"
                />
              </div>
              <p className="text-[11px] text-ink/55">
                Will be attributed to <strong>{actor.name}</strong> ({actor.role}).
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddProperty(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={busy} className="rounded-xl bg-brand-red text-white shadow-red">
                  Save Property
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
