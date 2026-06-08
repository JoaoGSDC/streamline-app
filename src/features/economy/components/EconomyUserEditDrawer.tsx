"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { services } from "@services/index";
import type { ChannelViewerEconomyDto } from "@server/economy/economy.types";

const QUICK_ADJUST = [-100, -10, 10, 100] as const;

interface EconomyUserEditDrawerProps {
  open: boolean;
  user: ChannelViewerEconomyDto | null;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (payload: {
    user: ChannelViewerEconomyDto;
    points: number;
    originalCoins: number;
    coins: number;
    resetXp: boolean;
  }) => Promise<boolean>;
  onRemove?: (payload: {
    viewerId: string;
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
  }) => Promise<boolean>;
}

export function EconomyUserEditDrawer({
  open,
  user,
  saving = false,
  onOpenChange,
  onApply,
  onRemove,
}: EconomyUserEditDrawerProps) {
  const [points, setPoints] = useState(0);
  const [baselinePoints, setBaselinePoints] = useState(0);
  const [coins, setCoins] = useState(0);
  const [baselineCoins, setBaselineCoins] = useState(0);
  const [resetXp, setResetXp] = useState(false);
  const [loadingCoins, setLoadingCoins] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    if (!user || !open) return;

    const initialPoints = Number(user.points) || 0;
    setPoints(initialPoints);
    setBaselinePoints(initialPoints);
    setResetXp(false);
    setConfirmRemove(false);

    let cancelled = false;
    setLoadingCoins(true);
    void services.economy
      .getBalance(user.twitchUserId)
      .then((balance) => {
        if (cancelled) return;
        const loaded = balance.coins?.coins ?? 0;
        setCoins(loaded);
        setBaselineCoins(loaded);
      })
      .catch(() => {
        if (!cancelled) {
          setCoins(0);
          setBaselineCoins(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCoins(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, open]);

  if (!user) return null;

  const hasPointChange = points !== baselinePoints;
  const hasCoinsChange = !loadingCoins && coins !== baselineCoins;
  const hasChanges = hasPointChange || hasCoinsChange || resetXp;
  const canApply = hasChanges;

  const handleQuickAdjust = (delta: number) => {
    setPoints((current) => Math.max(0, current + delta));
  };

  const handleApply = async () => {
    if (!canApply || saving) return;
    const ok = await onApply({
      user,
      points,
      originalCoins: baselineCoins,
      coins,
      resetXp,
    });
    if (ok) onOpenChange(false);
  };

  const handleRemove = async () => {
    if (!onRemove || saving) return;
    const ok = await onRemove({
      viewerId: user.id,
      twitchUserId: user.twitchUserId,
      twitchUsername: user.twitchUsername,
      displayName: user.displayName,
    });
    if (ok) onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[480px] max-w-[480px] flex-col gap-0 p-0 sm:max-w-[480px]"
      >
        <SheetHeader className="border-b border-outline-variant/20 px-6 py-5 text-left">
          <SheetTitle className="text-section-title">Editar usuário</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="space-y-1">
            <Label>Usuário</Label>
            <Input
              value={`${user.displayName} (@${user.twitchUsername})`}
              readOnly
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-points">Pontos</Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_ADJUST.map((delta) => (
                <Button
                  key={delta}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => handleQuickAdjust(delta)}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </Button>
              ))}
            </div>
            <Input
              id="edit-points"
              type="number"
              min={0}
              value={points}
              disabled={saving}
              onChange={(event) =>
                setPoints(Math.max(0, Number(event.target.value) || 0))
              }
            />
            <p className="text-caption text-muted-foreground">
              Saldo atual: {baselinePoints.toLocaleString("pt-BR")} pts
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-coins">Coins</Label>
            <Input
              id="edit-coins"
              type="number"
              min={0}
              value={coins}
              disabled={saving || loadingCoins}
              onChange={(event) =>
                setCoins(Math.max(0, Number(event.target.value) || 0))
              }
            />
            <p className="text-caption text-muted-foreground">
              Coins são da conta na plataforma, não do canal.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-label">
            <input
              type="checkbox"
              checked={resetXp}
              onChange={(event) => setResetXp(event.target.checked)}
              disabled={saving}
              className="rounded border-input"
            />
            Zerar XP junto
          </label>

          {!hasChanges ? (
            <p className="text-xs text-muted-foreground">
              Altere pontos, coins ou marque zerar XP para habilitar o salvar.
            </p>
          ) : null}

          {onRemove ? (
            <div className="border-t border-outline-variant/20 pt-4">
              {confirmRemove ? (
                <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-sm text-foreground">
                    Remover @{user.twitchUsername} da lista deste canal?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    O histórico de pontuação do canal será excluído. Coins da
                    plataforma não são afetadas.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={() => setConfirmRemove(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={saving}
                      onClick={() => void handleRemove()}
                    >
                      {saving ? "Removendo…" : "Confirmar remoção"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={saving}
                  onClick={() => setConfirmRemove(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir da lista
                </Button>
              )}
            </div>
          ) : null}
        </div>

        <SheetFooter className="mt-auto gap-2 border-t border-outline-variant/20 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={saving || !canApply}
            onClick={() => void handleApply()}
          >
            {saving ? "Aplicando…" : "Aplicar alteração"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
