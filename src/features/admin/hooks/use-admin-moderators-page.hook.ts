"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAdminChannelOptions } from "@/hooks/useAdminChannelOptions";
import type { TwitchChannelResult } from "@/lib/twitch-api";
import { services } from "@services";
import type { ModeratorDto } from "@api/internal/streamers/moderators.controller";

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function normalizeLogin(value: string): string {
  return value.trim().toLowerCase().replace(/^@/, "");
}

export type ModeratorSearchFeedback = "not_found" | "already_moderator" | null;

export function useAdminModeratorsPage() {
  const { toast } = useToast();
  const {
    ownerChannel,
    moderatedChannels,
    resolveFormStreamerId,
    userId,
    channels,
    canModerateOthers,
  } = useAdminChannelOptions();

  const [manageTarget, setManageTarget] = useState("");
  const [moderators, setModerators] = useState<ModeratorDto[]>([]);
  const [username, setUsername] = useState("");
  const [pendingUser, setPendingUser] = useState<TwitchChannelResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] =
    useState<ModeratorSearchFeedback>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const targetStreamerId = useMemo(
    () => resolveFormStreamerId(manageTarget),
    [manageTarget, resolveFormStreamerId]
  );

  const targetChannel = useMemo(
    () => channels.find((channel) => channel.id === targetStreamerId) ?? ownerChannel,
    [channels, targetStreamerId, ownerChannel]
  );

  const canManageModerators = Boolean(
    userId && targetStreamerId && userId === targetStreamerId
  );

  const channelLabel = targetChannel?.twitchUsername
    ? `@${targetChannel.twitchUsername}`
    : "seu canal";

  const moderatorLoginSet = useMemo(
    () =>
      new Set(
        moderators.map((moderator) =>
          moderator.moderatorUsername.toLowerCase()
        )
      ),
    [moderators]
  );

  const loadModerators = useCallback(async () => {
    if (!targetStreamerId || !canManageModerators) {
      setModerators([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const rows = await services.streamers.moderators.list(targetStreamerId);
      setModerators(rows);
    } catch (error) {
      toast({
        title: "Erro",
        description: getApiErrorMessage(error, "Falha ao carregar moderadores"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [targetStreamerId, canManageModerators, toast]);

  useEffect(() => {
    void loadModerators();
  }, [loadModerators]);

  const handleUsernameChange = useCallback((value: string) => {
    setUsername(value);
    setPendingUser(null);
    setSearchFeedback(null);
  }, []);

  const handleUserSelect = useCallback(
    (channel: TwitchChannelResult) => {
      const login = channel.login.toLowerCase();
      if (moderatorLoginSet.has(login)) {
        setSearchFeedback("already_moderator");
        setPendingUser(null);
        return;
      }
      setSearchFeedback(null);
      setPendingUser(channel);
    },
    [moderatorLoginSet]
  );

  const handleSearchComplete = useCallback(
    (results: TwitchChannelResult[], query: string) => {
      const login = normalizeLogin(query);
      if (login.length < 2) {
        setSearchFeedback(null);
        return;
      }

      if (moderatorLoginSet.has(login)) {
        setSearchFeedback("already_moderator");
        setPendingUser(null);
        return;
      }

      if (results.length === 0) {
        setSearchFeedback("not_found");
        setPendingUser(null);
        return;
      }

      setSearchFeedback(null);
      const exactMatch = results.find(
        (channel) => channel.login.toLowerCase() === login
      );
      if (exactMatch) {
        setPendingUser(exactMatch);
      }
    },
    [moderatorLoginSet]
  );

  const handleConfirmAdd = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const login = pendingUser?.login ?? normalizeLogin(username);
      if (!targetStreamerId || !login || !pendingUser) return;

      setSubmitting(true);
      try {
        const moderator = await services.streamers.moderators.add(
          targetStreamerId,
          login
        );
        setUsername("");
        setPendingUser(null);
        setSearchFeedback(null);
        await loadModerators();
        toast({
          title: "Moderador adicionado",
          description: `@${moderator.moderatorUsername} pode gerenciar ${channelLabel}.`,
        });
      } catch (error) {
        toast({
          title: "Não foi possível adicionar",
          description: getApiErrorMessage(error, "Erro desconhecido"),
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [
      pendingUser,
      username,
      targetStreamerId,
      loadModerators,
      channelLabel,
      toast,
    ]
  );

  const handleRemove = useCallback(
    async (moderatorId: string, _modUsername: string) => {
      if (!targetStreamerId) return;

      try {
        await services.streamers.moderators.remove(targetStreamerId, moderatorId);
        setModerators((previous) =>
          previous.filter((moderator) => moderator.moderatorId !== moderatorId)
        );
        toast({ title: "Moderador removido" });
      } catch (error) {
        toast({
          title: "Erro",
          description: getApiErrorMessage(error, "Falha ao remover"),
          variant: "destructive",
        });
        throw error;
      }
    },
    [targetStreamerId, toast]
  );

  const excludeLogins = useMemo(
    () => [
      targetChannel?.twitchUsername ?? "",
      ...moderators.map((moderator) => moderator.moderatorUsername),
    ],
    [targetChannel?.twitchUsername, moderators]
  );

  const handleSearchingChange = useCallback((searching: boolean) => {
    setIsSearching(searching);
  }, []);

  return {
    ownerChannel,
    moderatedChannels,
    channels,
    canModerateOthers,
    manageTarget,
    setManageTarget,
    moderators,
    username,
    pendingUser,
    isSearching,
    searchFeedback,
    loading,
    submitting,
    canManageModerators,
    channelLabel,
    excludeLogins,
    handleUsernameChange,
    handleUserSelect,
    handleSearchingChange,
    handleSearchComplete,
    handleConfirmAdd,
    handleRemove,
  };
}
