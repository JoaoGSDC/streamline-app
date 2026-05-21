"use client";

import { Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeratorUserSearch } from "@/components/admin/ModeratorUserSearch";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSection } from "@/components/admin/shared/AdminSection";
import { AdminStreamerFormSelect } from "@/components/admin/shared/AdminStreamerFormSelect";
import { useAdminModeratorsPage } from "@features/admin/hooks/use-admin-moderators-page.hook";

export default function AdminModeratorsPage() {
  const {
    ownerChannel,
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
  } = useAdminModeratorsPage();

  if (!ownerChannel) {
    return (
      <AdminPageHeader
        title="Moderadores"
        description="Faça login para gerenciar moderadores do seu canal."
      />
    );
  }

  if (!canManageModerators) {
    return (
      <AdminPageHeader
        title="Moderadores"
        description="Apenas o dono do canal pode adicionar ou remover moderadores."
      />
    );
  }

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
            excludeLogins={excludeLogins}
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
