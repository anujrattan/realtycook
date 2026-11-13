"use client";

import { userDisplayName, userInitials, type CrmUser } from "@/lib/crm-store";
import { cn } from "@/lib/utils";

export function CrmUserAvatar({
  user,
  size = "md",
  className,
}: {
  user: Pick<CrmUser, "name" | "first_name" | "last_name" | "avatar_url">;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClass =
    size === "sm"
      ? "size-8 text-[10px]"
      : size === "lg"
        ? "size-12 text-sm"
        : size === "xl"
          ? "size-20 text-xl"
          : "size-9 text-xs";

  if (user.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatar_url}
        alt={userDisplayName(user)}
        className={cn("shrink-0 rounded-full object-cover", sizeClass, className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-brand-red/15 font-bold tracking-wide text-brand-red-deep",
        sizeClass,
        className,
      )}
      aria-hidden
    >
      {userInitials(user)}
    </span>
  );
}
