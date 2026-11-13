"use client";

import { CheckCircle2, MessageCircle } from "lucide-react";
import type { CrmLead, CrmTask, CrmUser } from "@/lib/crm-store";
import { cn } from "@/lib/utils";
import {
  buildWhatsAppUrl,
  classifyTaskDue,
  formatShortDate,
  PILLAR_LABELS,
  STAGES,
  taskStatusStyles,
  type TaskBucket,
} from "@/components/crm/crm-shared";

export type MyTasksBuckets = {
  today: CrmTask[];
  upcoming: CrmTask[];
  missed: CrmTask[];
  closed: CrmTask[];
  /** Open tasks only (missed → today → upcoming) */
  all: CrmTask[];
};

export type CrmTasksViewProps = {
  myTasks: MyTasksBuckets;
  taskBucket: TaskBucket;
  setTaskBucket: (bucket: TaskBucket) => void;
  nowMs: number | null;
  leads: CrmLead[];
  users: CrmUser[];
  actor: CrmUser;
  busy: boolean;
  onOpenLead: (leadId: string) => void;
  onCloseTask: (taskId: string) => void;
};

export function CrmTasksView({
  myTasks,
  taskBucket,
  setTaskBucket,
  nowMs,
  leads,
  users,
  actor,
  busy,
  onOpenLead,
  onCloseTask,
}: CrmTasksViewProps) {
  const queue =
    taskBucket === "all"
      ? myTasks.all
      : taskBucket === "closed"
        ? myTasks.closed
        : myTasks[taskBucket];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-3 shadow-soft">
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-cream p-1">
          {(
            [
              { id: "all" as const, label: `Open (${myTasks.all.length})`, active: "bg-ink text-white" },
              {
                id: "today" as const,
                label: `Due today (${myTasks.today.length})`,
                active: "bg-amber-500 text-ink",
              },
              {
                id: "upcoming" as const,
                label: `Upcoming (${myTasks.upcoming.length})`,
                active: "bg-white text-ink border border-border",
              },
              {
                id: "missed" as const,
                label: `Missed (${myTasks.missed.length})`,
                active: "bg-brand-red text-white",
              },
              {
                id: "closed" as const,
                label: `Closed (${myTasks.closed.length})`,
                active: "bg-emerald-600 text-white",
              },
            ] as const
          ).map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setTaskBucket(b.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                taskBucket === b.id
                  ? b.active
                  : b.id === "missed"
                    ? "text-brand-red hover:bg-brand-red-soft"
                    : b.id === "today"
                      ? "text-amber-800 hover:bg-amber-400/15"
                      : b.id === "closed"
                        ? "text-emerald-700 hover:bg-emerald-500/10"
                        : "text-ink/60 hover:text-ink",
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1.5 text-brand-red">
            <span className="size-2.5 rounded-full bg-brand-red" /> Missed
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-800">
            <span className="size-2.5 rounded-full bg-amber-500" /> Due today
          </span>
          <span className="inline-flex items-center gap-1.5 text-ink/60">
            <span className="size-2.5 rounded-full border border-border bg-white" /> Today / upcoming
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <span className="size-2.5 rounded-full bg-emerald-600" /> Closed
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-soft">
        <table className="w-full min-w-[860px] text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-cream/60 text-[11px] font-semibold tracking-wider text-ink/55 uppercase">
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Task</th>
              <th className="p-3.5">Lead</th>
              <th className="p-3.5">Assigned To</th>
              <th className="p-3.5">Due</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-sm text-ink/50">
                  {taskBucket === "closed"
                    ? "No closed tasks yet."
                    : "No open tasks in this view. Create one from a lead record."}
                </td>
              </tr>
            ) : (
              queue.map((task) => {
                const lead = leads.find((l) => l.id === task.lead_id);
                const assignee = users.find((u) => u.id === task.assigned_to);
                const dueStatus = classifyTaskDue(task.due_at, task.status, nowMs) ?? "upcoming";
                const styles = taskStatusStyles(dueStatus);
                const stageObj = STAGES.find((s) => s.id === lead?.stage) ?? STAGES[0];
                return (
                  <tr key={task.id} className={cn("border-b border-border/60", styles.row)}>
                    <td className="p-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase",
                          styles.badge,
                        )}
                      >
                        {styles.label}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-ink">{task.title}</p>
                      {task.description ? (
                        <p className="mt-0.5 line-clamp-2 text-ink/55">{task.description}</p>
                      ) : null}
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-ink">{lead?.name ?? "Unknown lead"}</p>
                      {lead ? (
                        <p className="text-ink/55">
                          {lead.intent.toUpperCase()} · {PILLAR_LABELS[lead.pillar]} · {stageObj.label}
                        </p>
                      ) : null}
                    </td>
                    <td className="p-3.5">{assignee?.name ?? "Unassigned"}</td>
                    <td className={cn("p-3.5 font-semibold tabular-nums", styles.text)}>
                      {formatShortDate(task.due_at)}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        {lead ? (
                          <button
                            type="button"
                            onClick={() => onOpenLead(lead.id)}
                            className="rounded-lg border border-border bg-white/80 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-white"
                          >
                            Open lead
                          </button>
                        ) : null}
                        {task.status === "open" ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onCloseTask(task.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <CheckCircle2 className="size-3" />
                            Close
                          </button>
                        ) : null}
                        {lead ? (
                          <a
                            href={buildWhatsAppUrl(lead.phone, lead.name, lead.pillar, actor.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-[#25D366] px-2.5 py-1.5 text-[11px] font-bold text-white"
                          >
                            <MessageCircle className="size-3 fill-white" /> WA
                          </a>
                        ) : null}
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
  );
}
