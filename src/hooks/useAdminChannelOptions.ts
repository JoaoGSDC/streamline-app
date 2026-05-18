"use client";

import { useCallback, useMemo } from "react";
import {
  useAdminContext,
  type AdminChannel,
} from "@/components/admin/AdminProvider";

export type AdminViewFilter = "all" | "mine" | string;

export function resolveStreamerIdsForFilter(
  filter: AdminViewFilter,
  channels: AdminChannel[],
  userId: string | null
): string[] {
  if (filter === "all") return channels.map((c) => c.id);
  if (filter === "mine") {
    const owner =
      channels.find((c) => c.role === "owner") ??
      (userId ? channels.find((c) => c.id === userId) : undefined);
    return owner ? [owner.id] : userId ? [userId] : [];
  }
  return [filter];
}

export function resolveFormStreamerId(
  formTarget: string,
  ownerChannel: AdminChannel | null,
  userId: string | null
): string {
  if (formTarget.trim()) return formTarget.trim();
  return ownerChannel?.id ?? userId ?? "";
}

export function useAdminChannelOptions() {
  const { channels, userId } = useAdminContext();

  const ownerChannel = useMemo(
    () =>
      channels.find((c) => c.role === "owner") ??
      (userId ? channels.find((c) => c.id === userId) : null) ??
      null,
    [channels, userId]
  );

  const moderatedChannels = useMemo(
    () => channels.filter((c) => c.role === "moderator"),
    [channels]
  );

  const canModerateOthers = moderatedChannels.length > 0;

  const viewFilterOptions = useMemo(() => {
    const opts: { value: AdminViewFilter; label: string }[] = [
      { value: "all", label: "Todos os canais" },
      { value: "mine", label: "Meu canal" },
    ];
    for (const c of moderatedChannels) {
      opts.push({ value: c.id, label: `@${c.twitchUsername}` });
    }
    return opts;
  }, [moderatedChannels]);

  const resolveFormStreamerIdFn = useCallback(
    (formTarget: string) =>
      resolveFormStreamerId(formTarget, ownerChannel, userId),
    [ownerChannel, userId]
  );

  const resolveStreamerIdsFn = useCallback(
    (filter: AdminViewFilter) =>
      resolveStreamerIdsForFilter(filter, channels, userId),
    [channels, userId]
  );

  return {
    channels,
    userId,
    ownerChannel,
    moderatedChannels,
    canModerateOthers,
    viewFilterOptions,
    resolveFormStreamerId: resolveFormStreamerIdFn,
    resolveStreamerIds: resolveStreamerIdsFn,
  };
}
