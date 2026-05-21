"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminChannelOptions } from "@/hooks/useAdminChannelOptions";
import { Button } from "@/components/ui/button";
import { ModeratorUserSearch } from "@/components/admin/ModeratorUserSearch";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSection } from "@/components/admin/shared/AdminSection";
import { AdminStreamerFormSelect } from "@/components/admin/shared/AdminStreamerFormSelect";

interface ModeratorRow {
  id: string;
  moderatorId: string;
  moderatorUsername: string;
  createdAt: string;
}

export default function AdminModeratorsPage() {
  const { toast } = useToast();
  const { ownerChannel, resolveFormStreamerId, userId, channels } =
    useAdminChannelOptions();

  const [manageTarget, setManageTarget] = useState("");
  const [moderators, setModerators] = useState<ModeratorRow[]>([]);
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

  /** Apenas o dono do canal pode gerenciar moderadores */
  const canManageModerators = Boolean(
    userId && targetStreamerId && userId === targetStreamerId
  );

  const loadModerators = useCallback(async () => {
    if (!targetStreamerId || !canManageModerators) {
      setModerators([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/streamers/${targetStreamerId}/moderators`);
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Erro",
          description: data.error ?? "Falha ao carregar moderadores",
          variant: "destructive",
        });
        return;
      }
      setModerators(data.moderators ?? []);
    } finally {
      setLoading(false);
    }
  }, [targetStreamerId, canManageModerators, toast]);

  useEffect(() => {
    void loadModerators();
  }, [loadModerators]);

  if (!ownerChannel && channels.length === 0) {
    return (
      <AdminPageHeader
        title="Moderadores"
        description="Faça login para gerenciar moderadores do seu canal."
      />
    );
  }

  if (!ownerChannel || !canManageModerators) {
    return (
      <AdminPageHeader
        title="Moderadores"
        description="Apenas o dono do canal pode adicionar ou remover moderadores."
      />
    );
  }

  const channelLabel = targetChannel?.twitchUsername
    ? `@${targetChannel.twitchUsername}`
    : "seu canal";

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const login = username.trim().toLowerCase().replace(/^@/, "");
    if (!targetStreamerId || !login) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/streamers/${targetStreamerId}/moderators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: login }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Não foi possível adicionar",
          description: data.error ?? "Erro desconhecido",
          variant: "destructive",
        });
        return;
      }

      setUsername("");
      await loadModerators();
      toast({
        title: "Moderador adicionado",
        description: `@${data.moderator.moderatorUsername} pode gerenciar ${channelLabel}.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (moderatorId: string, modUsername: string) => {
    if (!confirm(`Remover @${modUsername} como moderador de ${channelLabel}?`)) {
      return;
    }

    const res = await fetch(
      `/api/streamers/${targetStreamerId}/moderators?moderatorId=${encodeURIComponent(moderatorId)}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast({
        title: "Erro",
        description: data.error ?? "Falha ao remover",
        variant: "destructive",
      });
      return;
    }

    setModerators((prev) => prev.filter((m) => m.moderatorId !== moderatorId));
    toast({ title: "Moderador removido" });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Moderadores"
        description="Pessoas que podem agendar streams, gerenciar jogos e editar links do canal no painel admin."
      />

      <AdminSection
        title="Canal"
        description="Selecione para qual streamer você está configurando moderadores."
        contentClassName="space-y-4"
      >
        <AdminStreamerFormSelect
          value={manageTarget}
          onChange={setManageTarget}
          ownerChannel={ownerChannel}
          moderatedChannels={[]}
          alwaysShow
          label="Streamer"
          disabledHint="Os moderadores serão adicionados ao seu canal."
          enabledHint="Canal para o qual você deseja adicionar moderadores."
        />
      </AdminSection>

      <AdminSection
        title="Adicionar moderador"
        description={`Busque o canal na Twitch e adicione à lista de ${channelLabel}. A pessoa precisa ter conta na Twitch; ao fazer login no Streaminhub, verá o canal no painel.`}
      >
        <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row">
          <ModeratorUserSearch
            value={username}
            onChange={setUsername}
            disabled={submitting}
            className="sm:flex-1"
            excludeLogins={[
              targetChannel?.twitchUsername ?? "",
              ...moderators.map((m) => m.moderatorUsername),
            ]}
          />
          <Button type="submit" disabled={submitting || !username.trim()}>
            <UserPlus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </form>
      </AdminSection>

      <AdminSection
        title={`Moderadores ativos (${channelLabel})`}
        description="Quem pode gerenciar este canal no painel admin."
      >
        {loading ? (
          <p className="text-body-sm text-muted-foreground">Carregando…</p>
        ) : moderators.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">
            Nenhum moderador cadastrado ainda.
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant/30">
            {moderators.map((mod) => (
              <li
                key={mod.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-foreground">
                    @{mod.moderatorUsername}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    Desde{" "}
                    {new Date(mod.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover @${mod.moderatorUsername}`}
                  onClick={() =>
                    handleRemove(mod.moderatorId, mod.moderatorUsername)
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </AdminSection>
    </div>
  );
}
