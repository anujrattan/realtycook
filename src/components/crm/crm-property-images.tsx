"use client";

import { Camera, ImageIcon, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  INVENTORY_MAX_IMAGES,
  propertyCoverUrl,
  propertyImageUrls,
  type CrmProperty,
} from "@/lib/crm-store";
import { cn } from "@/lib/utils";

export function PropertyCoverThumb({
  property,
  className,
  size = "md",
}: {
  property: Pick<CrmProperty, "image_urls" | "cover_image_url" | "title">;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const cover = propertyCoverUrl(property);
  const sizeClass =
    size === "sm" ? "size-10" : size === "lg" ? "aspect-[16/10] w-full" : "aspect-[16/10] w-full";

  if (cover) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={cover}
        alt={property.title}
        className={cn("shrink-0 rounded-xl object-cover", sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-cream text-ink/35",
        sizeClass,
        className,
      )}
      aria-hidden
    >
      <ImageIcon className={size === "sm" ? "size-4" : "size-6"} />
    </div>
  );
}

export function CrmPropertyImageManager({
  property,
  canEdit,
  busy,
  onUpload,
  onDelete,
  onSetCover,
}: {
  property: CrmProperty;
  canEdit: boolean;
  busy: boolean;
  onUpload: (files: File[]) => Promise<boolean>;
  onDelete: (imageUrl: string) => Promise<boolean>;
  onSetCover: (imageUrl: string) => Promise<boolean>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const urls = propertyImageUrls(property);
  const cover = propertyCoverUrl(property);
  const slotsLeft = INVENTORY_MAX_IMAGES - urls.length;

  async function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    setLocalError(null);
    const files = Array.from(list).slice(0, Math.max(0, slotsLeft));
    if (!files.length) {
      setLocalError(`Maximum of ${INVENTORY_MAX_IMAGES} images allowed.`);
      return;
    }
    const ok = await onUpload(files);
    if (!ok) setLocalError("Upload failed. Try a smaller JPG/PNG/WebP under 5 MB.");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">Product images</p>
          <p className="text-[11px] text-ink/50">
            Up to {INVENTORY_MAX_IMAGES} photos · JPG / PNG / WebP · 5 MB each
          </p>
        </div>
        {canEdit ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || slotsLeft <= 0}
            className="h-9 rounded-xl bg-white"
            onClick={() => fileRef.current?.click()}
          >
            <Camera className="size-3.5" />
            {urls.length ? "Add photos" : "Upload photos"}
          </Button>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {localError ? <p className="text-[11px] font-semibold text-brand-red-deep">{localError}</p> : null}

      {urls.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-border bg-cream/40 px-4 py-10 text-xs text-ink/45">
          No product images yet
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {urls.map((url) => {
            const isCover = url === cover;
            return (
              <div key={url} className="group relative overflow-hidden rounded-xl border border-border bg-cream">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="aspect-square w-full object-cover" />
                {isCover ? (
                  <span className="absolute top-1.5 left-1.5 rounded-md bg-ink/80 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase">
                    Cover
                  </span>
                ) : null}
                {canEdit ? (
                  <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-gradient-to-t from-ink/70 to-transparent p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    {!isCover ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void onSetCover(url)}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/95 px-1.5 py-1 text-[10px] font-semibold text-ink"
                      >
                        <Star className="size-3" />
                        Cover
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onDelete(url)}
                      className="inline-flex items-center justify-center rounded-lg bg-white/95 px-1.5 py-1 text-brand-red-deep"
                      aria-label="Remove image"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Local pending-file picker for Add Property (before property id exists). */
export function CrmPendingImagePicker({
  files,
  onChange,
  disabled,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const slotsLeft = INVENTORY_MAX_IMAGES - files.length;
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => {
    return () => {
      for (const url of previews) URL.revokeObjectURL(url);
    };
  }, [previews]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-ink">Product images</p>
          <p className="text-[10px] text-ink/45">Uploaded after the property is saved</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || slotsLeft <= 0}
          className="h-9 rounded-xl bg-white"
          onClick={() => fileRef.current?.click()}
        >
          <Camera className="size-3.5" />
          Add photos
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            const next = [...files, ...Array.from(e.target.files ?? [])].slice(0, INVENTORY_MAX_IMAGES);
            onChange(next);
            e.target.value = "";
          }}
        />
      </div>
      {files.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {files.map((file, idx) => (
            <div key={`${file.name}-${file.size}-${idx}`} className="relative size-16 overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previews[idx]} alt="" className="size-full object-cover" />
              <button
                type="button"
                disabled={disabled}
                className="absolute top-0.5 right-0.5 rounded bg-ink/70 p-0.5 text-white"
                onClick={() => onChange(files.filter((_, i) => i !== idx))}
                aria-label="Remove"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-ink/45">Optional — up to {INVENTORY_MAX_IMAGES} product photos.</p>
      )}
    </div>
  );
}
