"use client";

import { CalendarClock, MapPin, MessageCircle, Send, X } from "lucide-react";
import type { CrmLead, CrmLeadComment, CrmProperty, CrmUser, LeadStage } from "@/lib/crm-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BUDGET_LABELS,
  buildWhatsAppUrl,
  cleanAdvisorName,
  formatShortDate,
  formatSiteVisit,
  isFollowupOverdue,
  PILLAR_LABELS,
  stageReasonLabel,
  STAGES,
} from "@/components/crm/crm-shared";

export type CrmLeadRecordModalProps = {
  lead: CrmLead;
  onClose: () => void;
  actor: CrmUser;
  assignableUsers: CrmUser[];
  nowMs: number | null;
  comments: CrmLeadComment[];
  matchedProperties: CrmProperty[];
  busy: boolean;
  commentText: string;
  setCommentText: (value: string) => void;
  followupInput: string;
  setFollowupInput: (value: string) => void;
  onSubmitComment: (e: React.FormEvent) => void;
  siteVisitDate: string;
  setSiteVisitDate: (value: string) => void;
  siteVisitTime: string;
  setSiteVisitTime: (value: string) => void;
  siteVisitProperty: string;
  setSiteVisitProperty: (value: string) => void;
  onSubmitSiteVisit: (e: React.FormEvent) => void;
  onUpdateStage: (stage: LeadStage) => void;
  onAssignLead: (targetUserId: string | null) => void;
  onAssignToMe: () => void;
};

