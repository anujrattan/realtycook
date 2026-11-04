"use client";

import { MessageCircle, X } from "lucide-react";
import type { CrmLead, CrmUser } from "@/lib/crm-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  buildWhatsAppUrl,
  classifyFollowup,
  followupStatusStyles,
  formatShortDate,
  PILLAR_LABELS,
} from "@/components/crm/crm-shared";

export type CrmFollowupToastProps = {
  followupPopup: CrmLead;
  pendingPopupCount: number;
  nowMs: number | null;
  actor: CrmUser;
  advanceFollowupPopup: (handledLead?: CrmLead | null) => void;
  onOpenLead: (lead: CrmLead) => void;
};

export function CrmFollowupToast({
  followupPopup,
  pendingPopupCount,
  nowMs,
  actor,
  advanceFollowupPopup,
  onOpenLead,
}: CrmFollowupToastProps) {
  const status = classifyFollowup(followupPopup.next_followup_at, nowMs) ?? "today";
  const styles = followupStatusStyles(status);

  return (
    <div
      className={cn(
        "fixed right-5 bottom-5 z-50 w-[min(100%,360px)] rounded-2xl border bg-white p-4 shadow-lift",
        status === "missed" ? "border-brand-red/30" : "border-emerald-500/30",
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
            {styles.label} follow-up
          </span>
          <h3 className="mt-1.5 text-base font-bold text-ink">{followupPopup.name}</h3>
          <p className="text-xs text-ink/60">
            Scheduled {formatShortDate(followupPopup.next_followup_at)} · {PILLAR_LABELS[followupPopup.pillar]}
          </p>
          {pendingPopupCount > 1 && (
            <p className="mt-1 text-[11px] font-medium text-ink/45">{pendingPopupCount - 1} more pending after this</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => advanceFollowupPopup(followupPopup)}
          aria-label="Dismiss follow-up popup"
        >
          <X className="size-4 text-ink/40" />
        </button>
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-ink/75">{followupPopup.notes_summary}</p>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          className="h-8 flex-1 rounded-xl bg-brand-red text-white"
          onClick={() => {
            const current = followupPopup;
            advanceFollowupPopup(current);
            onOpenLead(current);
          }}
        >
          Open Lead
        </Button>
        <a
          href={buildWhatsAppUrl(followupPopup.phone, followupPopup.name, followupPopup.pillar, actor.name)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => advanceFollowupPopup(followupPopup)}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-xl bg-[#25D366] text-xs font-bold text-white"
        >
          <MessageCircle className="size-3.5 fill-white" /> WhatsApp
        </a>
      </div>
    </div>
  );
}
