"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { services } from "@services/index";
import type { TwitchChannelResult } from "@/lib/twitch-api";
import type { ChannelViewerEconomyDto } from "@server/economy/economy.types";

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useEconomyUsersPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<ChannelViewerEconomyDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"points" | "level" | "activity">(
    "points"
  );
  const [loading, setLoading] = useState(true);
  const [addingViewer, setAddingViewer] = useState(false);
  const [resettingAll, setResettingAll] = useState(false);
  const [savingUserIds, setSavingUserIds] = useState<Set<string>>(new Set());
  const [addUsername, setAddUsername] = useState("");
  const [initialPoints, setInitialPoints] = useState("0");
  const [selectedChannel, setSelectedChannel] =
    useState<TwitchChannelResult | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await services.economy.listUsers({
        search: debouncedSearch || undefined,
        page,
        limit,
        sortBy,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch {
      toast({
        title: "Erro ao carregar usuários",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, limit, page, sortBy, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortBy]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const patchUser = useCallback((viewer: ChannelViewerEconomyDto) => {
    setItems((prev) =>
      prev.map((item) => (item.id === viewer.id ? viewer : item))
    );
  }, []);

  const withUserSave = useCallback(
    async (
      userId: string,
      action: () => Promise<ChannelViewerEconomyDto | void>
    ): Promise<boolean> => {
      setSavingUserIds((prev) => new Set(prev).add(userId));
      try {
        const result = await action();
        if (result) {
          patchUser(result);
        }
        return true;
      } catch (error) {
        return false;
      } finally {
        setSavingUserIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    },
    [patchUser]
  );

  const findUserId = useCallback(
    (twitchUserId: string) =>
      items.find((item) => item.twitchUserId === twitchUserId)?.id ?? twitchUserId,
    [items]
  );

  const adjustPoints = async (payload: {
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
    amount: number;
    reason: string;
    action: "add" | "remove";
  }): Promise<boolean> => {
    const userId = findUserId(payload.twitchUserId);
    return withUserSave(userId, async () => {
      try {
        const viewer = await services.economy.adjustPoints(payload);
        toast({ title: "Pontos atualizados com sucesso" });
        return viewer;
      } catch (error) {
        toast({
          title: "Erro ao ajustar pontos",
          description: getApiErrorMessage(error, "Verifique os dados e tente novamente."),
          variant: "destructive",
        });
        throw error;
      }
    });
  };

  const setPoints = async (payload: {
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
    points: number;
    reason: string;
  }): Promise<boolean> => {
    const userId = findUserId(payload.twitchUserId);
    return withUserSave(userId, async () => {
      try {
        const viewer = await services.economy.setPoints(payload);
        toast({ title: "Saldo de pontos atualizado" });
        return viewer;
      } catch (error) {
        toast({
          title: "Erro ao definir pontos",
          description: getApiErrorMessage(error, "Verifique os dados e tente novamente."),
          variant: "destructive",
        });
        throw error;
      }
    });
  };

  const adjustCoins = async (payload: {
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
    amount: number;
    reason: string;
    action: "add" | "remove";
  }): Promise<boolean> => {
    const userId = findUserId(payload.twitchUserId);
    return withUserSave(userId, async () => {
      try {
        await services.economy.adjustCoins(payload);
        toast({ title: "Coins atualizadas com sucesso" });
      } catch (error) {
        toast({
          title: "Erro ao ajustar coins",
          description: getApiErrorMessage(error, "Verifique os dados e tente novamente."),
          variant: "destructive",
        });
        throw error;
      }
    });
  };

  const resetUser = async (payload: {
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
    resetPoints: boolean;
    resetXp: boolean;
    reason: string;
  }): Promise<boolean> => {
    const userId = findUserId(payload.twitchUserId);
    return withUserSave(userId, async () => {
      try {
        const viewer = await services.economy.resetUser(payload);
        toast({ title: "Usuário resetado com sucesso" });
        return viewer;
      } catch (error) {
        toast({
          title: "Erro ao resetar usuário",
          description: getApiErrorMessage(error, "Verifique os dados e tente novamente."),
          variant: "destructive",
        });
        throw error;
      }
    });
  };

  const resetAllPoints = async (reason: string) => {
    setResettingAll(true);
    try {
      const result = await services.economy.resetAllPoints({
        reason,
        confirmPhrase: "RESETAR TODOS OS PONTOS",
      });
      toast({
        title: "Pontos resetados",
        description: `${result.affected} usuário(s) afetado(s).`,
      });
      await load();
    } catch (error) {
      toast({
        title: "Erro ao resetar pontos do canal",
        description: getApiErrorMessage(error, "Tente novamente em instantes."),
        variant: "destructive",
      });
    } finally {
      setResettingAll(false);
    }
  };

  const excludeLogins = useMemo(
    () => items.map((user) => user.twitchUsername),
    [items]
  );

  const addViewer = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const login = addUsername.trim().toLowerCase().replace(/^@/, "");
      if (!login) {
        toast({
          title: "Informe um usuário",
          description: "Busque e selecione um viewer na Twitch.",
          variant: "destructive",
        });
        return;
      }

      setAddingViewer(true);
      try {
        const points = Math.max(0, Number(initialPoints) || 0);
        const viewer = await services.economy.addUser(
          selectedChannel
            ? {
                twitchUserId: selectedChannel.id,
                twitchUsername: selectedChannel.login,
                displayName: selectedChannel.displayName,
                initialPoints: points,
              }
            : { twitchUsername: login, initialPoints: points }
        );
        setAddUsername("");
        setInitialPoints("0");
        setSelectedChannel(null);
        await load();
        toast({
          title: "Viewer adicionado",
          description: `@${viewer.twitchUsername} cadastrado com ${viewer.points.toLocaleString("pt-BR")} pontos.`,
        });
      } catch (error) {
        toast({
          title: "Não foi possível adicionar",
          description: getApiErrorMessage(
            error,
            "Verifique se o usuário já está na lista."
          ),
          variant: "destructive",
        });
      } finally {
        setAddingViewer(false);
      }
    },
    [addUsername, initialPoints, selectedChannel, load, toast]
  );

  const isSavingUser = useCallback(
    (userId: string) => savingUserIds.has(userId),
    [savingUserIds]
  );

  const applyUserEdit = useCallback(
    async (payload: {
      user: ChannelViewerEconomyDto;
      points: number;
      originalCoins: number;
      coins: number;
      resetXp: boolean;
      reason: string;
    }): Promise<boolean> => {
      const {
        user,
        points,
        originalCoins,
        coins,
        resetXp,
        reason,
      } = payload;
      const base = {
        twitchUserId: user.twitchUserId,
        twitchUsername: user.twitchUsername,
        displayName: user.displayName,
        reason,
      };

      const userId = findUserId(user.twitchUserId);
      setSavingUserIds((prev) => new Set(prev).add(userId));

      try {
        let updatedUser: ChannelViewerEconomyDto | null = null;

        if (points !== user.points) {
          updatedUser = await services.economy.setPoints({
            ...base,
            points,
          });
          patchUser(updatedUser);
        }

        if (coins !== originalCoins) {
          const delta = coins - originalCoins;
          await services.economy.adjustCoins({
            ...base,
            amount: Math.abs(delta),
            action: delta > 0 ? "add" : "remove",
          });
        }

        if (resetXp) {
          const resetResult = await services.economy.resetUser({
            ...base,
            resetPoints: false,
            resetXp: true,
          });
          patchUser(resetResult);
        }

        toast({ title: "Alterações aplicadas com sucesso" });
        return true;
      } catch (error) {
        toast({
          title: "Erro ao aplicar alterações",
          description: getApiErrorMessage(
            error,
            "Verifique os dados e tente novamente."
          ),
          variant: "destructive",
        });
        return false;
      } finally {
        setSavingUserIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    },
    [findUserId, patchUser, toast]
  );

  return {
    items,
    total,
    page,
    setPage,
    totalPages,
    search,
    setSearch,
    sortBy,
    setSortBy,
    loading,
    addingViewer,
    resettingAll,
    savingUserIds,
    isSavingUser,
    addUsername,
    setAddUsername,
    initialPoints,
    setInitialPoints,
    selectedChannel,
    setSelectedChannel,
    excludeLogins,
    addViewer,
    adjustPoints,
    setPoints,
    adjustCoins,
    resetUser,
    resetAllPoints,
    applyUserEdit,
    reload: load,
  };
}
