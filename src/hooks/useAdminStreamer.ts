"use client";

import { useAdminContext } from "@/components/admin/AdminProvider";

export interface AdminStreamerSession {
  id: string;
  name: string;
  twitchUsername: string;
  avatar?: string | null;
  role?: "owner" | "moderator";
}

/** Canal ativo no painel (próprio ou moderado). */
export function useAdminStreamer() {
  const { actingAs, loading } = useAdminContext();

  const streamer: AdminStreamerSession | null = actingAs
    ? {
        id: actingAs.id,
        name: actingAs.name,
        twitchUsername: actingAs.twitchUsername,
        avatar: actingAs.avatar,
        role: actingAs.role,
      }
    : null;

  return { streamer, loading };
}
