"use client";

import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  LayoutGrid,
  ListFilter,
  MessageCircle,
  MessageSquarePlus,
  Plus,
  Send,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type CrmLead,
  type CrmUser,
  type LeadIntent,
  type LeadStage,
  PIPELINE_STAGES,
  type ServicePillar,
  type UserRole,
} from "@/lib/crm-store";
import { cn } from "@/lib/utils";

const PILLAR_LABELS: Record<ServicePillar, string> = {
  homes: "Homes",
  commercial: "Commercial",
  upcoming: "Upcoming",
  land: "Land",
  leasing: "Leasing",
};

const BUDGET_LABELS: Record<string, string> = {
  "under-50l": "Under ₹50 L",
  "50l-1cr": "₹50 L – ₹1 Cr",
  "1-3cr": "₹1 – 3 Cr",
  "3-10cr": "₹3 – 10 Cr",
  "10cr-plus": "₹10 Cr+",
  unsure: "Flexible / TBD",
};

function formatWhatsAppUrl(phone: string, leadName: string, actorName: string, pillar: string) {
  const digits = phone.replace(/\D/g, "");
  const cleanPhone = digits.length === 10 ? `91${digits}` : digits;
  const msg = `Hi ${leadName}, this is ${actorName} from RealtyCook regarding your ${pillar} requirement. When is a good time to connect?`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

function formatShortDate(iso: string | null | undefined) {
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

export default function RealtyCookCrmPage() {
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [storageMode, setStorageMode] = useState<"supabase" | "memory">("memory");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active simulated logged-in user (Superadmin, Admin, or Sales)
  const [activeUserId, setActiveUserId] = useState<string>("u-admin-karan");
  const [view, setView] = useState<"pipeline" | "followups" | "team">("pipeline");
  const [pillarFilter, setPillarFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  // Selected lead for the detail & comment drawer
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [followupInput, setFollowupInput] = useState("");

  // New Lead modal state
  const [showNewLead, setShowNewLead] = useState(false);

  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch("/api/crm", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load CRM data");
      const data = await res.json();
      setUsers(data.users ?? []);
      setLeads(data.leads ?? []);
      setStorageMode(data.storageMode ?? "memory");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to load CRM");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  const activeUser = useMemo(
    () => users.find((u) => u.id === activeUserId) ?? users[0],
    [users, activeUserId],
  );

  // Enforce role-based assignable targets in UI (and backed by /api/crm check):
  // - Superadmin & Admin can assign leads to any sales/admin account
  // - Sales accounts can ONLY assign leads to themselves or another sales account
  const assignableUsers = useMemo(() => {
    if (!activeUser) return [];
    if (activeUser.role === "sales") {
      return users.filter((u) => u.role === "sales");
    }
    return users;
  }, [users, activeUser]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchPillar = pillarFilter === "all" || l.pillar === pillarFilter;
      const matchAssignee =
        assigneeFilter === "all" ||
        (assigneeFilter === "mine" ? l.assignedTo === activeUser?.id : l.assignedTo === assigneeFilter);
      return matchPillar && matchAssignee;
    });
  }, [leads, pillarFilter, assigneeFilter, activeUser]);

  const selectedLead = useMemo(
    () => leads.find((l) => l.id === selectedLeadId) ?? null,
    [leads, selectedLeadId],
  );

  async function mutateCrm(payload: Record<string, unknown>) {
    setErrorMsg(null);
    const res = await fetch("/api/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, actorId: activeUser?.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "Operation not permitted");
      return false;
    }
    setUsers(data.users ?? []);
    setLeads(data.leads ?? []);
    return true;
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLead || !commentText.trim()) return;
    const isoFollowup = followupInput ? new Date(followupInput).toISOString() : null;
    const ok = await mutateCrm({
      action: "add_comment",
      leadId: selectedLead.id,
      body: commentText,
      followupScheduledFor: isoFollowup,
    });
    if (ok) {
      setCommentText("");
      setFollowupInput("");
    }
  }

  async function handleCreateLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ok = await mutateCrm({
      action: "create_lead",
      name: fd.get("name"),
      phone: fd.get("phone"),
      email: fd.get("email"),
      intent: fd.get("intent"),
      pillar: fd.get("pillar"),
      budget: fd.get("budget"),
      city: fd.get("city"),
      message: fd.get("message"),
    });
    if (ok) setShowNewLead(false);
  }

  async function handleAddTeamMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const ok = await mutateCrm({
      action: "add_user",
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      role: fd.get("role"),
      designation: fd.get("designation"),
    });
    if (ok) form.reset();
  }

  return (
    <div className="min-h-svh bg-cream text-ink">
      {/* Top CRM Command Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="shrink-0">
              <Logo className="h-11" />
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-ink">RealtyCook CRM</h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-cream px-2.5 py-0.5 text-[11px] font-semibold text-ink/70">
                  <Database className="size-3 text-brand-red" />
                  {storageMode === "supabase" ? "Supabase Live" : "Edge Ready (Add .env for Supabase)"}
                </span>
              </div>
              <p className="text-xs text-ink/55">Lead Pipeline, WhatsApp Desk &amp; Role-Based Team Access</p>
            </div>
          </div>

          {/* Role Switcher (Simulates Logged-In Account) */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-cream p-1.5 text-xs">
              <span className="px-2 font-semibold text-ink/60">Viewing as:</span>
              <select
                value={activeUser?.id ?? ""}
                onChange={(e) => setActiveUserId(e.target.value)}
                aria-label="Switch active CRM user role"
                className="rounded-xl bg-ink px-3 py-1.5 font-semibold text-white focus:outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.toUpperCase()} · {u.designation})
                  </option>
                ))}
              </select>
            </div>

            <Button onClick={() => setShowNewLead(true)} className="h-10 rounded-full px-4 text-xs shadow-red">
              <Plus className="size-4" /> Add Lead
            </Button>

            <Link
              href="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-white px-4 text-xs font-semibold text-ink hover:bg-cream"
            >
              <ArrowLeft className="size-3.5" /> Website
            </Link>
          </div>
        </div>

        {/* Sub-Toolbar: Navigation Tabs & Filters */}
        <div className="border-t border-border/70 bg-cream/60">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-5 py-2.5 sm:px-8">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setView("pipeline")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all",
                  view === "pipeline" ? "bg-ink text-white shadow-2xs" : "text-ink/70 hover:bg-white",
                )}
              >
                <LayoutGrid className="size-3.5" /> Pipeline Board ({filteredLeads.length})
              </button>
              <button
                type="button"
                onClick={() => setView("followups")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all",
                  view === "followups" ? "bg-ink text-white shadow-2xs" : "text-ink/70 hover:bg-white",
                )}
              >
                <Calendar className="size-3.5" /> Follow-Up Schedule
              </button>
              <button
                type="button"
                onClick={() => setView("team")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all",
                  view === "team" ? "bg-ink text-white shadow-2xs" : "text-ink/70 hover:bg-white",
                )}
              >
                <Users className="size-3.5" /> Team &amp; Roles ({users.length})
              </button>
            </div>

            {/* Active Role Capabilities Pill + Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-red-soft px-3 py-1 font-semibold text-brand-red-deep">
                <Shield className="size-3.5" />
                {activeUser?.role === "superadmin"
                  ? "Superadmin: Full System Access"
                  : activeUser?.role === "admin"
                    ? "Admin: Manage Sales Team & All Leads"
                    : "Sales: Assign to Sales Only · Comment & Follow-Up"}
              </span>

              <div className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-2.5 py-1">
                <ListFilter className="size-3.5 text-ink/45" />
                <select
                  value={pillarFilter}
                  onChange={(e) => setPillarFilter(e.target.value)}
                  aria-label="Filter by service pillar"
                  className="bg-transparent text-xs font-medium text-ink focus:outline-none"
                >
                  <option value="all">All 5 Pillars</option>
                  <option value="homes">Homes</option>
                  <option value="commercial">Commercial</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="land">Land Parcels</option>
                  <option value="leasing">Leasing</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-2.5 py-1">
                <UserCheck className="size-3.5 text-ink/45" />
                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  aria-label="Filter by assigned sales account"
                  className="bg-transparent text-xs font-medium text-ink focus:outline-none"
                >
                  <option value="all">All Team Leads</option>
                  <option value="mine">Assigned to Me ({activeUser?.name.split(" ")[0]})</option>
                  {users
                    .filter((u) => u.role === "sales" || u.role === "admin")
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Toast */}
      {errorMsg && (
        <div className="mx-auto mt-4 max-w-[1600px] px-5 sm:px-8">
          <div className="flex items-center justify-between rounded-2xl border border-brand-red/30 bg-brand-red-soft px-4 py-3 text-xs font-semibold text-brand-red-deep">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg(null)} className="underline">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="mx-auto max-w-[1600px] px-5 py-6 sm:px-8">
        {loading ? (
          <div className="py-20 text-center text-sm text-ink/60">Loading RealtyCook CRM…</div>
        ) : view === "pipeline" ? (
          /* ================================================================ */
          /* VIEW 1: 7-STAGE KANBAN PIPELINE BOARD                            */
          /* ================================================================ */
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {PIPELINE_STAGES.map((st) => {
              const stageLeads = filteredLeads.filter((l) => l.stage === st.id);
              return (
                <div
                  key={st.id}
                  className="flex flex-col rounded-3xl border border-border/90 bg-cream-2/55 p-3"
                >
                  {/* Column Header */}
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md bg-ink px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                          {st.num}
                        </span>
                        <h2 className="text-xs font-bold text-ink">{st.label}</h2>
                      </div>
                      <p className="mt-0.5 text-[10px] text-ink/50">{st.hint}</p>
                    </div>
                    <span className="flex size-6 items-center justify-center rounded-full bg-white text-xs font-bold text-ink shadow-2xs">
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Cards Stack */}
                  <div className="flex flex-1 flex-col gap-2.5">
                    {stageLeads.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border/80 py-8 text-center text-[11px] text-ink/40">
                        No leads in {st.label}
                      </div>
                    ) : (
                      stageLeads.map((lead) => {
                        const assignee = users.find((u) => u.id === lead.assignedTo);
                        const lastComment = lead.comments[lead.comments.length - 1];
                        return (
                          <article
                            key={lead.id}
                            onClick={() => setSelectedLeadId(lead.id)}
                            className={cn(
                              "group cursor-pointer rounded-2xl border bg-white p-3.5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-red/50 hover:shadow-lift",
                              selectedLeadId === lead.id ? "border-brand-red ring-2 ring-brand-red/20" : "border-border",
                            )}
                          >
                            {/* Top Badges */}
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="rounded-md bg-brand-red-soft px-2 py-0.5 text-[10px] font-bold tracking-wide text-brand-red-deep uppercase">
                                {lead.intent} · {PILLAR_LABELS[lead.pillar] ?? lead.pillar}
                              </span>
                              <span className="font-mono text-[10px] font-semibold text-ink/55">
                                {BUDGET_LABELS[lead.budget] ?? lead.budget}
                              </span>
                            </div>

                            {/* Client Name & City */}
                            <h3 className="mt-2 text-sm font-bold text-ink">{lead.name}</h3>
                            <p className="text-xs text-ink/60">{lead.city || "Area TBD"}</p>

                            {/* Latest Comment Preview */}
                            {lastComment && (
                              <p className="mt-2 line-clamp-2 rounded-xl bg-cream/80 px-2.5 py-1.5 text-[11px] text-ink/75">
                                <strong className="text-ink">{lastComment.authorName.split(" ")[0]}:</strong>{" "}
                                {lastComment.body}
                              </p>
                            )}

                            {/* Follow-up Indicator */}
                            {lead.nextFollowupAt && (
                              <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-ink/60">
                                <Clock className="size-3 text-brand-red" />
                                <span>Follow-up: {formatShortDate(lead.nextFollowupAt)}</span>
                              </div>
                            )}

                            {/* Bottom Bar: Assignee + 1-Click WhatsApp */}
                            <div
                              className="mt-3 flex items-center justify-between gap-2 border-t border-border/70 pt-2.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <select
                                value={lead.assignedTo ?? ""}
                                onChange={(e) =>
                                  mutateCrm({
                                    action: "assign_lead",
                                    leadId: lead.id,
                                    targetUserId: e.target.value || null,
                                  })
                                }
                                aria-label={`Assign ${lead.name}`}
                                className="max-w-[115px] truncate rounded-lg border border-border bg-cream/60 px-2 py-1 text-[10px] font-semibold text-ink focus:outline-none"
                              >
                                <option value="">Unassigned</option>
                                {assignableUsers.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name.split(" ")[0]} ({u.role})
                                  </option>
                                ))}
                                {/* If currently assigned to someone outside sales view, still show their name */}
                                {assignee && !assignableUsers.some((u) => u.id === assignee.id) && (
                                  <option value={assignee.id} disabled>
                                    {assignee.name.split(" ")[0]} ({assignee.role})
                                  </option>
                                )}
                              </select>

                              <a
                                href={formatWhatsAppUrl(
                                  lead.phone,
                                  lead.name,
                                  activeUser?.name ?? "RealtyCook",
                                  PILLAR_LABELS[lead.pillar] ?? "property",
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-full bg-[#25D366] px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-[#1ebe5d]"
                              >
                                <MessageCircle className="size-3 fill-white text-[#25D366]" />
                                WhatsApp
                              </a>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : view === "followups" ? (
          /* ================================================================ */
          /* VIEW 2: FOLLOW-UP SCHEDULE & CONVERSATION QUEUE                  */
          /* ================================================================ */
          <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-lg font-bold text-ink">Scheduled Follow-Ups &amp; Active Conversations</h2>
              <p className="text-xs text-ink/60">
                Click any lead to log conversation notes, change stage, or message on WhatsApp.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-cream/50 text-xs font-semibold text-ink/55 uppercase">
                    <th className="p-4">Client</th>
                    <th className="p-4">Requirement</th>
                    <th className="p-4">Stage</th>
                    <th className="p-4">Assigned To</th>
                    <th className="p-4">Next Follow-Up</th>
                    <th className="p-4">Latest Conversation Note</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => {
                    const assignee = users.find((u) => u.id === lead.assignedTo);
                    const lastComment = lead.comments[lead.comments.length - 1];
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLeadId(lead.id)}
                        className="cursor-pointer border-b border-border/60 transition-colors hover:bg-cream/40 last:border-0"
                      >
                        <td className="p-4">
                          <p className="font-semibold text-ink">{lead.name}</p>
                          <p className="font-mono text-xs text-ink/55">{lead.phone}</p>
                        </td>
                        <td className="p-4">
                          <span className="rounded-md bg-brand-red-soft px-2 py-0.5 text-xs font-semibold text-brand-red-deep uppercase">
                            {lead.intent} · {PILLAR_LABELS[lead.pillar]}
                          </span>
                          <p className="mt-1 text-xs text-ink/60">
                            {BUDGET_LABELS[lead.budget] ?? lead.budget} · {lead.city || "Area TBD"}
                          </p>
                        </td>
                        <td className="p-4">
                          <span className="rounded-full border border-border bg-cream px-2.5 py-1 text-xs font-semibold text-ink">
                            {PIPELINE_STAGES.find((s) => s.id === lead.stage)?.label ?? lead.stage}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-semibold text-ink">
                          {assignee ? `${assignee.name} (${assignee.role})` : "Unassigned"}
                        </td>
                        <td className="p-4 text-xs font-semibold text-brand-red">
                          {formatShortDate(lead.nextFollowupAt)}
                        </td>
                        <td className="max-w-xs p-4 text-xs text-ink/70">
                          {lastComment ? `${lastComment.authorName}: "${lastComment.body}"` : "No comments yet"}
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={formatWhatsAppUrl(
                              lead.phone,
                              lead.name,
                              activeUser?.name ?? "RealtyCook",
                              PILLAR_LABELS[lead.pillar] ?? "property",
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1ebe5d]"
                          >
                            <MessageCircle className="size-3.5 fill-white text-[#25D366]" />
                            WhatsApp
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ================================================================ */
          /* VIEW 3: TEAM & ROLE MANAGEMENT (SUPERADMIN / ADMIN / SALES)      */
          /* ================================================================ */
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Existing Team Directory */}
            <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
              <div className="border-b border-border px-6 py-5">
                <h2 className="text-lg font-bold text-ink">Team Accounts &amp; Role Hierarchy</h2>
                <p className="mt-1 text-xs text-ink/60">
                  1 Superadmin account has full access. Admins can add/remove Sales accounts and assign leads to any
                  Sales account. Sales accounts can assign leads to themselves or other Sales accounts.
                </p>
              </div>
              <div className="divide-y divide-border/70">
                {users.map((u) => {
                  const canRemove =
                    u.role !== "superadmin" &&
                    (activeUser?.role === "superadmin" || (activeUser?.role === "admin" && u.role === "sales"));

                  return (
                    <div key={u.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={cn(
                            "flex size-11 items-center justify-center rounded-2xl font-heading text-sm font-bold text-white",
                            u.role === "superadmin"
                              ? "bg-brand-red"
                              : u.role === "admin"
                                ? "bg-ink"
                                : "bg-gold text-ink",
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
                            <p className="font-semibold text-ink">{u.name}</p>
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                                u.role === "superadmin"
                                  ? "bg-brand-red-soft text-brand-red-deep"
                                  : u.role === "admin"
                                    ? "bg-ink text-white"
                                    : "bg-gold-soft text-ink",
                              )}
                            >
                              {u.role}
                            </span>
                          </div>
                          <p className="text-xs text-ink/60">
                            {u.designation} · {u.email} · {u.phone}
                          </p>
                        </div>
                      </div>

                      {canRemove ? (
                        <button
                          type="button"
                          onClick={() => mutateCrm({ action: "remove_user", targetUserId: u.id })}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" /> Remove
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-ink/40">
                          {u.role === "superadmin" ? "Protected Superadmin" : "View only"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add New User Card (Visible to Superadmin & Admin) */}
            <div className="rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-brand-red-soft text-brand-red">
                  <UserPlus className="size-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-ink">Add Team Account</h3>
                  <p className="text-xs text-ink/60">
                    {activeUser?.role === "superadmin"
                      ? "As Superadmin, you can create Admin or Sales accounts."
                      : activeUser?.role === "admin"
                        ? "As Admin, you can create Sales accounts."
                        : "Sales accounts cannot add or remove users."}
                  </p>
                </div>
              </div>

              {activeUser?.role === "sales" ? (
                <div className="mt-6 rounded-2xl border border-border bg-cream p-5 text-xs text-ink/70">
                  Switch to <strong>Anuj Rattan (SUPERADMIN)</strong> or <strong>Karan Yadav (ADMIN)</strong> in the top
                  bar to add or remove team members.
                </div>
              ) : (
                <form onSubmit={handleAddTeamMember} className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="u-name">Full name</Label>
                    <Input id="u-name" name="name" required placeholder="e.g. Rohit Verma" className="h-10" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="u-email">Email</Label>
                      <Input id="u-email" name="email" type="email" required placeholder="rohit@realtycook.com" className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="u-phone">WhatsApp / Phone</Label>
                      <Input id="u-phone" name="phone" required placeholder="919876543212" className="h-10" />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="u-role">Role</Label>
                      <select
                        id="u-role"
                        name="role"
                        className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 text-sm"
                      >
                        <option value="sales">Sales Account</option>
                        {activeUser?.role === "superadmin" && <option value="admin">Admin Account</option>}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="u-desig">Designation</Label>
                      <Input id="u-desig" name="designation" placeholder="Sales Advisor" className="h-10" />
                    </div>
                  </div>
                  <Button type="submit" className="h-11 w-full rounded-full shadow-red">
                    Create Account
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* LEAD DETAIL, ASSIGNMENT, FOLLOW-UP & CONVERSATION DRAWER             */}
      {/* ==================================================================== */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-ink/50 backdrop-blur-xs"
          onClick={() => setSelectedLeadId(null)}
        >
          <div
            className="flex h-full w-full max-w-xl flex-col justify-between overflow-y-auto bg-white p-6 shadow-lift sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
                <div>
                  <span className="rounded-md bg-brand-red-soft px-2.5 py-1 text-xs font-bold text-brand-red-deep uppercase">
                    {selectedLead.intent} · {PILLAR_LABELS[selectedLead.pillar]}
                  </span>
                  <h2 className="mt-2 text-2xl font-bold text-ink">{selectedLead.name}</h2>
                  <p className="text-xs text-ink/60">
                    {selectedLead.phone} {selectedLead.email ? `· ${selectedLead.email}` : ""} ·{" "}
                    {selectedLead.city || "Area TBD"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={formatWhatsAppUrl(
                      selectedLead.phone,
                      selectedLead.name,
                      activeUser?.name ?? "RealtyCook",
                      PILLAR_LABELS[selectedLead.pillar] ?? "property",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-xs font-bold text-white shadow-soft hover:bg-[#1ebe5d]"
                  >
                    <MessageCircle className="size-4 fill-white text-[#25D366]" />
                    1-Click WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => setSelectedLeadId(null)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink/65 hover:bg-cream"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Stage & Assignment Controls */}
              <div className="mt-5 grid gap-4 rounded-2xl border border-border bg-cream/60 p-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs text-ink/55">Pipeline Stage</Label>
                  <select
                    value={selectedLead.stage}
                    onChange={(e) =>
                      mutateCrm({
                        action: "update_stage",
                        leadId: selectedLead.id,
                        stage: e.target.value as LeadStage,
                      })
                    }
                    className="mt-1.5 flex h-10 w-full rounded-xl border border-border bg-white px-3 text-xs font-semibold text-ink"
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.num} · {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs text-ink/55">
                    Assigned Account {activeUser?.role === "sales" && "(Sales accounts only)"}
                  </Label>
                  <select
                    value={selectedLead.assignedTo ?? ""}
                    onChange={(e) =>
                      mutateCrm({
                        action: "assign_lead",
                        leadId: selectedLead.id,
                        targetUserId: e.target.value || null,
                      })
                    }
                    className="mt-1.5 flex h-10 w-full rounded-xl border border-border bg-white px-3 text-xs font-semibold text-ink"
                  >
                    <option value="">Unassigned</option>
                    {assignableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conversation History */}
              <div className="mt-6">
                <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <MessageSquarePlus className="size-4 text-brand-red" />
                  Conversation Log &amp; Follow-Ups ({selectedLead.comments.length})
                </h3>

                <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1">
                  {selectedLead.comments.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-border p-5 text-center text-xs text-ink/50">
                      No conversation comments yet. Log your first call or WhatsApp update below.
                    </p>
                  ) : (
                    selectedLead.comments.map((c) => (
                      <div key={c.id} className="rounded-2xl border border-border bg-cream/50 p-3.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-ink">
                            {c.authorName}{" "}
                            <span className="font-mono text-[10px] font-normal text-ink/50 uppercase">
                              ({c.authorRole})
                            </span>
                          </span>
                          <span className="text-[10px] text-ink/45">{formatShortDate(c.createdAt)}</span>
                        </div>
                        <p className="mt-1.5 leading-relaxed text-ink/80">{c.body}</p>
                        {c.followupScheduledFor && (
                          <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-brand-red-soft px-2 py-0.5 text-[10px] font-semibold text-brand-red-deep">
                            <Calendar className="size-3" /> Follow-up scheduled:{" "}
                            {formatShortDate(c.followupScheduledFor)}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Comment & Schedule Follow-Up Form */}
              <form onSubmit={handleAddComment} className="mt-6 space-y-3 border-t border-border pt-5">
                <Label htmlFor="comment-body" className="text-xs font-bold text-ink">
                  Log Conversation Comment (as {activeUser?.name})
                </Label>
                <Textarea
                  id="comment-body"
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write summary of call / WhatsApp conversation, client preferences, or site visit feedback…"
                  required
                />

                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="flex-1">
                    <Label htmlFor="followup-dt" className="text-xs text-ink/60">
                      Schedule Next Follow-Up (Optional)
                    </Label>
                    <Input
                      id="followup-dt"
                      type="datetime-local"
                      value={followupInput}
                      onChange={(e) => setFollowupInput(e.target.value)}
                      className="mt-1 h-10 text-xs"
                    />
                  </div>
                  <Button type="submit" className="h-10 rounded-full px-5 text-xs shadow-red">
                    <Send className="size-3.5" /> Save Comment &amp; Follow-Up
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ADD NEW LEAD MODAL                                                   */}
      {/* ==================================================================== */}
      {showNewLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs"
          onClick={() => setShowNewLead(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-border bg-white p-6 shadow-lift sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold text-ink">Add New Lead to CRM</h2>
              <button
                type="button"
                onClick={() => setShowNewLead(false)}
                className="text-xs font-semibold text-ink/55 hover:text-ink"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="nl-name">Client Name</Label>
                  <Input id="nl-name" name="name" required placeholder="Full name" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nl-phone">WhatsApp / Phone</Label>
                  <Input id="nl-phone" name="phone" required placeholder="9198xxxxxxxx" className="h-10" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nl-intent">Intent</Label>
                  <select
                    id="nl-intent"
                    name="intent"
                    className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 text-xs font-semibold"
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                    <option value="invest">Invest</option>
                    <option value="lease">Leasing</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nl-pillar">Service Pillar</Label>
                  <select
                    id="nl-pillar"
                    name="pillar"
                    className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 text-xs font-semibold"
                  >
                    <option value="homes">Homes</option>
                    <option value="commercial">Commercial</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="land">Land Parcels</option>
                    <option value="leasing">Leasing</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nl-budget">Budget</Label>
                  <select
                    id="nl-budget"
                    name="budget"
                    defaultValue="1-3cr"
                    className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 text-xs font-semibold"
                  >
                    <option value="under-50l">Under ₹50 L</option>
                    <option value="50l-1cr">₹50 L – ₹1 Cr</option>
                    <option value="1-3cr">₹1 – 3 Cr</option>
                    <option value="3-10cr">₹3 – 10 Cr</option>
                    <option value="10cr-plus">₹10 Cr+</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nl-city">Preferred City / Sector</Label>
                <Input id="nl-city" name="city" placeholder="e.g. Mohali, Chandigarh, Sector 65 Gurugram" className="h-10" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nl-msg">Initial Conversation Note</Label>
                <Textarea id="nl-msg" name="message" rows={2} placeholder="Requirement details…" />
              </div>

              <Button type="submit" className="h-11 w-full rounded-full shadow-red">
                <CheckCircle2 className="size-4" /> Save Lead to Pipeline
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
