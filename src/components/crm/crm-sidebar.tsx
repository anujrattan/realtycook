"use client";

import {
  Building2,
  CalendarClock,
  Kanban,
  LayoutDashboard,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import type { CrmNavId } from "@/components/crm/crm-shared";
import { cn } from "@/lib/utils";

type NavItem = {
  id: CrmNavId;
  label: string;
  hint: string;
  icon: typeof Kanban;
  count?: number;
};

export function CrmSidebar({
  activeNav,
  onNavigate,
  counts,
}: {
  activeNav: CrmNavId;
  onNavigate: (id: CrmNavId) => void;
  counts: {
    pipeline: number;
    followups: number;
    inventory: number;
    team: number;
    missed: number;
  };
}) {
  const items: NavItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      hint: "Missed items & activity",
      icon: LayoutDashboard,
      count: counts.missed,
    },
    {
      id: "pipeline",
      label: "Lead Pipeline",
      hint: "Board & list views",
      icon: Kanban,
      count: counts.pipeline,
    },
    {
      id: "followups",
      label: "Follow-Ups",
      hint: "Today, upcoming & missed",
      icon: CalendarClock,
      count: counts.followups,
    },
    {
      id: "inventory",
      label: "Inventory",
      hint: "Verified property bank",
      icon: Building2,
      count: counts.inventory,
    },
    {
      id: "team",
      label: "User Management",
      hint: "Accounts & permissions",
      icon: Users,
      count: counts.team,
    },
  ];

  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r border-border bg-white">
      <div className="border-b border-border px-5 py-5">
        <Link href="/" className="inline-flex" aria-label="Back to RealtyCook website">
          <Logo className="h-10" />
        </Link>
        <p className="mt-3 text-[11px] font-semibold tracking-[0.14em] text-ink/40 uppercase">RealtyCook CRM</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="CRM sections">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                active
                  ? "bg-brand-red text-white shadow-red"
                  : "text-ink/70 hover:bg-cream hover:text-ink",
              )}
            >
              <Icon className={cn("size-4 shrink-0", active ? "text-white" : "text-ink/40")} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className={cn("mt-0.5 block text-[11px]", active ? "text-white/75" : "text-ink/40")}>
                  {item.hint}
                </span>
              </span>
              {typeof item.count === "number" && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                    active ? "bg-white/20 text-white" : "bg-cream text-ink/60",
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
