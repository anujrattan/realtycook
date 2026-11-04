"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  CrmAddPropertyModal,
  CrmBulkUploadModal,
  CrmNewLeadModal,
  CrmStageReasonModal,
} from "@/components/crm/crm-action-modals";
import { CrmDashboardPanel } from "@/components/crm/crm-dashboard-panel";
import { CrmFollowupToast } from "@/components/crm/crm-followup-toast";
import { CrmFollowupsView } from "@/components/crm/crm-followups-view";
import { CrmInventoryView } from "@/components/crm/crm-inventory-view";
import { CrmLeadRecordModal } from "@/components/crm/crm-lead-record-modal";
import { CrmPipelineBoard } from "@/components/crm/crm-pipeline-board";
import {
  type CrmNavId,
  type FollowupBucket,
  classifyFollowup,
  followupKey,
  getStageReasonOption,
  normalizeBudget,
  normalizeIntent,
  normalizeLeadStage,
  normalizePillar,
  normalizeStageReason,
  stageRequiresReason,
} from "@/components/crm/crm-shared";
import { CrmSidebar } from "@/components/crm/crm-sidebar";
import { CrmTeamView } from "@/components/crm/crm-team-view";
import { CrmTopbar } from "@/components/crm/crm-topbar";
import type {
  CrmLead,
  CrmProperty,
  CrmStateSnapshot,
  CrmUser,
  LeadIntent,
  LeadStage,
  ServicePillar,
  StageReason,
  UserRole,
} from "@/lib/crm-store";
import { cn } from "@/lib/utils";

