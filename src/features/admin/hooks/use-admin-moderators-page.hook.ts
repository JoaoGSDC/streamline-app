"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAdminChannelOptions } from "@/hooks/useAdminChannelOptions";
import { services } from "@services";
import type { ModeratorDto } from "@api/internal/streamers/moderators.controller";

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useAdminModeratorsPage() {
  const { toast } = useToast();
  const { ownerChannel, resolveFormStreamerId, userId, channels } =
    useAdminChannelOptions();

  const [manageTarget, setManageTarget] = useState("");
  const [moderators, setModerators] = useState<ModeratorDto[]>([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const targetStreamerId = useMemo(
    () => resolveFormStreamerId(manageTarget),
    [manageTarget, resolveFormStreamerId]
  );

  const targetChannel = useMemo(
    () => channels.find((c) => c.id === targetStreamerId) ?? ownerChannel,
    [channels, targetStreamerId, ownerChannel]
  );

  const canManageModerators = Boolean(
    userId && targetStreamerId && userId === targetStreamerId
  );

  const channelLabel = targetChannel?.twitchUsername
    ? `@${targetChannel.twitchUsername}`
    : "seu canal";

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

  const handleAdd = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const login = username.trim().toLowerCase().replace(/^@/, "");
      if (!targetStreamerId || !login) return;

      setSubmitting(true);
      try {
        const moderator = await services.streamers.moderators.add(
          targetStreamerId,
          login
        );
        setUsername("");
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
    [username, targetStreamerId, loadModerators, channelLabel, toast]
  );

  const handleRemove = useCallback(
    async (moderatorId: string, modUsername: string) => {
      if (!targetStreamerId) return;
      if (
        !confirm(`Remover @${modUsername} como moderador de ${channelLabel}?`)
      ) {
        return;
      }

      try {
        await services.streamers.moderators.remove(targetStreamerId, moderatorId);
        setModerators((prev) => prev.filter((m) => m.moderatorId !== moderatorId));
        toast({ title: "Moderador removido" });
      } catch (error) {
        toast({
          title: "Erro",
          description: getApiErrorMessage(error, "Falha ao remover"),
          variant: "destructive",
        });
      }
    },
    [targetStreamerId, channelLabel, toast]
  );

  const excludeLogins = useMemo(
    () => [
      targetChannel?.twitchUsername ?? "",
      ...moderators.map((m) => m.moderatorUsername),
    ],
    [targetChannel?.twitchUsername, moderators]
  );

  return {
    ownerChannel,
    channels,
    manageTarget,
    setManageTarget,
    moderators,
    username,
    setUsername,
    loading,
    submitting,
    canManageModerators,
    channelLabel,
    excludeLogins,
    handleAdd,
    handleRemove,
  };
}
