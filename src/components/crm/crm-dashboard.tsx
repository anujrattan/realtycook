"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CrmAddPropertyModal,
  CrmBulkUploadModal,
  CrmNewLeadModal,
  CrmStageReasonModal,
} from "@/components/crm/crm-action-modals";
import {
  CrmProfileModal,
  profileFormFromUser,
  type ProfileFormState,
} from "@/components/crm/crm-profile-modal";
import { parseBulkLeadFile, type BulkLeadRow } from "@/lib/crm-bulk-import";
import { CrmDashboardPanel } from "@/components/crm/crm-dashboard-panel";
import { CrmTaskToast, type TaskDuePopup } from "@/components/crm/crm-task-toast";
import { CrmInventoryRecordModal } from "@/components/crm/crm-inventory-record-modal";
import { CrmInventoryView } from "@/components/crm/crm-inventory-view";
import { CrmLeadRecordModal } from "@/components/crm/crm-lead-record-modal";
import { CrmPipelineBoard } from "@/components/crm/crm-pipeline-board";
import { CrmTasksView } from "@/components/crm/crm-tasks-view";
import {
  type CrmNavId,
  type TaskBucket,
  classifyTaskDue,
  getStageReasonOption,
  normalizeBudget,
  normalizeIntent,
  normalizeLeadStage,
  normalizePillar,
  normalizeStageReason,
  stageRequiresReason,
  taskKey,
} from "@/components/crm/crm-shared";
import { CrmSidebar } from "@/components/crm/crm-sidebar";
import { CrmTeamView } from "@/components/crm/crm-team-view";
import { CrmTopbar } from "@/components/crm/crm-topbar";
import { suggestInventoryForLead } from "@/lib/crm-inventory";
import {
  canManageInventory,
  canManageUsers,
  newCrmId,
  type CrmLead,
  type CrmTask,
  CrmProperty,
  CrmStateSnapshot,
  CrmTaskType,
  CrmUser,
  LeadIntent,
  LeadStage,
  ServicePillar,
  StageReason,
  UserRole,
} from "@/lib/crm-store";
import type { InventoryEditForm } from "@/components/crm/crm-inventory-record-modal";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function CrmDashboard({
  initialSnapshot,
  sessionUserId,
}: {
  initialSnapshot: CrmStateSnapshot;
  sessionUserId: string;
}) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<CrmStateSnapshot>(initialSnapshot);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [actorId, setActorId] = useState<string>(
    sessionUserId || initialSnapshot.users[0]?.id || "",
  );
  const [activeTab, setActiveTab] = useState<CrmNavId>("dashboard");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [taskBucket, setTaskBucket] = useState<TaskBucket>("all");

  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<"all" | "mine" | "unassigned">("all");

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [taskType, setTaskType] = useState<CrmTaskType>("follow_up");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueInput, setTaskDueInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dropStageId, setDropStageId] = useState<LeadStage | null>(null);

  const [taskPopup, setTaskPopup] = useState<TaskDuePopup | null>(null);
  const [handledTaskKeys, setHandledTaskKeys] = useState<Set<string>>(() => new Set());

  const [showNewLead, setShowNewLead] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [pendingPropertyImages, setPendingPropertyImages] = useState<File[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    avatarUrl: null,
  });
  const [pendingStageChange, setPendingStageChange] = useState<{
    leadId: string;
    targetStage: LeadStage;
  } | null>(null);
  const [bulkPreviewCount, setBulkPreviewCount] = useState(0);
  const [bulkRows, setBulkRows] = useState<BulkLeadRow[]>([]);

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

  const visibleLeads = useMemo(() => {
    // Only superadmins see every lead. Everyone else sees unassigned + assigned-to-me.
    if (actor?.role === "superadmin") return snapshot.leads;
    return snapshot.leads.filter(
      (lead) => lead.assigned_to === null || lead.assigned_to === actor?.id,
    );
  }, [snapshot.leads, actor]);

  const filteredLeads = useMemo(() => {
    return visibleLeads.filter((lead) => {
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
  }, [visibleLeads, assigneeFilter, search, actor]);

  const myTasks = useMemo(() => {
    if (!actor || nowMs === null) {
      return {
        today: [] as CrmTask[],
        upcoming: [] as CrmTask[],
        missed: [] as CrmTask[],
        closed: [] as CrmTask[],
        all: [] as CrmTask[],
      };
    }
    const tasks = snapshot.tasks ?? [];
    const scoped =
      actor.role === "superadmin"
        ? tasks
        : tasks.filter((t) => t.assigned_to === actor.id || t.created_by === actor.id);

    const today: CrmTask[] = [];
    const upcoming: CrmTask[] = [];
    const missed: CrmTask[] = [];
    const closed: CrmTask[] = [];

    for (const task of scoped) {
      const status = classifyTaskDue(task.due_at, task.status, nowMs);
      if (status === "closed") closed.push(task);
      else if (status === "today") today.push(task);
      else if (status === "upcoming") upcoming.push(task);
      else if (status === "missed") missed.push(task);
    }

    const byDue = (a: CrmTask, b: CrmTask) =>
      new Date(a.due_at).getTime() - new Date(b.due_at).getTime();

    const todaySorted = today.sort(byDue);
    const upcomingSorted = upcoming.sort(byDue);
    const missedSorted = missed.sort(byDue);
    const closedSorted = closed.sort(
      (a, b) => new Date(b.completed_at ?? b.updated_at).getTime() - new Date(a.completed_at ?? a.updated_at).getTime(),
    );

    return {
      today: todaySorted,
      upcoming: upcomingSorted,
      missed: missedSorted,
      closed: closedSorted,
      all: [...missedSorted, ...todaySorted, ...upcomingSorted],
    };
  }, [snapshot.tasks, actor, nowMs]);

  const pendingTaskPopups = useMemo(() => {
    const urgent = [...myTasks.missed, ...myTasks.today].filter(
      (task) => !handledTaskKeys.has(taskKey(task)),
    );
    const items: TaskDuePopup[] = [];
    const seenLeads = new Set<string>();
    for (const task of urgent) {
      const lead = snapshot.leads.find((l) => l.id === task.lead_id);
      if (!lead || seenLeads.has(lead.id)) continue;
      seenLeads.add(lead.id);
      items.push({
        taskId: task.id,
        dueAt: task.due_at,
        title: task.title + (task.description ? ` — ${task.description}` : ""),
        lead,
      });
    }
    return items;
  }, [myTasks.missed, myTasks.today, handledTaskKeys, snapshot.leads]);

  const selectedLead: CrmLead | null = useMemo(
    () => visibleLeads.find((l) => l.id === selectedLeadId) ?? null,
    [visibleLeads, selectedLeadId],
  );

  const selectedProperty: CrmProperty | null = useMemo(
    () => snapshot.properties.find((p) => p.id === selectedPropertyId) ?? null,
    [snapshot.properties, selectedPropertyId],
  );

  const selectedLeadComments = useMemo(
    () => snapshot.comments.filter((c) => c.lead_id === selectedLeadId),
    [snapshot.comments, selectedLeadId],
  );

  const matchedProperties = useMemo(
    () => suggestInventoryForLead(snapshot.properties, selectedLead, 8),
    [snapshot.properties, selectedLead],
  );

  const recentActivity = useMemo(() => {
    const comments =
      actor?.role === "superadmin"
        ? snapshot.comments
        : snapshot.comments.filter((c) => c.author_id === actor?.id);
    return [...comments].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 25);
  }, [snapshot.comments, actor]);

  const selectedLeadTasks = useMemo(
    () => (snapshot.tasks ?? []).filter((t) => t.lead_id === selectedLeadId),
    [snapshot.tasks, selectedLeadId],
  );

  useEffect(() => {
    if (sessionUserId) setActorId(sessionUserId);
  }, [sessionUserId]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Still send user to login
    }
    router.replace("/login");
    router.refresh();
  }

  useEffect(() => {
    setNowMs(Date.now());
    const tick = window.setInterval(() => setNowMs(Date.now()), 30_000);
    let cancelled = false;

    async function hydrateFromServer() {
      try {
        const res = await fetch("/api/crm", { cache: "no-store" });
        if (!res.ok) throw new Error(`CRM snapshot HTTP ${res.status}`);
        const data = (await res.json()) as CrmStateSnapshot;
        if (cancelled || !data?.users?.length) return;
        const next: CrmStateSnapshot = {
          ...data,
          leads: (data.leads ?? []).map((lead) => ({
            ...lead,
            stage: normalizeLeadStage(lead.stage),
            closure_reason: normalizeStageReason(lead.closure_reason, lead.stage),
          })),
          properties: data.properties ?? [],
          tasks: data.tasks ?? [],
        };
        setSnapshot(next);
        try {
          window.localStorage.setItem("rc_crm_snapshot_v5", JSON.stringify(next));
          window.localStorage.removeItem("rc_crm_snapshot_v4");
          window.localStorage.removeItem("rc_crm_snapshot_v3");
          window.localStorage.removeItem("rc_crm_snapshot_v2");
        } catch {
          // ignore quota / private mode
        }
        return;
      } catch {
        // Fall back to cached snapshot only when the API is unreachable.
      }

      try {
        const saved =
          window.localStorage.getItem("rc_crm_snapshot_v5") ??
          window.localStorage.getItem("rc_crm_snapshot_v4") ??
          window.localStorage.getItem("rc_crm_snapshot_v3");
        if (!saved) return;
        const parsed = JSON.parse(saved) as CrmStateSnapshot;
        if (cancelled || !parsed?.users?.length) return;
        setSnapshot({
          ...parsed,
          leads: (parsed.leads ?? []).map((lead) => ({
            ...lead,
            stage: normalizeLeadStage(lead.stage),
            closure_reason: normalizeStageReason(lead.closure_reason, lead.stage),
          })),
          properties: parsed.properties ?? [],
          tasks: parsed.tasks ?? [],
        });
      } catch {
        // ignore
      }
    }

    void hydrateFromServer();
    return () => {
      cancelled = true;
      window.clearInterval(tick);
    };
  }, []);

  useEffect(() => {
    if (!selectedLead) return;
    setSiteVisitDate(selectedLead.site_visit_date ?? "");
    setSiteVisitTime(selectedLead.site_visit_time ?? "");
    setSiteVisitProperty(selectedLead.site_visit_property ?? "");
  }, [selectedLead?.id, selectedLead?.site_visit_date, selectedLead?.site_visit_time, selectedLead?.site_visit_property]);

  useEffect(() => {
    if (!selectedLeadId && !selectedPropertyId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSelectedLeadId(null);
      setSelectedPropertyId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedLeadId, selectedPropertyId]);

  useEffect(() => {
    if (activeTab === "team" && !canManageUsers(actor)) {
      setActiveTab("dashboard");
    }
  }, [activeTab, actor]);

  useEffect(() => {
    if (selectedLeadId && !visibleLeads.some((l) => l.id === selectedLeadId)) {
      setSelectedLeadId(null);
    }
  }, [selectedLeadId, visibleLeads]);

  function advanceTaskPopup(handled?: TaskDuePopup | null) {
    if (handled) {
      setHandledTaskKeys((prev) => {
        const next = new Set(prev);
        next.add(taskKey({ id: handled.taskId, due_at: handled.dueAt, status: "open" }));
        return next;
      });
    }
    const remaining = pendingTaskPopups.filter((item) =>
      handled ? item.taskId !== handled.taskId : true,
    );
    setTaskPopup(remaining[0] ?? null);
  }

  // Bottom-right popup: next missed / due-today task that hasn't been dismissed yet
  useEffect(() => {
    if (!actor || nowMs === null) return;

    if (pendingTaskPopups.length === 0) {
      if (taskPopup) setTaskPopup(null);
      return;
    }

    const currentStillPending =
      taskPopup && pendingTaskPopups.some((item) => item.taskId === taskPopup.taskId);

    if (!currentStillPending) {
      setTaskPopup(pendingTaskPopups[0] ?? null);
    }
  }, [actor, nowMs, pendingTaskPopups, taskPopup]);

  function saveLocalSnapshot(next: CrmStateSnapshot) {
    const normalized: CrmStateSnapshot = { ...next, tasks: next.tasks ?? [] };
    setSnapshot(normalized);
    try {
      window.localStorage.setItem("rc_crm_snapshot_v5", JSON.stringify(normalized));
      window.localStorage.removeItem("rc_crm_snapshot_v4");
      window.localStorage.removeItem("rc_crm_snapshot_v3");
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
        id: newCrmId(),
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
        next_task_due_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
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
          id: newCrmId(),
          name,
          phone: phone.length === 10 ? `91${phone}` : phone,
          email: String(row.email ?? "").trim(),
          city: String(row.city ?? "").trim(),
          intent: normalizeIntent(row.intent),
          pillar: normalizePillar(row.pillar),
          budget: normalizeBudget(row.budget),
          stage: "new_enquiry",
          source: `Bulk Upload (${actor.name})`,
          assigned_to: actor.role === "sales" ? actor.id : null,
          next_task_due_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
          site_visit_date: null,
          site_visit_time: null,
          site_visit_property: null,
          closure_reason: null,
          notes_summary: String(row.notes_summary ?? "Imported via bulk upload"),
          created_at: now,
          updated_at: now,
        });
      }
      if (!created.length) {
        setBannerError("No valid leads found. Need Name + Phone on each row.");
        return false;
      }
      saveLocalSnapshot({ ...snapshot, leads: [...created, ...snapshot.leads] });
      setBannerSuccess(`Imported ${created.length} leads from upload.`);
      return true;
    }

    if (action === "update_lead") {
      const leadId = String(body.leadId ?? "");
      const existing = snapshot.leads.find((l) => l.id === leadId);
      if (!existing) {
        setBannerError("Lead not found.");
        return false;
      }
      const name = String(body.name ?? existing.name).trim();
      const phoneDigits = String(body.phone ?? existing.phone).replace(/\D/g, "");
      if (name.length < 2 || phoneDigits.length < 10) {
        setBannerError("Name and a valid phone number are required.");
        return false;
      }
      const next: CrmLead = {
        ...existing,
        name,
        phone: phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits,
        email: String(body.email ?? existing.email).trim(),
        city: String(body.city ?? existing.city).trim(),
        intent: normalizeIntent(body.intent ?? existing.intent),
        pillar: normalizePillar(body.pillar ?? existing.pillar),
        budget: normalizeBudget(body.budget ?? existing.budget),
        notes_summary: String(body.notes_summary ?? existing.notes_summary).trim(),
        updated_at: now,
      };
      saveLocalSnapshot({
        ...snapshot,
        leads: snapshot.leads.map((l) => (l.id === leadId ? next : l)),
      });
      setBannerSuccess("Lead details saved.");
      return true;
    }

    if (action === "add_property") {
      if (!canManageInventory(actor)) {
        setBannerError("Only Superadmin, Admin, and SVP Sales can add inventory.");
        return false;
      }
      const title = String(body.title ?? "").trim();
      const locality = String(body.locality ?? "").trim();
      const price_label = String(body.price_label ?? "").trim();
      if (title.length < 3 || locality.length < 2 || !price_label) {
        setBannerError("Property title, locality, and price are required.");
        return false;
      }
      const prop: CrmProperty = {
        id: newCrmId(),
        title,
        pillar: (body.pillar as ServicePillar) ?? "homes",
        intent: (body.intent as LeadIntent) ?? "buy",
        locality,
        price_label,
        budget_bracket: String(body.budget_bracket ?? "1-3cr"),
        specs: String(body.specs ?? "").trim() || "Verified RealtyCook Mandate",
        verification_badge: String(body.verification_badge ?? "Ground Verified").trim(),
        image_urls: [],
        cover_image_url: null,
        added_by_id: actor.id,
        added_by_name: actor.name,
        added_by_role: actor.role,
        created_at: now,
        active: true,
      };
      saveLocalSnapshot({ ...snapshot, properties: [prop, ...snapshot.properties] });
      return true;
    }

    if (action === "update_property") {
      if (!canManageInventory(actor)) {
        setBannerError("Only Superadmin, Admin, and SVP Sales can edit inventory.");
        return false;
      }
      const propertyId = String(body.propertyId ?? "");
      const existing = snapshot.properties.find((p) => p.id === propertyId);
      if (!existing) {
        setBannerError("Inventory unit not found.");
        return false;
      }
      let inventory: Record<string, unknown> = {};
      let summary = String(body.summary ?? "");
      try {
        const parsed = JSON.parse(existing.specs || "{}") as {
          summary?: string;
          inventory?: Record<string, unknown>;
        };
        inventory = { ...(parsed.inventory || {}) };
        summary = summary || parsed.summary || "";
      } catch {
        summary = summary || existing.specs;
      }
      const invPatchKeys = [
        "project_name",
        "property_type",
        "city",
        "locality_area",
        "developer_name",
        "rera_number",
        "configuration",
        "unit_details",
        "possession_status",
        "availability_status",
        "furnishing_status",
        "verification_status",
        "amenities",
        "internal_notes",
        "parking_included",
        "power_backup",
      ] as const;
      for (const key of invPatchKeys) {
        if (body[key] !== undefined) inventory[key] = body[key];
      }
      if (body.quoted_price !== undefined) {
        inventory.quoted_price =
          body.quoted_price === "" || body.quoted_price == null ? null : Number(body.quoted_price);
      }
      if (body.price_per_sqft !== undefined) {
        inventory.price_per_sqft =
          body.price_per_sqft === "" || body.price_per_sqft == null ? null : Number(body.price_per_sqft);
      }
      const next: CrmProperty = {
        ...existing,
        title: String(body.title ?? existing.title),
        locality: String(body.locality ?? existing.locality),
        price_label: String(body.price_label ?? existing.price_label),
        budget_bracket: String(body.budget_bracket ?? existing.budget_bracket),
        pillar: (body.pillar as ServicePillar) ?? existing.pillar,
        intent: (body.intent as LeadIntent) ?? existing.intent,
        verification_badge: String(body.verification_badge ?? existing.verification_badge),
        specs: JSON.stringify({ summary: summary || "Inventory unit", inventory }),
      };
      saveLocalSnapshot({
        ...snapshot,
        properties: snapshot.properties.map((p) => (p.id === propertyId ? next : p)),
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
            next_task_due_at:
              body.nextTaskDueAt !== undefined
                ? (body.nextTaskDueAt as string | null)
                : l.next_task_due_at,
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
                  id: newCrmId(),
                  lead_id: leadId,
                  author_id: actor.id,
                  author_name: actor.name,
                  author_role: actor.role,
                  body: `Scheduled Site Visit on ${String(body.siteVisitDate)}${
                    body.siteVisitTime ? ` at ${String(body.siteVisitTime)}` : " (time flexible)"
                  }${body.siteVisitProperty ? ` for ${String(body.siteVisitProperty)}` : ""}.`,
                  task_scheduled_for: null,
                  created_at: now,
                },
                ...snapshot.comments,
              ]
            : stage
              ? [
                  {
                    id: newCrmId(),
                    lead_id: leadId,
                    author_id: actor.id,
                    author_name: actor.name,
                    author_role: actor.role,
                    body: `Moved stage → ${String(stage).replace(/_/g, " ")}${
                      closureReason ? ` (${String(closureReason).replace(/_/g, " ")})` : ""
                    }.`,
                    task_scheduled_for: null,
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
      const nextTaskDueAt = body.nextTaskDueAt ? String(body.nextTaskDueAt) : null;
      saveLocalSnapshot({
        ...snapshot,
        comments: [
          {
            id: newCrmId(),
            lead_id: leadId,
            author_id: actor.id,
            author_name: actor.name,
            author_role: actor.role,
            body: text,
            task_scheduled_for: nextTaskDueAt,
            created_at: now,
          },
          ...snapshot.comments,
        ],
        leads: snapshot.leads.map((l) =>
          l.id === leadId
            ? {
                ...l,
                notes_summary: text,
                next_task_due_at: nextTaskDueAt ?? l.next_task_due_at,
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
      const fullName = String(body.name ?? "").trim();
      const nameParts = fullName.split(/\s+/);
      saveLocalSnapshot({
        ...snapshot,
        users: [
          ...snapshot.users,
          {
            id: newCrmId(),
            name: fullName,
            first_name: nameParts[0] || "",
            last_name: nameParts.slice(1).join(" "),
            address: "",
            avatar_url: null,
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

    if (action === "update_profile") {
      const firstName = String(body.firstName ?? "").trim();
      const lastName = String(body.lastName ?? "").trim();
      if (!firstName) {
        setBannerError("First name is required.");
        return false;
      }
      const email = String(body.email ?? "").trim().toLowerCase();
      const phoneRaw = String(body.phone ?? "").replace(/\D/g, "");
      if (!email.includes("@") || phoneRaw.length < 10) {
        setBannerError("Valid email and phone are required.");
        return false;
      }
      const phone = phoneRaw.length === 10 ? `91${phoneRaw}` : phoneRaw;
      const name = [firstName, lastName].filter(Boolean).join(" ");
      const avatarUrl =
        body.avatarUrl === undefined
          ? undefined
          : body.avatarUrl === null
            ? null
            : String(body.avatarUrl);
      saveLocalSnapshot({
        ...snapshot,
        users: snapshot.users.map((u) =>
          u.id === actor.id
            ? {
                ...u,
                first_name: firstName,
                last_name: lastName,
                name,
                email,
                phone,
                address: String(body.address ?? "").trim(),
                ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
              }
            : u,
        ),
      });
      setBannerSuccess("Profile updated.");
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

    if (action === "create_task") {
      const leadId = String(body.leadId ?? "");
      const lead = snapshot.leads.find((l) => l.id === leadId);
      const taskTypeValue = (String(body.taskType ?? "todo") as CrmTaskType) || "todo";
      let title = String(body.title ?? "").trim();
      if (!title && lead) {
        if (taskTypeValue === "follow_up") title = `Follow up with ${lead.name}`;
        else if (taskTypeValue === "call") title = `Call ${lead.name}`;
        else if (taskTypeValue === "email") title = `Email ${lead.name}`;
        else if (taskTypeValue === "meeting") title = `Meeting with ${lead.name}`;
      }
      const dueAt = body.dueAt ? new Date(String(body.dueAt)).toISOString() : "";
      if (!leadId || title.length < 3 || !dueAt || Number.isNaN(new Date(dueAt).getTime())) {
        setBannerError("Task title and a valid due date are required.");
        return false;
      }
      const task: CrmTask = {
        id: newCrmId(),
        lead_id: leadId,
        title,
        description: String(body.description ?? "").trim(),
        task_type: taskTypeValue,
        status: "open",
        due_at: dueAt,
        assigned_to: body.assignedTo ? String(body.assignedTo) : actor.id,
        created_by: actor.id,
        completed_at: null,
        created_at: now,
        updated_at: now,
      };
      saveLocalSnapshot({
        ...snapshot,
        tasks: [task, ...(snapshot.tasks ?? [])],
        leads: snapshot.leads.map((l) =>
          l.id === leadId ? { ...l, next_task_due_at: dueAt, updated_at: now } : l,
        ),
      });
      return true;
    }

    if (action === "update_task") {
      const taskId = String(body.taskId ?? "");
      const existing = (snapshot.tasks ?? []).find((t) => t.id === taskId);
      if (!existing) {
        setBannerError("Task not found.");
        return false;
      }
      const nextStatus = (body.status as CrmTask["status"] | undefined) ?? existing.status;
      saveLocalSnapshot({
        ...snapshot,
        tasks: (snapshot.tasks ?? []).map((t) =>
          t.id === taskId
            ? {
                ...t,
                title: body.title !== undefined ? String(body.title) : t.title,
                description: body.description !== undefined ? String(body.description) : t.description,
                due_at: body.dueAt ? new Date(String(body.dueAt)).toISOString() : t.due_at,
                status: nextStatus,
                assigned_to:
                  body.assignedTo === undefined
                    ? t.assigned_to
                    : body.assignedTo
                      ? String(body.assignedTo)
                      : null,
                completed_at: nextStatus === "closed" ? t.completed_at ?? now : null,
                updated_at: now,
              }
            : t,
        ),
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
    const ok = await postCrmAction({
      action: "add_comment",
      leadId: selectedLead.id,
      body: commentText,
    });
    if (ok) {
      setCommentText("");
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

  async function handleSaveInventory(form: InventoryEditForm) {
    if (!selectedPropertyId) return false;
    return postCrmAction({
      action: "update_property",
      propertyId: selectedPropertyId,
      ...form,
    });
  }

  async function postPropertyImages(
    propertyId: string,
    opts:
      | { mode: "upload"; files: File[] }
      | { mode: "delete"; imageUrl: string }
      | { mode: "set_cover"; imageUrl: string },
    manageBusy = true,
  ) {
    if (manageBusy) setBusy(true);
    setBannerError(null);
    try {
      let res: Response;
      if (opts.mode === "upload") {
        const form = new FormData();
        form.set("actorId", actor.id);
        form.set("propertyId", propertyId);
        for (const file of opts.files) form.append("files", file);
        res = await fetch("/api/crm/property-images", { method: "POST", body: form });
      } else {
        res = await fetch("/api/crm/property-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: opts.mode,
            actorId: actor.id,
            propertyId,
            imageUrl: opts.imageUrl,
          }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBannerError(data.error ?? "Image action failed.");
        return false;
      }
      if (data.snapshot) saveLocalSnapshot(data.snapshot as CrmStateSnapshot);
      return true;
    } catch {
      setBannerError("Image action failed.");
      return false;
    } finally {
      if (manageBusy) setBusy(false);
    }
  }

  async function handleAddProperty(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setBannerError(null);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_property", actorId: actor.id, ...propertyForm }),
      });
      if (res.status === 404 || res.status === 405) {
        const ok = applyLocalFallbackAction({ action: "add_property", ...propertyForm });
        if (ok) {
          setShowAddProperty(false);
          setPendingPropertyImages([]);
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
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setBannerError(data.error ?? "Could not add property.");
        return;
      }
      if (data.snapshot) saveLocalSnapshot(data.snapshot as CrmStateSnapshot);
      const propertyId = (data.property as CrmProperty | undefined)?.id;
      if (propertyId && pendingPropertyImages.length > 0) {
        const uploaded = await postPropertyImages(
          propertyId,
          { mode: "upload", files: pendingPropertyImages },
          false,
        );
        if (!uploaded) {
          setBannerSuccess("Property saved, but some images failed to upload.");
        } else {
          setBannerSuccess("Property and images saved.");
        }
      }
      setShowAddProperty(false);
      setPendingPropertyImages([]);
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
      if (propertyId) setSelectedPropertyId(propertyId);
    } catch {
      const ok = applyLocalFallbackAction({ action: "add_property", ...propertyForm });
      if (ok) {
        setShowAddProperty(false);
        setPendingPropertyImages([]);
      }
    } finally {
      setBusy(false);
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

  async function handleStageReason(reason: StageReason, discussion: string) {
    if (!pendingStageChange) return;
    const option = getStageReasonOption(reason);
    if (!option) return;
    const note = discussion.trim();
    const discussionRequired = option.group === "Connected";
    if (discussionRequired && !note) {
      setBannerError("Add a discussion summary for Connected outcomes.");
      return;
    }

    const leadId = pendingStageChange.leadId;
    const leadName =
      snapshot.leads.find((l) => l.id === leadId)?.name ?? "lead";
    const nextTaskDueAt = option.createsFollowUpTask
      ? new Date(Date.now() + 24 * 3600 * 1000).toISOString()
      : undefined;

    const ok = await postCrmAction({
      action: "update_stage",
      leadId,
      stage: option.resultsIn,
      closureReason: reason,
    });
    if (!ok) return;

    if (note) {
      await postCrmAction({
        action: "add_comment",
        leadId,
        body: `${option.label}\n\n${note}`,
      });
    }

    if (nextTaskDueAt) {
      await postCrmAction({
        action: "create_task",
        leadId,
        taskType: "follow_up",
        title: `Follow up with ${leadName}`,
        description: option.label,
        dueAt: nextTaskDueAt,
        assignedTo: actor.id,
      });
    }

    setSelectedLeadId(leadId);
    setPendingStageChange(null);
    setBannerSuccess(
      option.createsFollowUpTask
        ? "Call outcome saved. Follow-up task set for tomorrow."
        : note
          ? "Status and discussion saved to the timeline."
          : "Status saved.",
    );
  }

  async function parseBulkFile(file: File) {
    setBannerError(null);
    setBusy(true);
    try {
      const rows = await parseBulkLeadFile(file);
      setBulkRows(rows);
      setBulkPreviewCount(rows.length);
      if (!rows.length) {
        setBannerError("No valid rows found. The file must include Name and Phone for each lead.");
      } else {
        setBannerSuccess(`Parsed ${rows.length} lead${rows.length === 1 ? "" : "s"} from ${file.name}.`);
      }
    } catch {
      setBulkRows([]);
      setBulkPreviewCount(0);
      setBannerError("Could not parse that file. Use .xlsx, .xls, .csv, or .pdf with Name + Phone.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveLead(form: {
    name: string;
    phone: string;
    email: string;
    city: string;
    intent: LeadIntent;
    pillar: ServicePillar;
    budget: string;
    notes_summary: string;
  }) {
    if (!selectedLeadId) return false;
    return postCrmAction({
      action: "update_lead",
      leadId: selectedLeadId,
      ...form,
    });
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLeadId) return;
    if (!taskDueInput || (taskType === "todo" && !taskTitle.trim())) {
      setBannerError(
        taskType === "todo"
          ? "Task title and due date are required."
          : "Due date is required.",
      );
      return;
    }
    const ok = await postCrmAction({
      action: "create_task",
      leadId: selectedLeadId,
      taskType,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      dueAt: new Date(taskDueInput).toISOString(),
      assignedTo: actor.id,
    });
    if (ok) {
      setTaskTitle("");
      setTaskDescription("");
      setTaskDueInput("");
      setTaskType("follow_up");
      setBannerSuccess("Task created.");
    }
  }

  async function handleCloseLeadTask(taskId: string) {
    const ok = await postCrmAction({ action: "update_task", taskId, status: "closed" });
    if (ok) setBannerSuccess("Task closed.");
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
    tasks: {
      title: "Tasks",
      subtitle: "Follow-ups, calls, emails & to-dos — missed · due today · upcoming · closed.",
    },
    inventory: {
      title: "Verified Inventory",
      subtitle: "Inventory Master units — list view by default; filter or switch to cards, expand a row for full details.",
    },
    team: {
      title: "User Management",
      subtitle: "Manage Superadmin, Admin, and Sales accounts.",
    },
    dashboard: {
      title: "Dashboard",
      subtitle: "Tasks, Activity, and full Lead snapshot.",
    },
  };

  return (
    <div className="flex min-h-svh bg-cream text-ink">
      <CrmSidebar
        activeNav={activeTab}
        onNavigate={(id) => {
          if (id === "team" && !canManageUsers(actor)) return;
          setActiveTab(id);
        }}
        showUserManagement={canManageUsers(actor)}
        counts={{
          pipeline: visibleLeads.length,
          tasks: myTasks.today.length + myTasks.missed.length,
          inventory: snapshot.properties.length,
          team: snapshot.users.length,
          missed: myTasks.missed.length,
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <CrmTopbar
          title={navTitles[activeTab].title}
          subtitle={navTitles[activeTab].subtitle}
          storageMode={snapshot.storageMode}
          actor={actor}
          onLogout={() => {
            void handleLogout();
          }}
          onBulkUpload={() => setShowBulkUpload(true)}
          onNewLead={() => setShowNewLead(true)}
          onOpenProfile={() => {
            if (actor) {
              setProfileForm(profileFormFromUser(actor));
              setShowProfile(true);
            }
          }}
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

          {activeTab === "tasks" && (
            <CrmTasksView
              myTasks={myTasks}
              taskBucket={taskBucket}
              setTaskBucket={setTaskBucket}
              nowMs={nowMs}
              leads={visibleLeads}
              users={snapshot.users}
              actor={actor}
              busy={busy}
              onOpenLead={(leadId) => {
                setSelectedLeadId(leadId);
                setActiveTab("pipeline");
              }}
              onCloseTask={(taskId) => {
                void postCrmAction({ action: "update_task", taskId, status: "closed" });
              }}
            />
          )}

          {activeTab === "inventory" && (
            <CrmInventoryView
              properties={snapshot.properties}
              selectedPropertyId={selectedPropertyId}
              onSelectProperty={setSelectedPropertyId}
              canManageInventory={canManageInventory(actor)}
              onAddProperty={() => setShowAddProperty(true)}
            />
          )}

          {activeTab === "team" && canManageUsers(actor) && (
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
              missedTasks={myTasks.missed}
              recentActivity={recentActivity}
              recentActivityTitle="Recent Activity"
              recentActivitySubtitle={
                actor.role === "superadmin"
                  ? "Latest comments and updates across the whole team."
                  : "Your latest comments, stage moves, and notes."
              }
              leads={visibleLeads}
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

      {selectedProperty && (
        <CrmInventoryRecordModal
          property={selectedProperty}
          canEdit={canManageInventory(actor)}
          busy={busy}
          onClose={() => setSelectedPropertyId(null)}
          onSave={handleSaveInventory}
          onUploadImages={(files) =>
            postPropertyImages(selectedProperty.id, { mode: "upload", files })
          }
          onDeleteImage={(imageUrl) =>
            postPropertyImages(selectedProperty.id, { mode: "delete", imageUrl })
          }
          onSetCoverImage={(imageUrl) =>
            postPropertyImages(selectedProperty.id, { mode: "set_cover", imageUrl })
          }
        />
      )}

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
          onSaveLead={handleSaveLead}
          leadTasks={selectedLeadTasks}
          taskType={taskType}
          setTaskType={setTaskType}
          taskTitle={taskTitle}
          setTaskTitle={setTaskTitle}
          taskDescription={taskDescription}
          setTaskDescription={setTaskDescription}
          taskDueInput={taskDueInput}
          setTaskDueInput={setTaskDueInput}
          onCreateTask={handleCreateTask}
          onCloseTask={handleCloseLeadTask}
        />
      )}

      {taskPopup && (
        <CrmTaskToast
          popup={taskPopup}
          pendingCount={pendingTaskPopups.length}
          nowMs={nowMs}
          actor={actor}
          onDismiss={advanceTaskPopup}
          onOpenLead={(lead) => {
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
        onFileSelected={(file) => {
          void parseBulkFile(file);
        }}
        onImport={handleBulkImport}
      />

      <CrmAddPropertyModal
        open={showAddProperty && canManageInventory(actor)}
        onClose={() => {
          setShowAddProperty(false);
          setPendingPropertyImages([]);
        }}
        busy={busy}
        actor={actor}
        form={propertyForm}
        setForm={setPropertyForm}
        pendingImages={pendingPropertyImages}
        setPendingImages={setPendingPropertyImages}
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

      {actor ? (
        <CrmProfileModal
          open={showProfile}
          busy={busy}
          user={actor}
          form={profileForm}
          setForm={setProfileForm}
          onClose={() => setShowProfile(false)}
          onSubmit={(e) => {
            e.preventDefault();
            void (async () => {
              const ok = await postCrmAction({
                action: "update_profile",
                firstName: profileForm.firstName,
                lastName: profileForm.lastName,
                email: profileForm.email,
                phone: profileForm.phone,
                address: profileForm.address,
                avatarUrl: profileForm.avatarUrl,
              });
              if (ok) {
                setBannerSuccess("Profile updated.");
                setShowProfile(false);
              }
            })();
          }}
        />
      ) : null}
    </div>
  );
}
