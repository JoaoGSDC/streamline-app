"use client";

import { useState } from "react";
import { Ban, Loader2, Trash2, UserPlus } from "lucide-react";
import { ModeratorUserSearch } from "@/components/admin/ModeratorUserSearch";
import { AdminConfigSection } from "@/components/admin/shared/AdminConfigSection";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useEconomyPointsBlocklist } from "@features/economy/hooks/use-economy-points-blocklist.hook";
import type { TwitchChannelResult } from "@/lib/twitch-api";

export function EconomyPointsBlocklistSection() {
  const { items, loading, adding, removingId, addEntry, removeEntry } =
    useEconomyPointsBlocklist();
  const [login, setLogin] = useState("");
  const [selectedUser, setSelectedUser] = useState<TwitchChannelResult | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const blockedLogins = items.map((item) => item.twitchLogin);

  const handleAdd = async () => {
    const normalized = login.trim().toLowerCase().replace(/^@/, "");
    if (!normalized) {
      setError("Informe o login do usuário.");
      return;
    }

    setError(null);
    const ok = await addEntry({
      twitchLogin: normalized,
      twitchUserId: selectedUser?.id,
      displayName: selectedUser?.displayName,
      reason: reason.trim() || undefined,
    });

    if (!ok) {
      setError("Não foi possível bloquear. Verifique se o usuário já está na lista.");
      return;
    }

    setLogin("");
    setSelectedUser(null);
    setReason("");
  };

  return (
    <AdminConfigSection
      title="Bloqueio de pontos"
      description="Usuários bloqueados não ganham pontos automaticamente (tempo na live, !daily, comandos do bot). Ajustes manuais pelo painel ainda são permitidos."
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="blocklist-user">Usuário da Twitch</Label>
            <ModeratorUserSearch
              value={login}
              onChange={setLogin}
              onSelect={(channel) => {
                setSelectedUser(channel);
                setLogin(channel.login);
              }}
              excludeLogins={blockedLogins}
              placeholder="Buscar @login..."
              inputAriaLabel="Buscar usuário para bloquear"
            />
          </div>
          <Button
            type="button"
            className="md:mb-0.5"
            disabled={adding || !login.trim()}
            onClick={() => void handleAdd()}
          >
            {adding ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-1.5 h-4 w-4" />
            )}
            Bloquear
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="blocklist-reason">Motivo (opcional)</Label>
          <Input
            id="blocklist-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex.: farm de pontos, conta secundária..."
            maxLength={300}
          />
        </div>

        {error && <p className="text-caption text-destructive">{error}</p>}

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : items.length === 0 ? (
          <AdminEmptyState
            icon={Ban}
            title="Nenhum usuário bloqueado"
            description="Adicione logins que não devem acumular pontos no canal."
          />
        ) : (
          <ul className="divide-y divide-border/40 rounded-lg border border-border/40">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{item.displayName}</div>
                  <div className="truncate font-mono text-xs text-muted-foreground">
                    @{item.twitchLogin}
                  </div>
                  {item.reason && (
                    <div className="mt-0.5 truncate text-caption text-muted-foreground">
                      {item.reason}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={removingId === item.id}
                  aria-label={`Desbloquear @${item.twitchLogin}`}
                  onClick={() => void removeEntry(item.id)}
                >
                  {removingId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminConfigSection>
  );
}