export function CrmDashboard({ initialSnapshot }: { initialSnapshot: CrmStateSnapshot }) {
  const [snapshot, setSnapshot] = useState<CrmStateSnapshot>(initialSnapshot);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [actorId, setActorId] = useState<string>(initialSnapshot.users[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<CrmNavId>("dashboard");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [followupBucket, setFollowupBucket] = useState<FollowupBucket>("all");

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
  const [handledFollowupKeys, setHandledFollowupKeys] = useState<Set<string>>(() => new Set());

  const [showNewLead, setShowNewLead] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [pendingStageChange, setPendingStageChange] = useState<{
    leadId: string;
    targetStage: LeadStage;
  } | null>(null);
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
    if (!actor || nowMs === null) {
      return {
        today: [] as CrmLead[],
        upcoming: [] as CrmLead[],
        missed: [] as CrmLead[],
        all: [] as CrmLead[],
      };
    }
    const scoped =
      actor.role === "superadmin"
        ? snapshot.leads
        : snapshot.leads.filter((l) => l.assigned_to === actor.id);

    const today: CrmLead[] = [];
    const upcoming: CrmLead[] = [];
    const missed: CrmLead[] = [];

    for (const lead of scoped) {
      const status = classifyFollowup(lead.next_followup_at, nowMs);
      if (status === "today") today.push(lead);
      else if (status === "upcoming") upcoming.push(lead);
      else if (status === "missed") missed.push(lead);
    }

    const byTime = (a: CrmLead, b: CrmLead) =>
      new Date(a.next_followup_at ?? 0).getTime() - new Date(b.next_followup_at ?? 0).getTime();

    const todaySorted = today.sort(byTime);
    const upcomingSorted = upcoming.sort(byTime);
    const missedSorted = missed.sort(byTime);

    return {
      today: todaySorted,
      upcoming: upcomingSorted,
      missed: missedSorted,
      // Missed first, then today, then upcoming — so urgency stays visible in All
      all: [...missedSorted, ...todaySorted, ...upcomingSorted],
    };
  }, [snapshot.leads, actor, nowMs]);

  const pendingPopupFollowups = useMemo(() => {
    return [...myFollowups.missed, ...myFollowups.today].filter(
      (lead) => lead.next_followup_at && !handledFollowupKeys.has(followupKey(lead)),
    );
  }, [myFollowups.missed, myFollowups.today, handledFollowupKeys]);

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
        if (parsed?.users?.length && parsed?.leads?.length) {
          setSnapshot({
            ...parsed,
            leads: parsed.leads.map((lead) => ({
              ...lead,
              stage: normalizeLeadStage(lead.stage),
              closure_reason: normalizeStageReason(lead.closure_reason, lead.stage),
            })),
          });
        }
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

  function markFollowupHandled(lead: CrmLead | null | undefined) {
    if (!lead?.next_followup_at) return;
    const key = followupKey(lead);
    setHandledFollowupKeys((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }

  function advanceFollowupPopup(handledLead?: CrmLead | null) {
    if (handledLead) markFollowupHandled(handledLead);
    const handledKey = handledLead?.next_followup_at ? followupKey(handledLead) : null;
    const remaining = pendingPopupFollowups.filter((lead) => {
      if (!handledKey) return true;
      return followupKey(lead) !== handledKey;
    });
    setFollowupPopup(remaining[0] ?? null);
  }

  // Bottom-right popup: show next due/missed item that hasn't been acted on yet
  useEffect(() => {
    if (!actor || nowMs === null) return;

    if (pendingPopupFollowups.length === 0) {
      if (followupPopup) setFollowupPopup(null);
      return;
    }

    const currentStillPending =
      followupPopup &&
      pendingPopupFollowups.some(
        (lead) => lead.id === followupPopup.id && lead.next_followup_at === followupPopup.next_followup_at,
      );

    if (!currentStillPending) {
      setFollowupPopup(pendingPopupFollowups[0]);
    }
  }, [actor, nowMs, pendingPopupFollowups, followupPopup]);

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
        closure_reason: null,
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
          closure_reason: null,
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
      const closureReason =
        body.closureReason !== undefined
          ? (body.closureReason as StageReason | null)
          : undefined;
      if ((stage === "closed" || stage === "contacted") && !closureReason) {
        setBannerError("Pick a reason for this status before saving.");
        return false;
      }
      saveLocalSnapshot({
        ...snapshot,
        leads: snapshot.leads.map((l) => {
          if (l.id !== leadId) return l;
          const nextStage = stage ?? l.stage;
          const keepReason =
            nextStage === "closed" ||
            nextStage === "contacted" ||
            nextStage === "new_enquiry";
          return {
            ...l,
            stage: nextStage,
            closure_reason: keepReason
              ? (closureReason !== undefined ? closureReason : l.closure_reason)
              : null,
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
                    body: `Moved stage → ${String(stage).replace(/_/g, " ")}${
                      closureReason ? ` (${String(closureReason).replace(/_/g, " ")})` : ""
                    }.`,
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
    const previousFollowup = selectedLead;
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
      // Updating the lead from the record counts as acting on the current due follow-up
      advanceFollowupPopup(previousFollowup);
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
    if (stageRequiresReason(targetStage)) {
      setPendingStageChange({ leadId: lead.id, targetStage });
      return;
    }
    await postCrmAction({
      action: "update_stage",
      leadId: lead.id,
      stage: targetStage,
      closureReason: null,
    });
    setSelectedLeadId(lead.id);
  }

  async function handleStageReason(reason: StageReason) {
    if (!pendingStageChange) return;
    const option = getStageReasonOption(reason);
    if (!option) return;

    const nextFollowupAt = option.schedulesFollowup
      ? new Date(Date.now() + 24 * 3600 * 1000).toISOString()
      : undefined;

    const ok = await postCrmAction({
      action: "update_stage",
      leadId: pendingStageChange.leadId,
      stage: option.resultsIn,
      closureReason: reason,
      ...(nextFollowupAt ? { nextFollowupAt } : {}),
    });
    if (ok) {
      setSelectedLeadId(pendingStageChange.leadId);
      setPendingStageChange(null);
      setBannerSuccess(
        option.schedulesFollowup
          ? "Call outcome saved. Follow-up set for tomorrow."
          : "Status and reason saved.",
      );
    }
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


  const navTitles: Record<CrmNavId, { title: string; subtitle: string }> = {
    pipeline: {
      title: "Lead Pipeline",
      subtitle: "Drag cards across stages or open a lead record for full detail.",
    },
    followups: {
      title: "Follow-Ups",
      subtitle: "Green for today, yellow for upcoming, red for missed.",
    },
    inventory: {
      title: "Verified Inventory",
      subtitle: "Any CRM user can add properties. Each card shows who added it.",
    },
    team: {
      title: "User Management",
      subtitle: "Manage Superadmin, Admin, and Sales accounts.",
    },
    dashboard: {
      title: "Dashboard",
      subtitle: "Missed follow-ups, recent activity, and a full lead snapshot.",
    },
  };

  return (
    <div className="flex min-h-svh bg-cream text-ink">
      <CrmSidebar
        activeNav={activeTab}
        onNavigate={setActiveTab}
        counts={{
          pipeline: snapshot.leads.length,
          followups: myFollowups.today.length + myFollowups.missed.length,
          inventory: snapshot.properties.length,
          team: snapshot.users.length,
          missed: myFollowups.missed.length,
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <CrmTopbar
          title={navTitles[activeTab].title}
          subtitle={navTitles[activeTab].subtitle}
          storageMode={snapshot.storageMode}
          users={snapshot.users}
          actor={actor}
          onActorChange={(id) => {
            setActorId(id);
            setHandledFollowupKeys(new Set());
            setFollowupPopup(null);
          }}
          onBulkUpload={() => setShowBulkUpload(true)}
          onNewLead={() => setShowNewLead(true)}
        />

        {(bannerError || bannerSuccess) && (
          <div className="px-6 pt-4">
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

        <main className="flex-1 px-6 py-6">
          {activeTab === "pipeline" && (
            <CrmPipelineBoard
              filteredLeads={filteredLeads}
              users={snapshot.users}
              actor={actor}
              search={search}
              setSearch={setSearch}
              assigneeFilter={assigneeFilter}
              setAssigneeFilter={setAssigneeFilter}
              viewMode={viewMode}
              setViewMode={setViewMode}
              selectedLeadId={selectedLeadId}
              onSelectLead={setSelectedLeadId}
              draggingLeadId={draggingLeadId}
              dropStageId={dropStageId}
              setDraggingLeadId={setDraggingLeadId}
              setDropStageId={setDropStageId}
              onStageDrop={handleStageDrop}
              nowMs={nowMs}
            />
          )}

          {activeTab === "followups" && (
            <CrmFollowupsView
              myFollowups={myFollowups}
              followupBucket={followupBucket}
              setFollowupBucket={setFollowupBucket}
              nowMs={nowMs}
              users={snapshot.users}
              actor={actor}
              onOpenLead={(lead) => {
                advanceFollowupPopup(lead);
                setSelectedLeadId(lead.id);
              }}
              advanceFollowupPopup={advanceFollowupPopup}
            />
          )}

          {activeTab === "inventory" && (
            <CrmInventoryView
              properties={snapshot.properties}
              onAddProperty={() => setShowAddProperty(true)}
            />
          )}

          {activeTab === "team" && (
            <CrmTeamView
              users={snapshot.users}
              leads={snapshot.leads}
              actor={actor}
              busy={busy}
              newUserForm={newUserForm}
              setNewUserForm={setNewUserForm}
              onAddUser={handleAddUser}
              onRemoveUser={(userId) => postCrmAction({ action: "remove_user", targetUserId: userId })}
            />
          )}

          {activeTab === "dashboard" && (
            <CrmDashboardPanel
              myFollowups={myFollowups}
              recentActivity={recentActivity}
              leads={snapshot.leads}
              users={snapshot.users}
              nowMs={nowMs}
              onReviewLead={(leadId) => {
                setSelectedLeadId(leadId);
                setActiveTab("pipeline");
              }}
            />
          )}
        </main>
      </div>

      {selectedLead && (
        <CrmLeadRecordModal
          lead={selectedLead}
          onClose={() => setSelectedLeadId(null)}
          actor={actor}
          assignableUsers={assignableUsers}
          nowMs={nowMs}
          comments={selectedLeadComments}
          matchedProperties={matchedProperties}
          busy={busy}
          commentText={commentText}
          setCommentText={setCommentText}
          followupInput={followupInput}
          setFollowupInput={setFollowupInput}
          onSubmitComment={handleAddComment}
          siteVisitDate={siteVisitDate}
          setSiteVisitDate={setSiteVisitDate}
          siteVisitTime={siteVisitTime}
          setSiteVisitTime={setSiteVisitTime}
          siteVisitProperty={siteVisitProperty}
          setSiteVisitProperty={setSiteVisitProperty}
          onSubmitSiteVisit={handleSaveSiteVisit}
          onUpdateStage={(stage) => {
            if (stageRequiresReason(stage)) {
              setPendingStageChange({ leadId: selectedLead.id, targetStage: stage });
              return;
            }
            void postCrmAction({
              action: "update_stage",
              leadId: selectedLead.id,
              stage,
              closureReason: null,
            });
          }}
          onAssignLead={(targetUserId) =>
            postCrmAction({ action: "assign_lead", leadId: selectedLead.id, targetUserId })
          }
          onAssignToMe={() =>
            postCrmAction({ action: "assign_lead", leadId: selectedLead.id, targetUserId: actor.id })
          }
        />
      )}

      {followupPopup && (
        <CrmFollowupToast
          followupPopup={followupPopup}
          pendingPopupCount={pendingPopupFollowups.length}
          nowMs={nowMs}
          actor={actor}
          advanceFollowupPopup={advanceFollowupPopup}
          onOpenLead={(lead) => {
            advanceFollowupPopup(lead);
            setSelectedLeadId(lead.id);
          }}
        />
      )}

      <CrmNewLeadModal
        open={showNewLead}
        onClose={() => setShowNewLead(false)}
        busy={busy}
        form={newLeadForm}
        setForm={setNewLeadForm}
        onSubmit={handleCreateLead}
      />

      <CrmBulkUploadModal
        open={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        busy={busy}
        bulkPreviewCount={bulkPreviewCount}
        onFileSelected={parseExcelFile}
        onImport={handleBulkImport}
      />

      <CrmAddPropertyModal
        open={showAddProperty}
        onClose={() => setShowAddProperty(false)}
        busy={busy}
        actor={actor}
        form={propertyForm}
        setForm={setPropertyForm}
        onSubmit={handleAddProperty}
      />

      <CrmStageReasonModal
        key={`${pendingStageChange?.leadId ?? "none"}-${pendingStageChange?.targetStage ?? "none"}`}
        open={Boolean(pendingStageChange)}
        leadName={
          snapshot.leads.find((lead) => lead.id === pendingStageChange?.leadId)?.name ??
          "this lead"
        }
        targetStage={pendingStageChange?.targetStage ?? "closed"}
        busy={busy}
        onClose={() => setPendingStageChange(null)}
        onConfirm={handleStageReason}
      />
    </div>
  );
}