export function CrmLeadRecordModal({
  lead,
  onClose,
  actor,
  assignableUsers,
  nowMs,
  comments,
  matchedProperties,
  busy,
  commentText,
  setCommentText,
  followupInput,
  setFollowupInput,
  onSubmitComment,
  siteVisitDate,
  setSiteVisitDate,
  siteVisitTime,
  setSiteVisitTime,
  siteVisitProperty,
  setSiteVisitProperty,
  onSubmitSiteVisit,
  onUpdateStage,
  onAssignLead,
  onAssignToMe,
}: CrmLeadRecordModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px] sm:p-8"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-record-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[min(920px,92vh)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-lift"
      >
        <div className="shrink-0 border-b border-border px-8 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-red font-heading text-lg font-bold text-white">
                {lead.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-ink/45 uppercase">Lead record</p>
                <h2 id="lead-record-title" className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  {lead.name}
                </h2>
                <p className="mt-1.5 text-sm text-ink/60">
                  <span className="tabular-nums">+{lead.phone}</span>
                  <span className="mx-2 text-ink/25">·</span>
                  {lead.city || "Location flexible"}
                  {lead.email ? (
                    <>
                      <span className="mx-2 text-ink/25">·</span>
                      {lead.email}
                    </>
                  ) : null}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-brand-red-soft px-3 py-1 text-[11px] font-semibold uppercase text-brand-red-deep">
                    {lead.intent}
                  </span>
                  <span className="rounded-full bg-cream px-3 py-1 text-[11px] font-semibold text-ink/70">
                    {PILLAR_LABELS[lead.pillar]}
                  </span>
                  <span className="rounded-full bg-cream px-3 py-1 text-[11px] font-semibold text-ink/70">
                    {BUDGET_LABELS[lead.budget] ?? lead.budget}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={buildWhatsAppUrl(lead.phone, lead.name, lead.pillar, actor.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5d]"
              >
                <MessageCircle className="size-4 fill-white" />
                WhatsApp
              </a>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close lead record"
                className="inline-flex size-10 items-center justify-center rounded-full border border-border text-ink/50 transition-colors hover:bg-cream hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[0.92fr_1.08fr]">
          <div className="overflow-y-auto border-b border-border px-8 py-8 lg:border-r lg:border-b-0">
            <h3 className="text-sm font-bold text-ink">About this lead</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink/55">
              Update stage and ownership here. Keep notes and follow-ups on the right.
            </p>

            <div className="mt-8 space-y-7">
              <div>
                <Label className="text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase">
                  Pipeline stage
                </Label>
                <select
                  value={lead.stage}
                  onChange={(e) => onUpdateStage(e.target.value as LeadStage)}
                  className="mt-2 h-11 w-full rounded-2xl border border-border bg-cream/40 px-3.5 text-sm font-semibold text-ink focus:border-brand-red focus:outline-none"
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.num} · {s.label}
                    </option>
                  ))}
                </select>
                {lead.closure_reason && (
                  <p className="mt-2 text-sm font-semibold text-ink/70">
                    Reason: {stageReasonLabel(lead.closure_reason)}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase">Owner</Label>
                  {actor.role === "sales" && lead.assigned_to !== actor.id && (
                    <button
                      type="button"
                      onClick={onAssignToMe}
                      className="text-xs font-semibold text-brand-red hover:underline"
                    >
                      Assign to me
                    </button>
                  )}
                </div>
                <select
                  value={lead.assigned_to ?? ""}
                  onChange={(e) => onAssignLead(e.target.value || null)}
                  className="mt-2 h-11 w-full rounded-2xl border border-border bg-cream/40 px-3.5 text-sm font-semibold text-ink focus:border-brand-red focus:outline-none"
                >
                  {actor.role !== "sales" && <option value="">Unassigned</option>}
                  {assignableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} · {u.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase">Next follow-up</p>
                <p
                  className={cn(
                    "mt-2 text-base font-semibold",
                    isFollowupOverdue(lead.next_followup_at, nowMs) ? "text-brand-red" : "text-ink",
                  )}
                >
                  {formatShortDate(lead.next_followup_at)}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase">Latest note</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">
                  {lead.notes_summary || "No conversation notes yet."}
                </p>
              </div>

              {lead.stage === "site_visit_scheduled" && (
                <form onSubmit={onSubmitSiteVisit} className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-5">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-indigo-700" />
                    <p className="text-sm font-bold text-indigo-950">Site visit</p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-indigo-900/65">
                    Date is required. Leave time blank if the slot is flexible.
                  </p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="sv-date" className="text-[11px] font-semibold text-indigo-900/55 uppercase">
                        Date *
                      </Label>
                      <input
                        id="sv-date"
                        type="date"
                        required
                        value={siteVisitDate}
                        onChange={(e) => setSiteVisitDate(e.target.value)}
                        className="mt-2 h-11 w-full rounded-2xl border border-indigo-200 bg-white px-3 text-sm text-ink"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sv-time" className="text-[11px] font-semibold text-indigo-900/55 uppercase">
                        Time (optional)
                      </Label>
                      <input
                        id="sv-time"
                        type="time"
                        value={siteVisitTime}
                        onChange={(e) => setSiteVisitTime(e.target.value)}
                        className="mt-2 h-11 w-full rounded-2xl border border-indigo-200 bg-white px-3 text-sm text-ink"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="sv-prop" className="text-[11px] font-semibold text-indigo-900/55 uppercase">
                      Property / location
                    </Label>
                    <input
                      id="sv-prop"
                      type="text"
                      value={siteVisitProperty}
                      onChange={(e) => setSiteVisitProperty(e.target.value)}
                      placeholder="e.g. Park-Facing 4 BHK · Sector 65"
                      className="mt-2 h-11 w-full rounded-2xl border border-indigo-200 bg-white px-3 text-sm text-ink"
                    />
                  </div>
                  {lead.site_visit_date && (
                    <p className="mt-4 text-sm font-medium text-indigo-950">
                      Scheduled: {formatSiteVisit(lead.site_visit_date, lead.site_visit_time)}
                      {lead.site_visit_property ? ` · ${lead.site_visit_property}` : ""}
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={busy || !siteVisitDate}
                    className="mt-5 h-11 rounded-2xl bg-indigo-700 px-5 text-sm font-semibold text-white hover:bg-indigo-800"
                  >
                    <CalendarClock className="size-4" />
                    Save site visit
                  </Button>
                </form>
              )}

              {matchedProperties.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase">Matched inventory</p>
                  <div className="mt-3 space-y-3">
                    {matchedProperties.slice(0, 3).map((prop) => {
                      const shareText = `Hi ${lead.name}, ${cleanAdvisorName(actor.name)} here from RealtyCook. Sharing a verified option:\n*${prop.title}* (${prop.locality})\n• Price: ${prop.price_label}\n• Specs: ${prop.specs}\n• Status: ${prop.verification_badge}`;
                      const digits = lead.phone.replace(/\D/g, "");
                      const clean = digits.length === 10 ? `91${digits}` : digits;
                      const shareUrl = `https://wa.me/${clean}?text=${encodeURIComponent(shareText)}`;
                      return (
                        <div key={prop.id} className="rounded-2xl border border-border/80 bg-cream/30 px-4 py-3.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-ink">{prop.title}</p>
                              <p className="mt-1 text-xs text-ink/55">
                                {prop.locality} ·{" "}
                                <span className="font-semibold text-brand-red">{prop.price_label}</span>
                              </p>
                            </div>
                            <a
                              href={shareUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 rounded-full bg-[#25D366] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#1ebe5d]"
                            >
                              Share
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden bg-cream/25">
            <div className="shrink-0 border-b border-border px-8 py-8">
              <h3 className="text-sm font-bold text-ink">Activity</h3>
              <p className="mt-1 text-sm text-ink/55">Log the call or WhatsApp update, then set the next follow-up.</p>

              <form onSubmit={onSubmitComment} className="mt-6 space-y-4">
                <Textarea
                  id="crm-comment"
                  rows={4}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="What was discussed? Next steps?"
                  className="min-h-[110px] resize-none rounded-2xl border-border bg-white text-sm leading-relaxed"
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label
                      htmlFor="crm-followup"
                      className="block text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase"
                    >
                      Next follow-up
                    </label>
                    <input
                      id="crm-followup"
                      type="datetime-local"
                      value={followupInput}
                      onChange={(e) => setFollowupInput(e.target.value)}
                      className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3.5 text-sm text-ink"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={busy || !commentText.trim()}
                    className="h-11 rounded-2xl bg-ink px-5 text-sm font-semibold text-white hover:bg-brand-red"
                  >
                    <Send className="size-4" />
                    Save activity
                  </Button>
                </div>
              </form>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-ink/40 uppercase">
                Timeline · {comments.length}
              </p>
              <div className="mt-5 space-y-0">
                {comments.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border bg-white/60 px-6 py-12 text-center">
                    <p className="text-sm text-ink/50">No activity yet. Save the first note above.</p>
                  </div>
                ) : (
                  comments.map((c, idx) => (
                    <div key={c.id} className="relative flex gap-4 pb-8 last:pb-2">
                      {idx < comments.length - 1 && (
                        <span className="absolute top-3 left-[11px] h-[calc(100%-12px)] w-px bg-border" />
                      )}
                      <span className="relative z-[1] mt-1.5 size-[22px] shrink-0 rounded-full border-[3px] border-white bg-brand-red shadow-2xs" />
                      <div className="min-w-0 flex-1 rounded-2xl border border-border/70 bg-white px-4 py-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-ink">
                            {c.author_name}
                            <span className="ml-2 text-[10px] font-bold tracking-wide text-ink/35 uppercase">
                              {c.author_role}
                            </span>
                          </p>
                          <p className="text-xs text-ink/45">{formatShortDate(c.created_at)}</p>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-ink/75">{c.body}</p>
                        {c.followup_scheduled_for && (
                          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-2.5 py-1 text-[11px] font-semibold text-ink">
                            <CalendarClock className="size-3" />
                            Follow-up {formatShortDate(c.followup_scheduled_for)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
