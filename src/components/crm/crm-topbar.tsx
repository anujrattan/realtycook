"use client";

import { ChevronDown, LogOut, Plus, Settings, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CrmUserAvatar } from "@/components/crm/crm-user-avatar";
import { Button } from "@/components/ui/button";
import { userDisplayName, type CrmUser } from "@/lib/crm-store";
import { cn } from "@/lib/utils";

export function CrmTopbar({
  title,
  subtitle,
  storageMode,
  actor,
  onLogout,
  onBulkUpload,
  onNewLead,
  onOpenProfile,
}: {
  title: string;
  subtitle: string;
  storageMode: "supabase" | "memory_fallback";
  actor: CrmUser;
  onLogout: () => void;
  onBulkUpload: () => void;
  onNewLead: () => void;
  onOpenProfile: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const displayName = userDisplayName(actor);
  const showSystemStatus =
    actor.email?.toLowerCase() === "rattan.anuj@gmail.com" ||
    actor.first_name?.toLowerCase() === "anuj" ||
    actor.name.toLowerCase().startsWith("anuj ");

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-6 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-ink">{title}</h1>
            {showSystemStatus ? (
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase",
                  storageMode === "supabase" ? "bg-emerald-500/15 text-emerald-800" : "bg-gold-soft text-ink",
                )}
              >
                {storageMode === "supabase" ? "Supabase Connected" : "Local Store (.env Ready)"}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-ink/55">{subtitle}</p>
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

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex max-w-[14rem] items-center gap-2 rounded-2xl border border-border bg-cream px-2.5 py-1.5 text-left transition hover:border-brand-red/30 hover:bg-brand-red-soft/40"
            >
              <CrmUserAvatar user={actor} size="sm" />
              <div className="min-w-0 hidden sm:block">
                <p className="truncate text-xs font-semibold text-ink">{displayName}</p>
                <p className="truncate text-[10px] text-ink/50">{actor?.designation || actor?.role}</p>
              </div>
              <ChevronDown className={cn("size-3.5 shrink-0 text-ink/40 transition", menuOpen && "rotate-180")} />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-white py-1 shadow-lift"
              >
                <div className="border-b border-border px-3 py-2 sm:hidden">
                  <p className="truncate text-xs font-semibold text-ink">{displayName}</p>
                  <p className="truncate text-[10px] text-ink/50">{actor?.email}</p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-cream"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenProfile();
                  }}
                >
                  <Settings className="size-3.5 text-ink/55" />
                  Profile settings
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-brand-red-deep hover:bg-brand-red-soft/50"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut className="size-3.5" />
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
