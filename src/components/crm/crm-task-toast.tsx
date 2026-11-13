"use client";

import { MessageCircle, X } from "lucide-react";
import type { CrmLead, CrmUser } from "@/lib/crm-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  buildWhatsAppUrl,
  classifyTaskDue,
  formatShortDate,
  PILLAR_LABELS,
  taskStatusStyles,
} from "@/components/crm/crm-shared";

export type TaskDuePopup = {
  taskId: string;
  dueAt: string;
  title: string;
  lead: CrmLead;
};

export type CrmTaskToastProps = {
  popup: TaskDuePopup;
  pendingCount: number;
  nowMs: number | null;
  actor: CrmUser;
  onDismiss: (handled?: TaskDuePopup | null) => void;
  onOpenLead: (lead: CrmLead) => void;
};

export function CrmTaskToast({
  popup,
  pendingCount,
  nowMs,
  actor,
  onDismiss,
  onOpenLead,
}: CrmTaskToastProps) {
  const status = classifyTaskDue(popup.dueAt, "open", nowMs) ?? "today";
  const styles = taskStatusStyles(status === "closed" ? "upcoming" : status);

  return (
    <div
      className={cn(
        "fixed right-5 bottom-5 z-50 w-[min(100%,360px)] rounded-2xl border bg-white p-4 shadow-lift",
        status === "missed" ? "border-brand-red/30" : "border-amber-500/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase",
              styles.badge,
            )}
          >
            {styles.label} task
          </span>
          <h3 className="mt-1.5 text-base font-bold text-ink">{popup.lead.name}</h3>
          <p className="text-xs text-ink/60">
            Due {formatShortDate(popup.dueAt)} · {PILLAR_LABELS[popup.lead.pillar]}
          </p>
          {pendingCount > 1 && (
            <p className="mt-1 text-[11px] font-medium text-ink/45">{pendingCount - 1} more pending after this</p>
          )}
        </div>
        <button type="button" onClick={() => onDismiss(popup)} aria-label="Dismiss task popup">
          <X className="size-4 text-ink/40" />
        </button>
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-ink/75">{popup.title}</p>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          className="h-8 flex-1 rounded-xl bg-brand-red text-white"
          onClick={() => {
            onDismiss(popup);
            onOpenLead(popup.lead);
          }}
        >
          Open Lead
        </Button>
        <a
          href={buildWhatsAppUrl(popup.lead.phone, popup.lead.name, popup.lead.pillar, actor.name)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onDismiss(popup)}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-xl bg-[#25D366] text-xs font-bold text-white"
        >
          <MessageCircle className="size-3.5 fill-white" />
          WhatsApp
        </a>
      </div>
    </div>
  );
}
