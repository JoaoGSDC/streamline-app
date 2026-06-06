"use client";

import { useState } from "react";
import { AlertTriangle, Search, UserPlus, Users } from "lucide-react";
import { ModeratorUserSearch } from "@/components/admin/ModeratorUserSearch";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminConfigSection } from "@/components/admin/shared/AdminConfigSection";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { EconomyPagination } from "@features/economy/components/EconomyPagination";
import { EconomyUserEditDrawer } from "@features/economy/components/EconomyUserEditDrawer";
import { EconomyUsersTable } from "@features/economy/components/EconomyUsersTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChannelViewerEconomyDto } from "@server/economy/economy.types";
import { useEconomyUsersPage } from "@features/economy/hooks/use-economy-users-page.hook";

export default function EconomyUsersPage() {
  const {
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
    setSelectedChannel,
    excludeLogins,
    addViewer,
    applyUserEdit,
    resetAllPoints,
  } = useEconomyUsersPage();

  const [editUser, setEditUser] = useState<ChannelViewerEconomyDto | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [resetAllOpen, setResetAllOpen] = useState(false);
  const [resetAllReason, setResetAllReason] = useState("");
  const [resetAllConfirm, setResetAllConfirm] = useState("");

  const handleEdit = (user: ChannelViewerEconomyDto) => {
    setEditUser(user);
    setEditDrawerOpen(true);
  };

  return (
    <div className="admin-page-stack pb-20">
      <AdminPageHeader
        title="Usuários"
        description="Gerencie pontos, coins e progressão dos viewers do canal."
      />

      <div className="admin-config-stack">
        <AdminConfigSection
          title="Adicionar viewer"
          description="Cadastre manualmente um usuário da Twitch com saldo inicial opcional."
          showDivider={false}
        >
          <form onSubmit={addViewer} className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <ModeratorUserSearch
                value={addUsername}
                onChange={(login) => {
                  setAddUsername(login);
                  setSelectedChannel(null);
                }}
                onSelect={setSelectedChannel}
                disabled={addingViewer}
                className="sm:flex-1"
                placeholder="Buscar viewer na Twitch…"
                inputAriaLabel="Buscar viewer na Twitch para adicionar"
                listboxId="economy-add-viewer-listbox"
                excludeLogins={excludeLogins}
              />
              <div className="space-y-1 sm:w-36">
                <Label htmlFor="initial-points">Pontos iniciais</Label>
                <Input
                  id="initial-points"
                  type="number"
                  min={0}
                  value={initialPoints}
                  onChange={(e) => setInitialPoints(e.target.value)}
                  disabled={addingViewer}
                />
              </div>
              <Button
                type="submit"
                disabled={addingViewer || !addUsername.trim()}
                className="sm:shrink-0"
              >
                <UserPlus className="mr-2 h-4 w-4" aria-hidden />
                {addingViewer ? "Adicionando…" : "Adicionar"}
              </Button>
            </div>
          </form>
        </AdminConfigSection>

        <AdminConfigSection title="Lista de usuários">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar usuário…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="shrink-0 text-label">Ordenar</Label>
              <Select
                value={sortBy}
                onValueChange={(v) =>
                  setSortBy(v as "points" | "level" | "activity")
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Pontos</SelectItem>
                  <SelectItem value="level">Nível</SelectItem>
                  <SelectItem value="activity">Atividade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <AdminEmptyState
              icon={Users}
              title="Nenhum viewer com pontuação"
              description="Usuários aparecerão aqui assim que ganharem pontos ou XP na sua live."
            />
          ) : (
            <>
              <EconomyUsersTable
                items={items}
                savingIds={savingUserIds}
                onEdit={handleEdit}
              />
              <EconomyPagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
              <p className="pt-1 text-center text-caption">
                {total} usuário{total === 1 ? "" : "s"} no total
              </p>
            </>
          )}
        </AdminConfigSection>
      </div>

      <div className="admin-save-footer justify-between">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setResetAllOpen(true)}
        >
          Resetar todos os pontos do canal
        </Button>
      </div>

      <EconomyUserEditDrawer
        open={editDrawerOpen}
        user={editUser}
        saving={editUser ? isSavingUser(editUser.id) : false}
        onOpenChange={(open) => {
          setEditDrawerOpen(open);
          if (!open) setEditUser(null);
        }}
        onApply={applyUserEdit}
      />

      <Dialog open={resetAllOpen} onOpenChange={setResetAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Resetar pontos de todos
            </DialogTitle>
            <DialogDescription>
              Esta ação zera os pontos de todos os viewers do canal. Coins não
              são afetadas. A operação é irreversível e registrada em auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="reset-reason">Motivo</Label>
              <Input
                id="reset-reason"
                value={resetAllReason}
                onChange={(e) => setResetAllReason(e.target.value)}
                placeholder="Ex.: Nova temporada de pontos"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reset-confirm">
                Digite RESETAR TODOS OS PONTOS para confirmar
              </Label>
              <Input
                id="reset-confirm"
                value={resetAllConfirm}
                onChange={(e) => setResetAllConfirm(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetAllOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={
                resettingAll ||
                resetAllReason.length < 3 ||
                resetAllConfirm !== "RESETAR TODOS OS PONTOS"
              }
              onClick={async () => {
                await resetAllPoints(resetAllReason);
                setResetAllOpen(false);
                setResetAllReason("");
                setResetAllConfirm("");
              }}
            >
              Confirmar reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
