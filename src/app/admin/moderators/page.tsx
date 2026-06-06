"use client";

import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeratorUserSearch } from "@/components/admin/ModeratorUserSearch";
import { ModeratorAvatar } from "@/components/admin/moderators/ModeratorAvatar";
import { ModeratorListItem } from "@/components/admin/moderators/ModeratorListItem";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSection } from "@/components/admin/shared/AdminSection";
import { AdminStreamerFormSelect } from "@/components/admin/shared/AdminStreamerFormSelect";
import { useAdminModeratorsPage } from "@features/admin/hooks/use-admin-moderators-page.hook";

export default function AdminModeratorsPage() {
  const {
    ownerChannel,
    moderatedChannels,
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
        description={
          canModerateOthers
            ? "Selecione para qual streamer você está configurando moderadores."
            : undefined
        }
        contentClassName="space-y-4"
      >
        {canModerateOthers ? (
          <AdminStreamerFormSelect
            value={manageTarget}
            onChange={setManageTarget}
            ownerChannel={ownerChannel}
            moderatedChannels={moderatedChannels}
            label="Streamer"
            disabledHint="Os moderadores serão adicionados ao seu canal."
            enabledHint="Canal para o qual você deseja adicionar moderadores."
          />
        ) : (
          <p className="text-body-sm text-muted-foreground">
            Gerenciando moderadores de {channelLabel}
          </p>
        )}
      </AdminSection>

      <AdminSection
        title="Adicionar moderador"
        description={`Busque o canal na Twitch e adicione à lista de ${channelLabel}. A pessoa precisa ter conta na Twitch; ao fazer login no Streaminhub, verá o canal no painel.`}
      >
        <form onSubmit={handleConfirmAdd} className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="space-y-2 sm:flex-1">
              <ModeratorUserSearch
                value={username}
                onChange={handleUsernameChange}
                onSelect={handleUserSelect}
                onSearchingChange={handleSearchingChange}
                onSearchComplete={handleSearchComplete}
                disabled={submitting}
                excludeLogins={excludeLogins}
              />

              {searchFeedback === "not_found" ? (
                <p className="text-body-sm text-destructive/80">
                  Usuário não encontrado na Twitch.
                </p>
              ) : null}

              {searchFeedback === "already_moderator" ? (
                <p className="text-body-sm text-destructive/80">
                  Este usuário já é moderador deste canal.
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              disabled={submitting || isSearching || !pendingUser}
              className="shrink-0"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : pendingUser ? (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Confirmar adição
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Adicionar
                </>
              )}
            </Button>
          </div>

          {pendingUser ? (
            <div className="flex items-center gap-3 rounded-lg border border-outline-variant/30 bg-surface-container-low/50 px-3 py-2.5">
              <ModeratorAvatar
                username={pendingUser.login}
                imageUrl={pendingUser.thumbnailUrl}
                size={40}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {pendingUser.displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  @{pendingUser.login}
                </p>
              </div>
            </div>
          ) : null}
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
            {moderators.map((moderator) => (
              <ModeratorListItem
                key={moderator.id}
                moderator={moderator}
                onRemove={handleRemove}
              />
            ))}
          </ul>
        )}
      </AdminSection>
    </div>
  );
}
