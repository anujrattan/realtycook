"use client";

import { Camera, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CrmUserAvatar } from "@/components/crm/crm-user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CrmUser } from "@/lib/crm-store";

export type ProfileFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  avatarUrl: string | null;
};

function fileToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image file."));
      img.onload = () => {
        const max = 256;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not process image."));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function profileFormFromUser(user: CrmUser): ProfileFormState {
  const first =
    user.first_name?.trim() ||
    user.name.trim().split(/\s+/)[0] ||
    "";
  const last =
    user.last_name?.trim() ||
    user.name.trim().split(/\s+/).slice(1).join(" ") ||
    "";
  return {
    firstName: first,
    lastName: last,
    email: user.email || "",
    phone: user.phone || "",
    address: user.address || "",
    avatarUrl: user.avatar_url ?? null,
  };
}

export function CrmProfileModal({
  open,
  busy,
  user,
  form,
  setForm,
  onClose,
  onSubmit,
}: {
  open: boolean;
  busy: boolean;
  user: CrmUser;
  form: ProfileFormState;
  setForm: React.Dispatch<React.SetStateAction<ProfileFormState>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setImageError(null);
  }, [open]);

  if (!open) return null;

  const previewUser: Pick<CrmUser, "name" | "first_name" | "last_name" | "avatar_url"> = {
    name: [form.firstName, form.lastName].filter(Boolean).join(" ") || user.name,
    first_name: form.firstName,
    last_name: form.lastName,
    avatar_url: form.avatarUrl,
  };

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    setImageError(null);
    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setImageError("Image must be under 8 MB.");
      return;
    }
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setForm((s) => ({ ...s, avatarUrl: dataUrl }));
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Could not process image.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-white p-6 shadow-lift sm:p-8">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-ink">Profile Settings</h2>
            <p className="mt-0.5 text-xs text-ink/50">Update how you appear across RealtyCook CRM.</p>
          </div>
          <button type="button" onClick={onClose} className="text-xs font-semibold text-ink/50 hover:text-ink">
            Close ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-5">
          <div className="flex items-center gap-4">
            <CrmUserAvatar user={previewUser} size="xl" />
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-semibold text-ink">Profile picture</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl bg-white"
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera className="size-3.5" />
                  Upload
                </Button>
                {form.avatarUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl bg-white text-brand-red-deep"
                    onClick={() => setForm((s) => ({ ...s, avatarUrl: null }))}
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </Button>
                ) : null}
              </div>
              <p className="text-[11px] text-ink/45">JPG or PNG. Initials show when no photo is set.</p>
              {imageError ? <p className="text-[11px] font-semibold text-brand-red-deep">{imageError}</p> : null}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void onPickImage(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="pf-first">First name</Label>
              <Input
                id="pf-first"
                required
                value={form.firstName}
                onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))}
                placeholder="First name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pf-last">Last name</Label>
              <Input
                id="pf-last"
                value={form.lastName}
                onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="pf-email">Email</Label>
              <Input
                id="pf-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                placeholder="you@company.com"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pf-phone">Phone</Label>
              <Input
                id="pf-phone"
                required
                value={form.phone}
                onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                placeholder="+91 98xxxxxxxx"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="pf-address">Address</Label>
            <Textarea
              id="pf-address"
              rows={3}
              value={form.address}
              onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
              placeholder="Office or home address"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="h-10 rounded-xl bg-brand-red px-5 text-white shadow-red hover:bg-brand-red-deep"
            >
              {busy ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
