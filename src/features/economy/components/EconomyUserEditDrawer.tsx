"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { services } from "@services/index";
import type { ChannelViewerEconomyDto } from "@server/economy/economy.types";

const QUICK_ADJUST = [-100, -10, 10, 100] as const;
const MIN_REASON_LENGTH = 10;

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
    reason: string;
  }) => Promise<boolean>;
}

export function EconomyUserEditDrawer({
  open,
  user,
  saving = false,
  onOpenChange,
  onApply,
}: EconomyUserEditDrawerProps) {
  const [points, setPoints] = useState(0);
  const [exactPoints, setExactPoints] = useState("");
  const [coins, setCoins] = useState(0);
  const [originalCoins, setOriginalCoins] = useState(0);
  const [resetXp, setResetXp] = useState(false);
  const [reason, setReason] = useState("");
  const [loadingCoins, setLoadingCoins] = useState(false);

  useEffect(() => {
    if (!user || !open) return;
    setPoints(user.points);
    setExactPoints(String(user.points));
    setResetXp(false);
    setReason("");

    let cancelled = false;
    setLoadingCoins(true);
    void services.economy
      .getBalance(user.twitchUserId)
      .then((balance) => {
        if (cancelled) return;
        const loaded = balance.coins?.coins ?? 0;
        setCoins(loaded);
        setOriginalCoins(loaded);
      })
      .catch(() => {
        if (!cancelled) {
          setCoins(0);
          setOriginalCoins(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCoins(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, open]);

  if (!user) return null;

  const reasonOk = reason.trim().length >= MIN_REASON_LENGTH;
  const exactChanged =
    exactPoints.trim() !== "" &&
    Math.max(0, Number(exactPoints) || 0) !== user.points;
  const targetPoints = exactChanged
    ? Math.max(0, Number(exactPoints) || 0)
    : points;
  const hasPointChange = targetPoints !== user.points;
  const hasCoinsChange = coins !== originalCoins;
  const canApply =
    reasonOk && (hasPointChange || hasCoinsChange || resetXp);

  const applyExact = (value: string) => {
    setExactPoints(value);
    const parsed = Math.max(0, Number(value) || 0);
    setPoints(parsed);
  };

  const handleQuickAdjust = (delta: number) => {
    const next = Math.max(0, points + delta);
    setPoints(next);
    setExactPoints(String(next));
  };

  const handleApply = async () => {
    if (!canApply || saving) return;
    const ok = await onApply({
      user,
      points: targetPoints,
      originalCoins,
      coins,
      resetXp,
      reason: reason.trim(),
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
              onChange={(e) => {
                const next = Math.max(0, Number(e.target.value) || 0);
                setPoints(next);
                setExactPoints(String(next));
              }}
            />
            <p className="text-caption">
              Saldo atual: {user.points.toLocaleString("pt-BR")} pts
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-exact-points">Definir exatamente para</Label>
            <Input
              id="edit-exact-points"
              type="number"
              min={0}
              value={exactPoints}
              disabled={saving}
              onChange={(e) => applyExact(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-coins">Coins</Label>
            <Input
              id="edit-coins"
              type="number"
              min={0}
              value={coins}
              disabled={saving || loadingCoins}
              onChange={(e) =>
                setCoins(Math.max(0, Number(e.target.value) || 0))
              }
            />
            <p className="text-caption">
              Coins são da conta na plataforma, não do canal.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-label">
            <input
              type="checkbox"
              checked={resetXp}
              onChange={(e) => setResetXp(e.target.checked)}
              disabled={saving}
              className="rounded border-input"
            />
            Zerar XP junto
          </label>

          <div className="space-y-2">
            <Label htmlFor="edit-reason">
              Motivo da alteração{" "}
              <span className="text-caption">(mín. {MIN_REASON_LENGTH} caracteres)</span>
            </Label>
            <Textarea
              id="edit-reason"
              rows={3}
              value={reason}
              disabled={saving}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo desta alteração…"
            />
          </div>
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
