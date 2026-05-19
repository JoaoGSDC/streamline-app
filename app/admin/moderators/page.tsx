"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { useAdminContext } from "@/components/admin/AdminProvider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ModeratorUserSearch } from "@/components/admin/ModeratorUserSearch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ModeratorRow {
  id: string;
  moderatorId: string;
  moderatorUsername: string;
  createdAt: string;
}

export default function AdminModeratorsPage() {
  const { toast } = useToast();
  const { actingAs, userId, loading: contextLoading } = useAdminContext();
  const [moderators, setModerators] = useState<ModeratorRow[]>([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isOwner =
    Boolean(actingAs && userId && actingAs.id === userId) ||
    actingAs?.role === "owner";

  const loadModerators = useCallback(async () => {
    if (!actingAs?.id || !isOwner) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/streamers/${actingAs.id}/moderators`);
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
  }, [actingAs?.id, isOwner, toast]);

  useEffect(() => {
    if (!contextLoading) {
      loadModerators();
    }
  }, [contextLoading, loadModerators]);

  if (contextLoading) {
    return (
      <p className="text-body-sm text-muted-foreground">Carregando painel…</p>
    );
  }

  if (!actingAs) {
    return (
      <Card className="glass-panel border-outline-variant/30">
        <CardHeader>
          <CardTitle>Moderadores</CardTitle>
          <CardDescription>
            Faça login para gerenciar moderadores do seu canal.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isOwner) {
    return (
      <Card className="glass-panel border-outline-variant/30">
        <CardHeader>
          <CardTitle>Moderadores</CardTitle>
          <CardDescription>
            Apenas o dono do canal pode gerenciar moderadores. Volte ao seu canal
            no seletor da sidebar.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const login = username.trim().toLowerCase().replace(/^@/, "");
    if (!actingAs.id || !login) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/streamers/${actingAs.id}/moderators`, {
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
        description: `@${data.moderator.moderatorUsername} pode gerenciar seu canal.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (moderatorId: string, modUsername: string) => {
    if (!confirm(`Remover @${modUsername} como moderador?`)) return;

    const res = await fetch(
      `/api/streamers/${actingAs.id}/moderators?moderatorId=${encodeURIComponent(moderatorId)}`,
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
      <div>
        <h1 className="font-headline text-display-sm font-bold text-foreground">
          Moderadores
        </h1>
        <p className="mt-1 text-body-md text-muted-foreground">
          Pessoas que podem agendar streams, gerenciar jogos e editar links do
          seu canal no painel admin.
        </p>
      </div>

      <Card className="relative z-10 overflow-visible border-outline-variant/30">
        <CardHeader>
          <CardTitle className="text-title-md">Adicionar moderador</CardTitle>
          <CardDescription>
            Busque o canal na Twitch e selecione na lista. A pessoa precisa ter
            conta na Twitch; ao fazer login no Streaminhub, verá seu canal no
            painel.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-visible">
          <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row">
            <ModeratorUserSearch
              value={username}
              onChange={setUsername}
              disabled={submitting}
              className="sm:flex-1"
              excludeLogins={[
                actingAs.twitchUsername,
                ...moderators.map((m) => m.moderatorUsername),
              ]}
            />
            <Button type="submit" disabled={submitting || !username.trim()}>
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-panel border-outline-variant/30">
        <CardHeader>
          <CardTitle className="text-title-md">Moderadores ativos</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
