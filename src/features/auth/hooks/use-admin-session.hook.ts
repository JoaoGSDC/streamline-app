"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { services } from "@services";
import type { AdminChannelDto } from "@api/internal/admin/channels.controller";

export interface AdminChannel {
  id: string;
  name: string;
  twitchUsername: string;
  avatar?: string | null;
  role: "owner" | "moderator";
}

function mapChannelDto(channel: AdminChannelDto): AdminChannel {
  return {
    id: channel.id,
    name: channel.name,
    twitchUsername: channel.twitchUsername,
    avatar: channel.avatar,
    role: channel.role,
  };
}

export function useAdminSession() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const [userId, setUserId] = useState<string | null>(null);
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [actingAs, setActingAs] = useState<AdminChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  const loadChannels = useCallback(async () => {
    try {
      await services.auth.session.get();
    } catch {
      routerRef.current.push("/auth");
      return;
    }

    try {
      const response = await services.auth.admin.channels.findAll();
      setUserId(response.userId ?? null);
      setChannels(response.channels.map(mapChannelDto));
      setActingAs(mapChannelDto(response.actingAs));
    } catch (loadError) {
      if ((loadError as { response?: { status?: number } })?.response?.status === 401) {
        routerRef.current.push("/auth");
        return;
      }
      throw loadError;
    }
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    let cancelled = false;

    void (async () => {
      try {
        await loadChannels();
      } catch (loadError) {
        console.error(loadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadChannels]);

  const switchChannel = useCallback(async (streamerId: string) => {
    const nextActingAs = await services.auth.admin.channels.switchTo(streamerId);
    setActingAs(mapChannelDto(nextActingAs));
  }, []);

  const refreshChannels = useCallback(async () => {
    await loadChannels();
  }, [loadChannels]);

  const logout = useCallback(async () => {
    await services.auth.session.logout();
    localStorage.removeItem("currentStreamer");
  }, []);

  return useMemo(
    () => ({
      userId,
      channels,
      actingAs,
      loading,
      switchChannel,
      refreshChannels,
      logout,
    }),
    [
      userId,
      channels,
      actingAs,
      loading,
      switchChannel,
      refreshChannels,
      logout,
    ]
  );
}
