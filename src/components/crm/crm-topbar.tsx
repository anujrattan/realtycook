"use client";

import { Plus, Shield, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CrmUser } from "@/lib/crm-store";
import { cn } from "@/lib/utils";

export function CrmTopbar({
  title,
  subtitle,
  storageMode,
  users,
  actor,
  onActorChange,
  onBulkUpload,
  onNewLead,
}: {
  title: string;
  subtitle: string;
  storageMode: "supabase" | "memory_fallback";
  users: CrmUser[];
  actor: CrmUser;
  onActorChange: (userId: string) => void;
  onBulkUpload: () => void;
  onNewLead: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-6 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-ink">{title}</h1>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase",
                storageMode === "supabase" ? "bg-emerald-500/15 text-emerald-800" : "bg-gold-soft text-ink",
              )}
            >
              {storageMode === "supabase" ? "Supabase Connected" : "Local Store (.env Ready)"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-ink/55">{subtitle}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-border bg-cream px-3 py-1.5">
          <Shield className="size-4 text-brand-red" />
          <span className="text-xs font-medium text-ink/60">Acting as:</span>
          <select
            aria-label="Switch active CRM user account"
            value={actor?.id ?? ""}
            onChange={(e) => onActorChange(e.target.value)}
            className="max-w-[220px] bg-transparent text-xs font-semibold text-ink focus:outline-none"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBulkUpload} className="h-10 rounded-xl bg-white px-4">
            <Upload className="size-3.5" />
            <span>Bulk Upload</span>
          </Button>

          <Button
            size="sm"
            onClick={onNewLead}
            className="h-10 rounded-xl bg-brand-red px-4 text-white shadow-red hover:bg-brand-red-deep"
          >
            <Plus className="size-4" />
            <span>New Lead</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
