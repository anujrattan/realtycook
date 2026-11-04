"use client";

import { Trash2, UserPlus } from "lucide-react";
import type { CrmLead, CrmUser, UserRole } from "@/lib/crm-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type NewUserFormState = {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  designation: string;
};

export type CrmTeamViewProps = {
  users: CrmUser[];
  leads: CrmLead[];
  actor: CrmUser;
  busy: boolean;
  newUserForm: NewUserFormState;
  setNewUserForm: React.Dispatch<React.SetStateAction<NewUserFormState>>;
  onAddUser: (e: React.FormEvent) => void;
  onRemoveUser: (userId: string) => void;
};

export function CrmTeamView({
  users,
  leads,
  actor,
  busy,
  newUserForm,
  setNewUserForm,
  onAddUser,
  onRemoveUser,
}: CrmTeamViewProps) {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold text-ink">System Accounts &amp; Role Hierarchy</h2>
          <p className="text-xs text-ink/60">
            1 Superadmin · Admin · Sales — with assignment and follow-up rules enforced on the backend
          </p>
        </div>
        <div className="divide-y divide-border/70">
          {users.map((u) => {
            const assignedCount = leads.filter((l) => l.assigned_to === u.id).length;
            const canRemove =
              u.role !== "superadmin" &&
              (actor.role === "superadmin" || (actor.role === "admin" && u.role === "sales"));
            return (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-2xl font-heading text-sm font-bold text-white",
                      u.role === "superadmin" ? "bg-brand-red" : u.role === "admin" ? "bg-ink text-gold" : "bg-emerald-700",
                    )}
                  >
                    {u.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-ink">{u.name}</p>
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase",
                          u.role === "superadmin"
                            ? "bg-brand-red-soft text-brand-red-deep"
                            : u.role === "admin"
                              ? "bg-gold-soft text-ink"
                              : "bg-emerald-500/12 text-emerald-800",
                        )}
                      >
                        {u.role}
                      </span>
                    </div>
                    <p className="text-xs text-ink/60">
                      {u.designation} · {u.email} · +{u.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink/75">
                    {assignedCount} active leads
                  </span>
                  {canRemove && (
                    <button
                      type="button"
                      onClick={() => onRemoveUser(u.id)}
                      aria-label={`Remove ${u.name}`}
                      className="inline-flex size-8 items-center justify-center rounded-xl border border-border text-ink/50 transition-colors hover:border-brand-red hover:bg-brand-red-soft hover:text-brand-red"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-white p-6 shadow-soft">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-red-soft text-brand-red">
            <UserPlus className="size-4" />
          </span>
          <div>
            <h3 className="text-base font-bold text-ink">Add Team Member</h3>
            <p className="text-xs text-ink/55">
              {actor.role === "sales"
                ? "Switch to Admin or Superadmin to add users."
                : "Create a new Sales or Admin account."}
            </p>
          </div>
        </div>
        {actor.role === "sales" ? (
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-cream/50 p-6 text-center text-xs text-ink/60">
            Sales accounts cannot add or remove system users.
          </div>
        ) : (
          <form onSubmit={onAddUser} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="u-name">Full Name</Label>
              <Input
                id="u-name"
                required
                value={newUserForm.name}
                onChange={(e) => setNewUserForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="e.g. Simran Kaur"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="u-email">Email</Label>
                <Input
                  id="u-email"
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm((s) => ({ ...s, email: e.target.value }))}
                  placeholder="simran@realtycook.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="u-phone">WhatsApp Phone</Label>
                <Input
                  id="u-phone"
                  required
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm((s) => ({ ...s, phone: e.target.value }))}
                  placeholder="919876543219"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="u-role">System Role</Label>
                <select
                  id="u-role"
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm((s) => ({ ...s, role: e.target.value as UserRole }))}
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-xs font-semibold text-ink"
                >
                  <option value="sales">Sales Account</option>
                  {actor.role === "superadmin" && <option value="admin">Admin Account</option>}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="u-desig">Designation</Label>
                <Input
                  id="u-desig"
                  value={newUserForm.designation}
                  onChange={(e) => setNewUserForm((s) => ({ ...s, designation: e.target.value }))}
                  placeholder="Sales Advisor — Homes"
                />
              </div>
            </div>
            <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl bg-brand-red text-white shadow-red">
              <UserPlus className="size-4" />
              <span>Add Account to CRM</span>
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
