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
  const [submitting, setSubmitting] = useState(false);
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

  const adjustPoints = async (payload: {
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
    amount: number;
    reason: string;
    action: "add" | "remove";
  }) => {
    setSubmitting(true);
    try {
      await services.economy.adjustPoints(payload);
      toast({ title: "Pontos atualizados com sucesso" });
      await load();
    } catch {
      toast({
        title: "Erro ao ajustar pontos",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const setPoints = async (payload: {
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
    points: number;
    reason: string;
  }) => {
    setSubmitting(true);
    try {
      await services.economy.setPoints(payload);
      toast({ title: "Saldo de pontos atualizado" });
      await load();
    } catch {
      toast({
        title: "Erro ao definir pontos",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const adjustCoins = async (payload: {
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
    amount: number;
    reason: string;
    action: "add" | "remove";
  }) => {
    setSubmitting(true);
    try {
      await services.economy.adjustCoins(payload);
      toast({ title: "Coins atualizadas com sucesso" });
      await load();
    } catch {
      toast({
        title: "Erro ao ajustar coins",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetUser = async (payload: {
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
    resetPoints: boolean;
    resetXp: boolean;
    reason: string;
  }) => {
    setSubmitting(true);
    try {
      await services.economy.resetUser(payload);
      toast({ title: "Usuário resetado com sucesso" });
      await load();
    } catch {
      toast({
        title: "Erro ao resetar usuário",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetAllPoints = async (reason: string) => {
    setSubmitting(true);
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
    } catch {
      toast({
        title: "Erro ao resetar pontos do canal",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
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

      setSubmitting(true);
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
        setSubmitting(false);
      }
    },
    [addUsername, initialPoints, selectedChannel, load, toast]
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
    submitting,
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
    reload: load,
  };
}
