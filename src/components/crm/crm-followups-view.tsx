"use client";

import { MessageCircle } from "lucide-react";
import type { CrmLead, CrmUser } from "@/lib/crm-store";
import { cn } from "@/lib/utils";
import {
  buildWhatsAppUrl,
  classifyFollowup,
  followupStatusStyles,
  formatShortDate,
  PILLAR_LABELS,
  STAGES,
  type FollowupBucket,
} from "@/components/crm/crm-shared";

export type MyFollowupsBuckets = {
  today: CrmLead[];
  upcoming: CrmLead[];
  missed: CrmLead[];
  all: CrmLead[];
};

export type CrmFollowupsViewProps = {
  myFollowups: MyFollowupsBuckets;
  followupBucket: FollowupBucket;
  setFollowupBucket: (bucket: FollowupBucket) => void;
  nowMs: number | null;
  users: CrmUser[];
  actor: CrmUser;
  onOpenLead: (lead: CrmLead) => void;
  advanceFollowupPopup: (handledLead?: CrmLead | null) => void;
};

export function CrmFollowupsView({
  myFollowups,
  followupBucket,
  setFollowupBucket,
  nowMs,
  users,
  actor,
  onOpenLead,
  advanceFollowupPopup,
}: CrmFollowupsViewProps) {
  const followupQueue =
    followupBucket === "all" ? myFollowups.all : myFollowups[followupBucket];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-3 shadow-soft">
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-cream p-1">
          {(
            [
              { id: "all" as const, label: `All Followups (${myFollowups.all.length})`, active: "bg-ink text-white" },
              {
                id: "today" as const,
                label: `Today's Follow-Ups (${myFollowups.today.length})`,
                active: "bg-emerald-600 text-white",
              },
              {
                id: "upcoming" as const,
                label: `Upcoming (${myFollowups.upcoming.length})`,
                active: "bg-amber-500 text-ink",
              },
              {
                id: "missed" as const,
                label: `Missed (${myFollowups.missed.length})`,
                active: "bg-brand-red text-white",
              },
            ] as const
          ).map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setFollowupBucket(b.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                followupBucket === b.id
                  ? b.active
                  : b.id === "missed"
                    ? "text-brand-red hover:bg-brand-red-soft"
                    : b.id === "today"
                      ? "text-emerald-700 hover:bg-emerald-500/10"
                      : b.id === "upcoming"
                        ? "text-amber-800 hover:bg-amber-400/15"
                        : "text-ink/60 hover:text-ink",
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <span className="size-2.5 rounded-full bg-emerald-600" /> Today
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-800">
            <span className="size-2.5 rounded-full bg-amber-500" /> Upcoming
          </span>
          <span className="inline-flex items-center gap-1.5 text-brand-red">
            <span className="size-2.5 rounded-full bg-brand-red" /> Missed
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-soft">
        <table className="w-full min-w-[780px] text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-cream/60 text-[11px] font-semibold tracking-wider text-ink/55 uppercase">
              <th className="p-3.5">Status</th>
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
                <td colSpan={6} className="p-10 text-center text-sm text-ink/50">
                  No follow-ups in this view right now.
                </td>
              </tr>
            ) : (
              followupQueue.map((lead) => {
                const assignee = users.find((u) => u.id === lead.assigned_to);
                const stageObj = STAGES.find((s) => s.id === lead.stage) ?? STAGES[0];
                const status = classifyFollowup(lead.next_followup_at, nowMs) ?? "upcoming";
                const styles = followupStatusStyles(status);
                return (
                  <tr key={lead.id} className={cn("border-b border-border/60", styles.row)}>
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
                    <td className={cn("p-3.5 font-semibold tabular-nums", styles.text)}>
                      {formatShortDate(lead.next_followup_at)}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            advanceFollowupPopup(lead);
                            onOpenLead(lead);
                          }}
                          className="rounded-lg border border-border bg-white/80 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-white"
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
  );
}
