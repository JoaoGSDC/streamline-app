"use client";

import { useState } from "react";
import { AlertTriangle, Search, UserPlus, Users } from "lucide-react";
import { ModeratorUserSearch } from "@/components/admin/ModeratorUserSearch";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSection } from "@/components/admin/shared/AdminSection";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { EconomyUserActionsDialog } from "@features/economy/components/EconomyUserActionsDialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    submitting,
    addUsername,
    setAddUsername,
    initialPoints,
    setInitialPoints,
    setSelectedChannel,
    excludeLogins,
    addViewer,
    adjustPoints,
    setPoints,
    adjustCoins,
    resetUser,
    resetAllPoints,
  } = useEconomyUsersPage();

  const [selectedUser, setSelectedUser] =
    useState<ChannelViewerEconomyDto | null>(null);
  const [resetAllOpen, setResetAllOpen] = useState(false);
  const [resetAllReason, setResetAllReason] = useState("");
  const [resetAllConfirm, setResetAllConfirm] = useState("");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Usuários"
        description="Visualize saldos e faça ajustes manuais. Toda alteração é registrada em auditoria."
      >
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setResetAllOpen(true)}
        >
          Resetar todos os pontos
        </Button>
      </AdminPageHeader>

      <AdminSection
        title="Adicionar viewer"
        description="Cadastre manualmente um usuário da Twitch. Você pode já definir o saldo inicial de pontos."
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
              disabled={submitting}
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
                disabled={submitting}
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || !addUsername.trim()}
              className="sm:shrink-0"
            >
              <UserPlus className="mr-2 h-4 w-4" aria-hidden />
              {submitting ? "Adicionando…" : "Adicionar"}
            </Button>
          </div>
        </form>
      </AdminSection>

      <AdminSection title="Lista de usuários">
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
            <Label className="shrink-0 text-body-sm">Ordenar</Label>
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
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <AdminEmptyState
            icon={Users}
            title="Nenhum usuário encontrado"
            description="Os viewers aparecerão aqui quando interagirem com a pontuação do canal."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Nível / XP</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.displayName}</div>
                      <div className="text-body-xs text-muted-foreground">
                        @{user.twitchUsername}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.points.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      Nv. {user.level}
                      {user.levelTitle ? ` · ${user.levelTitle}` : ""}
                      <div className="text-body-xs text-muted-foreground">
                        {user.xp.toLocaleString("pt-BR")} XP
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        Gerenciar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <span className="text-body-sm text-muted-foreground">
                  Página {page} de {totalPages} · {total} total
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </AdminSection>

      {selectedUser && (
        <EconomyUserActionsDialog
          user={selectedUser}
          open={Boolean(selectedUser)}
          onOpenChange={(open) => !open && setSelectedUser(null)}
          submitting={submitting}
          onAdjustPoints={adjustPoints}
          onSetPoints={setPoints}
          onAdjustCoins={adjustCoins}
          onResetUser={resetUser}
        />
      )}

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
                submitting ||
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
