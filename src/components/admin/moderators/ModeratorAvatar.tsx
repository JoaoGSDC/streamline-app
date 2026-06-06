"use client";

import { cn } from "@/lib/utils";

interface ModeratorAvatarProps {
  username: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}

function initialsFromUsername(username: string): string {
  const cleaned = username.replace(/^@/, "").trim();
  if (!cleaned) return "?";
  return cleaned.slice(0, 2).toUpperCase();
}

export function ModeratorAvatar({
  username,
  imageUrl,
  size = 32,
  className,
}: ModeratorAvatarProps) {
  const dimension = `${size}px`;

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: dimension, height: dimension }}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground",
        className
      )}
      style={{ width: dimension, height: dimension }}
      aria-hidden
    >
      {initialsFromUsername(username)}
    </div>
  );
}
