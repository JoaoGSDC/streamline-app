"use client";

import { cn } from "@/lib/utils";

function twitchAvatarUrl(login: string, size = 70) {
  return `https://static-cdn.jtvnw.net/jtv_user_pictures/${encodeURIComponent(login.toLowerCase())}-profile_image-${size}x${size}.png`;
}

export function TwitchAvatar({
  login,
  size = 18,
  className,
}: {
  login: string;
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={twitchAvatarUrl(login, size >= 52 ? 70 : 28)}
      alt=""
      width={size}
      height={size}
      className={cn("rounded-full bg-muted object-cover", className)}
      onError={(e) => {
        e.currentTarget.src = `https://static-cdn.jtvnw.net/user-default-pictures-uv/294a98ea-f165-11e9-9513-2d2c6d4b4c4d-profile_image-${size >= 52 ? 70 : 28}x${size >= 52 ? 70 : 28}.png`;
      }}
    />
  );
}
