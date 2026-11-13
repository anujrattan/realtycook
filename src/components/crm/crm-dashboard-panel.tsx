"use client";

import type { CrmLead, CrmLeadComment, CrmTask, CrmUser } from "@/lib/crm-store";
import { cn } from "@/lib/utils";
import { formatShortDate, formatSiteVisit, isFollowupOverdue, STAGES } from "@/components/crm/crm-shared";

export type CrmDashboardPanelProps = {
  missedTasks: CrmTask[];
  recentActivity: CrmLeadComment[];
  recentActivityTitle: string;
  recentActivitySubtitle: string;
  leads: CrmLead[];
  users: CrmUser[];
  nowMs: number | null;
  onReviewLead: (leadId: string) => void;
};

export function CrmDashboardPanel({
  missedTasks,
  recentActivity,
  recentActivityTitle,
  recentActivitySubtitle,
  leads,
  users,
  nowMs,
  onReviewLead,
}: CrmDashboardPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink">Dashboard</h2>
        <p className="mt-1 text-xs text-ink/55">
          Missed tasks, recent activity, and a snapshot of every lead in the pipeline.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-soft">
          <h3 className="text-lg font-bold text-ink">Missed Tasks</h3>
          <p className="mt-1 text-xs text-ink/55">
            Highlighted in red — these tasks slipped past their end date.
          </p>
          <div className="mt-4 space-y-2">
            {missedTasks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-ink/50">
                No missed tasks. You&apos;re on track.
              </p>
            ) : (
              missedTasks.map((task) => {
                const lead = leads.find((l) => l.id === task.lead_id);
                const assignee = users.find((u) => u.id === task.assigned_to);
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-brand-red/25 bg-brand-red-soft/50 p-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{task.title}</p>
                      <p className="text-brand-red-deep">
                        Due {formatShortDate(task.due_at)} · {lead?.name ?? "Lead"} ·{" "}
                        {assignee?.name ?? "Unassigned"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onReviewLead(task.lead_id)}
                      className="shrink-0 rounded-lg bg-brand-red px-2.5 py-1.5 text-[11px] font-bold text-white"
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
          <h3 className="text-lg font-bold text-ink">{recentActivityTitle}</h3>
          <p className="mt-1 text-xs text-ink/55">{recentActivitySubtitle}</p>
          <div className="mt-4 max-h-[480px] space-y-2 overflow-y-auto pr-1">
            {recentActivity.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-ink/50">
                No recent activity yet.
              </p>
            ) : (
              recentActivity.map((c) => {
                const lead = leads.find((l) => l.id === c.lead_id);
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
                    <p className="mt-1 leading-relaxed whitespace-pre-wrap text-ink/80">{c.body}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-6 shadow-soft lg:col-span-2">
          <h3 className="text-lg font-bold text-ink">All Leads Snapshot</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold tracking-wider text-ink/55 uppercase">
                  <th className="p-2.5">Client</th>
                  <th className="p-2.5">Assignee</th>
                  <th className="p-2.5">Stage</th>
                  <th className="p-2.5">Next due</th>
                  <th className="p-2.5">Site Visit</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const assignee = users.find((u) => u.id === lead.assigned_to);
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
    </div>
  );
}
