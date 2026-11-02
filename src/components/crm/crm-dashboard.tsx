"use client";

import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  Filter,
  Kanban,
  LayoutList,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  CrmLead,
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

function buildWhatsAppUrl(phone: string, leadName: string, pillar: ServicePillar, actorName: string) {
  const digits = phone.replace(/\D/g, "");
  const clean = digits.length === 10 ? `91${digits}` : digits;
  const text = `Hi ${leadName}, this is ${actorName} from RealtyCook regarding your ${PILLAR_LABELS[pillar]} requirement. When is a good time to connect?`;
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

function isFollowupOverdue(iso: string | null, nowMs: number | null) {
  if (!iso || nowMs === null) return false;
  return new Date(iso).getTime() < nowMs;
}

export function CrmDashboard({ initialSnapshot }: { initialSnapshot: CrmStateSnapshot }) {
  const [snapshot, setSnapshot] = useState<CrmStateSnapshot>(initialSnapshot);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [actorId, setActorId] = useState<string>(initialSnapshot.users[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<"pipeline" | "followups" | "inventory" | "team">("pipeline");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  // Filters
  const [search, setSearch] = useState("");
  const [pillarFilter, setPillarFilter] = useState<"all" | ServicePillar>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<"all" | "mine" | "unassigned">("all");

  // Active Lead Drawer
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialSnapshot.leads[0]?.id ?? null);
  const [commentText, setCommentText] = useState("");
  const [followupInput, setFollowupInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  // New Lead Modal
  const [showNewLead, setShowNewLead] = useState(false);
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

  // New User Form (Superadmin & Admin)
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "sales" as UserRole,
    designation: "Sales Advisor",
  });

  const actor: CrmUser = useMemo(
    () => snapshot.users.find((u) => u.id === actorId) ?? snapshot.users[0],
    [snapshot.users, actorId],
  );

  /**
   * Role-Based Assignment Targets:
   * - Superadmin & Admin can assign to ANY user in the system.
   * - Sales accounts can ONLY assign to themselves or other Sales accounts.
   */
  const assignableUsers = useMemo(() => {
    if (!actor) return [];
    if (actor.role === "sales") {
      return snapshot.users.filter((u) => u.role === "sales");
    }
    return snapshot.users;
  }, [snapshot.users, actor]);

  const filteredLeads = useMemo(() => {
    return snapshot.leads.filter((lead) => {
      if (pillarFilter !== "all" && lead.pillar !== pillarFilter) return false;
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
  }, [snapshot.leads, pillarFilter, assigneeFilter, search, actor]);

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

  useEffect(() => {
    setNowMs(Date.now());
    try {
      const saved = window.localStorage.getItem("rc_crm_snapshot_v1");
      if (saved) {
        const parsed = JSON.parse(saved) as CrmStateSnapshot;
        if (parsed?.users?.length && parsed?.leads?.length) {
          setSnapshot(parsed);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  function saveLocalSnapshot(next: CrmStateSnapshot) {
    setSnapshot(next);
    try {
      window.localStorage.setItem("rc_crm_snapshot_v1", JSON.stringify(next));
    } catch {
      // ignore storage errors
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
        notes_summary: String(body.message ?? "New enquiry logged.").trim(),
        created_at: now,
        updated_at: now,
      };
      saveLocalSnapshot({
        ...snapshot,
        leads: [newLead, ...snapshot.leads],
      });
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
        leads: snapshot.leads.map((l) =>
          l.id === leadId
            ? {
                ...l,
                stage: stage ?? l.stage,
                next_followup_at:
                  body.nextFollowupAt !== undefined
                    ? (body.nextFollowupAt as string | null)
                    : l.next_followup_at,
                updated_at: now,
              }
            : l,
        ),
      });
      return true;
    }

    if (action === "add_comment") {
      const leadId = String(body.leadId ?? "");
      const text = String(body.body ?? "").trim();
      if (!text) return false;
      const nextFollowupAt = body.nextFollowupAt ? String(body.nextFollowupAt) : null;
      const newComment = {
        id: `c-${Date.now()}`,
        lead_id: leadId,
        author_id: actor.id,
        author_name: actor.name,
        author_role: actor.role,
        body: text,
        followup_scheduled_for: nextFollowupAt,
        created_at: now,
      };
      saveLocalSnapshot({
        ...snapshot,
        comments: [newComment, ...snapshot.comments],
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
      const newUser: CrmUser = {
        id: `user-${Date.now()}`,
        name: String(body.name ?? "").trim(),
        email: String(body.email ?? "").trim().toLowerCase(),
        phone: String(body.phone ?? "").replace(/\D/g, ""),
        role,
        designation: String(body.designation ?? "Sales Advisor").trim(),
        active: true,
        created_at: now,
      };
      saveLocalSnapshot({
        ...snapshot,
        users: [...snapshot.users, newUser],
      });
      return true;
    }

    if (action === "remove_user") {
      const targetId = String(body.targetUserId ?? "");
      const target = snapshot.users.find((u) => u.id === targetId);
      if (!target) return false;
      if (actor.role === "sales" || target.role === "superadmin" || (actor.role === "admin" && target.role !== "sales")) {
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
      // Static edge preview fallback uses local snapshot
    } finally {
      setBusy(false);
    }
  }

  async function postCrmAction(body: Record<string, unknown>) {
    setBusy(true);
    setBannerError(null);
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
      if (data.snapshot) {
        saveLocalSnapshot(data.snapshot as CrmStateSnapshot);
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
    const ok = await postCrmAction({
      action: "add_user",
      ...newUserForm,
    });
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

  return (
    <div className="min-h-svh bg-cream text-ink">
      {/* Top CRM Navigation & Role Switcher Bar */}
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
                Cloudflare Edge-Ready API · 1-Click WhatsApp · Role-Based Access Control
              </p>
            </div>
          </div>

          {/* Active Role / Account Switcher (For testing Superadmin vs Admin vs Sales permissions) */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-cream px-3 py-1.5">
              <Shield className="size-4 text-brand-red" />
              <span className="text-xs font-medium text-ink/60">Acting as:</span>
              <select
                aria-label="Switch active CRM user account"
                value={actor?.id ?? ""}
                onChange={(e) => setActorId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-ink focus:outline-none"
              >
                {snapshot.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.toUpperCase()} — {u.designation})
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={refreshSnapshot}
              disabled={busy}
              className="h-9 rounded-xl bg-white"
            >
              <RefreshCw className={cn("size-3.5", busy && "animate-spin")} />
              <span>Sync</span>
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

        {/* Sub-Bar: Role Capabilities Banner + Primary Module Tabs */}
        <div className="border-t border-border/70 bg-cream/65">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-5 py-2">
            {/* Module Tabs */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: "pipeline" as const, label: `Lead Pipeline (${snapshot.leads.length})`, icon: Kanban },
                {
                  id: "followups" as const,
                  label: `Follow-Up Queue (${snapshot.leads.filter((l) => l.next_followup_at).length})`,
                  icon: CalendarClock,
                },
                { id: "inventory" as const, label: `Verified Inventory (${snapshot.properties.length})`, icon: Building2 },
                { id: "team" as const, label: `Team & Roles (${snapshot.users.length})`, icon: Users },
              ].map((t) => {
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

            {/* Active Role Permission Pill */}
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
                {actor?.role === "superadmin" && "Full system access · Can manage Admins, Sales & all leads"}
                {actor?.role === "admin" && "Can add/remove Sales accounts & assign leads to any Sales advisor"}
                {actor?.role === "sales" &&
                  "Can assign leads to self or other Sales advisors, log conversation comments & schedule follow-ups"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {bannerError && (
        <div className="mx-auto mt-4 max-w-[1600px] px-5">
          <div className="flex items-center justify-between rounded-2xl border border-brand-red/30 bg-brand-red-soft px-4 py-3 text-xs font-semibold text-brand-red-deep">
            <span className="flex items-center gap-2">
              <AlertCircle className="size-4" />
              {bannerError}
            </span>
            <button type="button" onClick={() => setBannerError(null)} className="underline">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <div className="mx-auto max-w-[1600px] px-5 py-6">
        {/* ================================================================== */}
        {/* TAB 1 & 2: PIPELINE (KANBAN / LIST) + FOLLOW-UP QUEUE              */}
        {/* ================================================================== */}
        {(activeTab === "pipeline" || activeTab === "followups") && (
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_420px]">
            {/* Left Area: Filter Bar + Kanban/List */}
            <div className="min-w-0">
              {/* Filter Bar */}
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

                  {/* Pillar Filter */}
                  <div className="flex items-center gap-1 rounded-xl bg-cream p-1">
                    {(["all", "homes", "commercial", "upcoming", "land", "leasing"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPillarFilter(p)}
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-colors",
                          pillarFilter === p ? "bg-ink text-white" : "text-ink/60 hover:text-ink",
                        )}
                      >
                        {p === "all" ? "All Pillars" : p}
                      </button>
                    ))}
                  </div>

                  {/* Assignee Filter */}
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

                {activeTab === "pipeline" && (
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
                )}
              </div>

              {/* KANBAN VIEW */}
              {activeTab === "pipeline" && viewMode === "kanban" && (
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {STAGES.slice(0, 7).map((stage) => {
                    const stageLeads = filteredLeads.filter((l) => l.stage === stage.id);
                    return (
                      <div
                        key={stage.id}
                        className="flex w-[275px] shrink-0 flex-col rounded-2xl border border-border/80 bg-cream-2/55 p-3"
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

                        <div className="space-y-2.5">
                          {stageLeads.map((lead) => {
                            const assignee = snapshot.users.find((u) => u.id === lead.assigned_to);
                            const isSelected = lead.id === selectedLeadId;
                            const overdue = isFollowupOverdue(lead.next_followup_at, nowMs);

                            return (
                              <div
                                key={lead.id}
                                onClick={() => setSelectedLeadId(lead.id)}
                                className={cn(
                                  "cursor-pointer rounded-2xl border bg-white p-3.5 transition-all hover:shadow-soft",
                                  isSelected ? "border-brand-red ring-2 ring-brand-red/20" : "border-border",
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold text-ink">{lead.name}</p>
                                    <p className="text-[11px] text-ink/55">{lead.city || "Location pending"}</p>
                                  </div>
                                  <span className="rounded-md bg-cream px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-red">
                                    {lead.intent} · {lead.pillar}
                                  </span>
                                </div>

                                <p className="mt-2 line-clamp-2 text-xs text-ink/70">
                                  {lead.notes_summary || "No conversation notes yet."}
                                </p>

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

                                {/* Follow-up & 1-Click WhatsApp Row (No call button, per user instruction) */}
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TABLE LIST VIEW OR FOLLOW-UP QUEUE */}
              {(viewMode === "list" || activeTab === "followups") && (
                <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-soft">
                  <table className="w-full min-w-[740px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-cream/60 text-[11px] font-semibold tracking-wider text-ink/55 uppercase">
                        <th className="p-3.5">Client</th>
                        <th className="p-3.5">Requirement</th>
                        <th className="p-3.5">Stage</th>
                        <th className="p-3.5">Assigned To</th>
                        <th className="p-3.5">Next Follow-Up</th>
                        <th className="p-3.5 text-right">1-Click WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => {
                        const assignee = snapshot.users.find((u) => u.id === lead.assigned_to);
                        const stageObj = STAGES.find((s) => s.id === lead.stage) ?? STAGES[0];
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
                            <td className="p-3.5 tabular-nums text-ink/75">{formatShortDate(lead.next_followup_at)}</td>
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

            {/* Right Area: Active Lead Inspector Drawer (Assignment, Stage, Follow-up, Comments) */}
            <aside className="sticky top-28 rounded-3xl border border-border bg-white p-5 shadow-lift">
              {selectedLead ? (
                <div>
                  <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
                    <div>
                      <span className="rounded-md bg-brand-red-soft px-2 py-0.5 text-[10px] font-bold uppercase text-brand-red-deep">
                        {selectedLead.intent} · {PILLAR_LABELS[selectedLead.pillar]}
                      </span>
                      <h2 className="mt-1.5 text-xl font-bold text-ink">{selectedLead.name}</h2>
                      <p className="text-xs text-ink/60 tabular-nums">
                        +{selectedLead.phone} · {selectedLead.city || "Location flexible"}
                      </p>
                    </div>

                    <a
                      href={buildWhatsAppUrl(selectedLead.phone, selectedLead.name, selectedLead.pillar, actor.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-2 text-xs font-bold text-white shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-[#1ebe5d]"
                    >
                      <MessageCircle className="size-4 fill-white" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  {/* 1. Stage Progression Selector */}
                  <div className="mt-4">
                    <Label className="text-[11px] font-semibold tracking-wider text-ink/50 uppercase">
                      Pipeline Stage
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
                      className="mt-1.5 h-10 w-full rounded-xl border border-border bg-cream/60 px-3 text-xs font-semibold text-ink focus:border-brand-red focus:outline-none"
                    >
                      {STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.num} · {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Role-Enforced Lead Assignment */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-semibold tracking-wider text-ink/50 uppercase">
                        Assigned Sales Account
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
                          className="text-[11px] font-semibold text-brand-red hover:underline"
                        >
                          Assign to me →
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
                      className="mt-1.5 h-10 w-full rounded-xl border border-border bg-cream/60 px-3 text-xs font-semibold text-ink focus:border-brand-red focus:outline-none"
                    >
                      {actor.role !== "sales" && <option value="">— Unassigned —</option>}
                      {assignableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role.toUpperCase()} · {u.designation})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[10px] text-ink/45">
                      {actor.role === "sales"
                        ? "As a Sales account, you can assign leads to yourself or any other Sales account."
                        : "As Admin/Superadmin, you can assign leads to any Sales advisor."}
                    </p>
                  </div>

                  {/* 3. Post Conversation Comment & Schedule Follow-Up */}
                  <form onSubmit={handleAddComment} className="mt-5 rounded-2xl border border-border bg-cream/55 p-3.5">
                    <Label htmlFor="crm-comment" className="text-xs font-semibold text-ink">
                      Log conversation &amp; schedule follow-up
                    </Label>
                    <Textarea
                      id="crm-comment"
                      rows={3}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write what was discussed on WhatsApp or call (e.g. Sent 3 kothi options, site visit on Sunday)…"
                      className="mt-2 bg-white text-xs"
                    />
                    <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="flex-1">
                        <label htmlFor="crm-followup" className="block text-[10px] font-semibold text-ink/55 uppercase">
                          Next Follow-up Date &amp; Time
                        </label>
                        <input
                          id="crm-followup"
                          type="datetime-local"
                          value={followupInput}
                          onChange={(e) => setFollowupInput(e.target.value)}
                          className="mt-1 h-9 w-full rounded-xl border border-border bg-white px-2.5 text-xs text-ink"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={busy || !commentText.trim()}
                        className="mt-3 h-9 rounded-xl bg-ink px-4 text-xs font-semibold text-white hover:bg-brand-red sm:mt-4"
                      >
                        <Send className="size-3.5" />
                        <span>Save Note</span>
                      </Button>
                    </div>
                  </form>

                  {/* 4. Conversation History Timeline */}
                  <div className="mt-5">
                    <p className="text-[11px] font-semibold tracking-wider text-ink/50 uppercase">
                      Conversation History ({selectedLeadComments.length})
                    </p>
                    <div className="mt-2.5 max-h-56 space-y-2.5 overflow-y-auto pr-1">
                      {selectedLeadComments.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-ink/50">
                          No comments logged yet.
                        </p>
                      ) : (
                        selectedLeadComments.map((c) => (
                          <div key={c.id} className="rounded-xl border border-border/80 bg-cream/40 p-3 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-ink">
                                {c.author_name}{" "}
                                <span className="font-mono text-[10px] text-brand-red uppercase">({c.author_role})</span>
                              </span>
                              <span className="text-[10px] text-ink/45">{formatShortDate(c.created_at)}</span>
                            </div>
                            <p className="mt-1.5 leading-relaxed text-ink/80">{c.body}</p>
                            {c.followup_scheduled_for && (
                              <p className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-gold-soft px-2 py-0.5 text-[10px] font-semibold text-ink">
                                <CalendarClock className="size-3" /> Follow-up: {formatShortDate(c.followup_scheduled_for)}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 5. Quick Matched Properties to Share on WhatsApp */}
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="text-[11px] font-semibold tracking-wider text-ink/50 uppercase">
                      Matched Verified Inventory ({matchedProperties.length})
                    </p>
                    <div className="mt-2 space-y-2">
                      {matchedProperties.slice(0, 2).map((prop) => {
                        const shareText = `Hi ${selectedLead.name}, sharing a verified option from RealtyCook:\n*${prop.title}* (${prop.locality})\n• Price: ${prop.price_label}\n• Specs: ${prop.specs}\n• Status: ${prop.verification_badge}\nLet me know if we should schedule a site visit.`;
                        const digits = selectedLead.phone.replace(/\D/g, "");
                        const clean = digits.length === 10 ? `91${digits}` : digits;
                        const shareUrl = `https://wa.me/${clean}?text=${encodeURIComponent(shareText)}`;

                        return (
                          <div
                            key={prop.id}
                            className="flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-cream/35 p-2.5 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-ink">{prop.title}</p>
                              <p className="truncate text-[11px] text-ink/55">
                                {prop.locality} · <strong className="text-brand-red">{prop.price_label}</strong>
                              </p>
                            </div>
                            <a
                              href={shareUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 rounded-lg bg-[#25D366] px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-[#1ebe5d]"
                            >
                              Send on WA →
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-ink/55">Select any lead on the left to inspect or update.</p>
              )}
            </aside>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: VERIFIED INVENTORY BANK                                     */}
        {/* ================================================================== */}
        {activeTab === "inventory" && (
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
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <span className="font-heading text-xl font-bold text-ink tabular-nums">{prop.price_label}</span>
                  <span className="text-xs font-medium text-ink/50">Bracket: {BUDGET_LABELS[prop.budget_bracket]}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 4: TEAM & ROLES MANAGEMENT (SUPERADMIN, ADMIN, SALES)          */}
        {/* ================================================================== */}
        {activeTab === "team" && (
          <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Active Team Directory */}
            <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-lg font-bold text-ink">System Accounts &amp; Role Hierarchy</h2>
                <p className="text-xs text-ink/60">
                  1 Superadmin (full access) · Admin (manages users &amp; assigns leads) · Sales (assigns to self/sales,
                  logs comments &amp; follow-ups)
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
                            u.role === "superadmin"
                              ? "bg-brand-red"
                              : u.role === "admin"
                                ? "bg-ink text-gold"
                                : "bg-emerald-700",
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
                            onClick={() =>
                              postCrmAction({
                                action: "remove_user",
                                targetUserId: u.id,
                              })
                            }
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

            {/* Add New User Form (Only enabled for Superadmin & Admin) */}
            <div className="rounded-3xl border border-border bg-white p-6 shadow-soft">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-brand-red-soft text-brand-red">
                  <UserPlus className="size-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-ink">Add Team Member</h3>
                  <p className="text-xs text-ink/55">
                    {actor.role === "sales"
                      ? "Switch to Admin or Superadmin in the top bar to add or remove users."
                      : "Create a new Sales or Admin account."}
                  </p>
                </div>
              </div>

              {actor.role === "sales" ? (
                <div className="mt-5 rounded-2xl border border-dashed border-border bg-cream/50 p-6 text-center text-xs text-ink/60">
                  You are currently viewing as a <strong>Sales</strong> account ({actor.name}). Sales accounts cannot add
                  or remove system users. Use the <strong>Acting as</strong> switcher in the top header to test{" "}
                  <strong>Admin (Karan Yadav)</strong> or <strong>Superadmin</strong> permissions.
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
      </div>

      {/* Modal: Add New Lead */}
      {showNewLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-6 shadow-lift sm:p-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-xl font-bold text-ink">Add New Lead</h2>
              <button
                type="button"
                onClick={() => setShowNewLead(false)}
                className="text-xs font-semibold text-ink/50 hover:text-ink"
              >
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
                  placeholder="e.g. Sector 65 Gurugram, Airport Road Mohali"
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
    </div>
  );
}
