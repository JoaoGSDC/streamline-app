"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChannelViewerEconomyDto } from "@server/economy/economy.types";

interface EconomyUserAccordionRowProps {
  user: ChannelViewerEconomyDto;
  saving?: boolean;
  onSetPoints: (payload: {
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
    points: number;
    reason: string;
  }) => Promise<boolean>;
  onAdjustPoints: (payload: {
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
    amount: number;
    reason: string;
    action: "add" | "remove";
  }) => Promise<boolean>;
  onAdjustCoins: (payload: {
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
    amount: number;
    reason: string;
    action: "add" | "remove";
  }) => Promise<boolean>;
  onResetUser: (payload: {
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
    resetPoints: boolean;
    resetXp: boolean;
    reason: string;
  }) => Promise<boolean>;
}

function SectionSaveBar({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2 border-t border-outline-variant/20 pt-4">
      {hint ? (
        <p className="text-body-xs text-muted-foreground">{hint}</p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">{children}</div>
    </div>
  );
}

export function EconomyUserAccordionRow({
  user,
  saving = false,
  onSetPoints,
  onAdjustPoints,
  onAdjustCoins,
  onResetUser,
}: EconomyUserAccordionRowProps) {
  const [exactPoints, setExactPoints] = useState(String(user.points));
  const [adjustAmount, setAdjustAmount] = useState("100");
  const [coinsAmount, setCoinsAmount] = useState("100");
  const [balanceReason, setBalanceReason] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [coinsReason, setCoinsReason] = useState("");
  const [resetReason, setResetReason] = useState("");
  const [resetPoints, setResetPoints] = useState(true);
  const [resetXp, setResetXp] = useState(false);

  useEffect(() => {
    setExactPoints(String(user.points));
  }, [user.points]);

  const basePayload = {
    twitchUserId: user.twitchUserId,
    twitchUsername: user.twitchUsername,
    displayName: user.displayName,
  };

  const balanceChanged =
    Math.max(0, Number(exactPoints) || 0) !== user.points;
  const canSaveBalance =
    balanceReason.trim().length >= 3 && balanceChanged && !saving;
  const canAdjust =
    adjustReason.trim().length >= 3 &&
    (Number(adjustAmount) || 0) >= 1 &&
    !saving;
  const canAdjustCoins =
    coinsReason.trim().length >= 3 &&
    (Number(coinsAmount) || 0) >= 1 &&
    !saving;
  const canReset =
    resetReason.trim().length >= 3 &&
    (resetPoints || resetXp) &&
    !saving;

  const handleSetPoints = async () => {
    const ok = await onSetPoints({
      ...basePayload,
      points: Math.max(0, Number(exactPoints) || 0),
      reason: balanceReason.trim(),
    });
    if (ok) setBalanceReason("");
  };

  const handleAdjust = async (action: "add" | "remove") => {
    const ok = await onAdjustPoints({
      ...basePayload,
      amount: Number(adjustAmount) || 0,
      reason: adjustReason.trim(),
      action,
    });
    if (ok) setAdjustReason("");
  };

  const handleAdjustCoins = async (action: "add" | "remove") => {
    const ok = await onAdjustCoins({
      ...basePayload,
      amount: Number(coinsAmount) || 0,
      reason: coinsReason.trim(),
      action,
    });
    if (ok) setCoinsReason("");
  };

  const handleReset = async () => {
    const ok = await onResetUser({
      ...basePayload,
      resetPoints,
      resetXp,
      reason: resetReason.trim(),
    });
    if (ok) setResetReason("");
  };

  return (
    <AccordionItem
      value={user.id}
      className="overflow-hidden rounded-lg border border-outline-variant/30 px-3"
    >
      <AccordionTrigger className="gap-3 py-3 hover:no-underline">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-left sm:flex-row sm:items-center sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{user.displayName}</div>
            <div className="truncate text-body-xs text-muted-foreground">
              @{user.twitchUsername}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-outline-variant/50 bg-transparent font-mono shadow-none"
            >
              {user.points.toLocaleString("pt-BR")} pts
            </Badge>
            <Badge
              variant="outline"
              className="border-outline-variant/50 bg-muted/30 shadow-none"
            >
              Nv. {user.level}
              {user.levelTitle ? ` · ${user.levelTitle}` : ""}
            </Badge>
            <span className="hidden text-body-xs text-muted-foreground sm:inline">
              {user.xp.toLocaleString("pt-BR")} XP
            </span>
            {balanceChanged && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex text-amber-500"
                    role="img"
                    aria-label="Saldo alterado"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <AlertCircle className="h-4 w-4" aria-hidden />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">Saldo não salvo</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="space-y-6 pb-4">
        <div className="space-y-3">
          <div>
            <h4 className="text-body-sm font-medium">Saldo de pontos</h4>
            <p className="text-body-xs text-muted-foreground">
              Define o valor exato — substitui o saldo atual.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`points-${user.id}`}>Pontos</Label>
              <Input
                id={`points-${user.id}`}
                type="number"
                min={0}
                value={exactPoints}
                onChange={(e) => setExactPoints(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`balance-reason-${user.id}`}>
                Motivo (obrigatório)
              </Label>
              <Textarea
                id={`balance-reason-${user.id}`}
                rows={2}
                value={balanceReason}
                onChange={(e) => setBalanceReason(e.target.value)}
                disabled={saving}
                placeholder="Ex.: Correção manual de saldo"
              />
            </div>
          </div>
          <SectionSaveBar
            hint={
              !balanceChanged
                ? "Altere o saldo para habilitar o salvamento."
                : balanceReason.trim().length < 3
                  ? "Informe um motivo com pelo menos 3 caracteres."
                  : undefined
            }
          >
            <Button
              type="button"
              size="sm"
              disabled={!canSaveBalance}
              onClick={() => void handleSetPoints()}
            >
              {saving ? "Salvando…" : "Salvar saldo"}
            </Button>
          </SectionSaveBar>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="text-body-sm font-medium">Ajuste rápido (+ / −)</h4>
            <p className="text-body-xs text-muted-foreground">
              Adiciona ou remove pontos em relação ao saldo atual.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`adjust-amount-${user.id}`}>Quantidade</Label>
              <Input
                id={`adjust-amount-${user.id}`}
                type="number"
                min={1}
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`adjust-reason-${user.id}`}>
                Motivo (obrigatório)
              </Label>
              <Textarea
                id={`adjust-reason-${user.id}`}
                rows={2}
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                disabled={saving}
                placeholder="Ex.: Bônus por evento na live"
              />
            </div>
          </div>
          <SectionSaveBar
            hint={
              adjustReason.trim().length < 3
                ? "Informe um motivo com pelo menos 3 caracteres."
                : undefined
            }
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canAdjust}
              onClick={() => void handleAdjust("remove")}
            >
              Remover
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!canAdjust}
              onClick={() => void handleAdjust("add")}
            >
              Adicionar
            </Button>
          </SectionSaveBar>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="text-body-sm font-medium">Coins</h4>
            <p className="text-body-xs text-muted-foreground">
              Coins pertencem ao usuário na plataforma — não ao canal.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`coins-amount-${user.id}`}>Quantidade</Label>
              <Input
                id={`coins-amount-${user.id}`}
                type="number"
                min={1}
                value={coinsAmount}
                onChange={(e) => setCoinsAmount(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`coins-reason-${user.id}`}>
                Motivo (obrigatório)
              </Label>
              <Textarea
                id={`coins-reason-${user.id}`}
                rows={2}
                value={coinsReason}
                onChange={(e) => setCoinsReason(e.target.value)}
                disabled={saving}
                placeholder="Ex.: Compensação de compra"
              />
            </div>
          </div>
          <SectionSaveBar
            hint={
              coinsReason.trim().length < 3
                ? "Informe um motivo com pelo menos 3 caracteres."
                : undefined
            }
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canAdjustCoins}
              onClick={() => void handleAdjustCoins("remove")}
            >
              Remover coins
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!canAdjustCoins}
              onClick={() => void handleAdjustCoins("add")}
            >
              Adicionar coins
            </Button>
          </SectionSaveBar>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="text-body-sm font-medium">Reset</h4>
            <p className="text-body-xs text-muted-foreground">
              Zera pontos e/ou progresso de XP do viewer neste canal.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-body-sm">
              <input
                type="checkbox"
                checked={resetPoints}
                onChange={(e) => setResetPoints(e.target.checked)}
                disabled={saving}
              />
              Zerar pontos
            </label>
            <label className="flex items-center gap-2 text-body-sm">
              <input
                type="checkbox"
                checked={resetXp}
                onChange={(e) => setResetXp(e.target.checked)}
                disabled={saving}
              />
              Zerar XP e nível
            </label>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`reset-reason-${user.id}`}>
              Motivo (obrigatório)
            </Label>
            <Textarea
              id={`reset-reason-${user.id}`}
              rows={2}
              value={resetReason}
              onChange={(e) => setResetReason(e.target.value)}
              disabled={saving}
              placeholder="Ex.: Usuário solicitou reset de temporada"
            />
          </div>
          <SectionSaveBar
            hint={
              !resetPoints && !resetXp
                ? "Selecione pelo menos uma opção de reset."
                : resetReason.trim().length < 3
                  ? "Informe um motivo com pelo menos 3 caracteres."
                  : undefined
            }
          >
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={!canReset}
              onClick={() => void handleReset()}
            >
              Confirmar reset
            </Button>
          </SectionSaveBar>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
