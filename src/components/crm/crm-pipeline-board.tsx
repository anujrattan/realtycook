"use client";

import { Clock, GripVertical, Kanban, LayoutList, MapPin, MessageCircle, Search } from "lucide-react";
import type { CrmLead, CrmUser, LeadStage } from "@/lib/crm-store";
import { cn } from "@/lib/utils";
import {
  BUDGET_LABELS,
  buildWhatsAppUrl,
  formatShortDate,
  formatSiteVisit,
  isFollowupOverdue,
  PILLAR_LABELS,
  STAGES,
} from "@/components/crm/crm-shared";

export type AssigneeFilter = "all" | "mine" | "unassigned";
export type PipelineViewMode = "kanban" | "list";

export type CrmPipelineBoardProps = {
  filteredLeads: CrmLead[];
  users: CrmUser[];
  actor: CrmUser;
  search: string;
  setSearch: (value: string) => void;
  assigneeFilter: AssigneeFilter;
  setAssigneeFilter: (value: AssigneeFilter) => void;
  viewMode: PipelineViewMode;
  setViewMode: (value: PipelineViewMode) => void;
  selectedLeadId: string | null;
  onSelectLead: (leadId: string) => void;
  draggingLeadId: string | null;
  dropStageId: LeadStage | null;
  setDraggingLeadId: (id: string | null) => void;
  setDropStageId: (id: LeadStage | null) => void;
  onStageDrop: (targetStage: LeadStage) => void;
  nowMs: number | null;
};

export function CrmPipelineBoard({
  filteredLeads,
  users,
  actor,
  search,
  setSearch,
  assigneeFilter,
  setAssigneeFilter,
  viewMode,
  setViewMode,
  selectedLeadId,
  onSelectLead,
  draggingLeadId,
  dropStageId,
  setDraggingLeadId,
  setDropStageId,
  onStageDrop,
  nowMs,
}: CrmPipelineBoardProps) {
  return (
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
                onDragLeave={() => {
                  if (dropStageId === stage.id) setDropStageId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  void onStageDrop(stage.id);
                }}
                className={cn(
                  "flex w-[275px] shrink-0 flex-col rounded-2xl border p-3 transition-colors",
                  isDropTarget ? "border-brand-red bg-brand-red-soft/40" : "border-border/80 bg-cream-2/55",
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
                    const assignee = users.find((u) => u.id === lead.assigned_to);
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
                        onClick={() => onSelectLead(lead.id)}
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
                const assignee = users.find((u) => u.id === lead.assigned_to);
                const stageObj = STAGES.find((s) => s.id === lead.stage) ?? STAGES[0];
                const overdue = isFollowupOverdue(lead.next_followup_at, nowMs);
                return (
                  <tr
                    key={lead.id}
                    onClick={() => onSelectLead(lead.id)}
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
  );
}
