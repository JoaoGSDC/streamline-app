"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function ReasonField({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-body-xs text-muted-foreground">
        Motivo
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Obrigatório para auditoria"
        className="h-9"
      />
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
  const [pointsReason, setPointsReason] = useState("");
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

  const reasonOk = (reason: string) => reason.trim().length >= 3;
  const balanceChanged =
    Math.max(0, Number(exactPoints) || 0) !== user.points;
  const adjustAmountOk = (Number(adjustAmount) || 0) >= 1;

  const levelLabel = user.levelTitle
    ? `Nv. ${user.level} · ${user.levelTitle}`
    : `Nv. ${user.level}`;

  const handleSetPoints = async () => {
    if (!reasonOk(pointsReason) || !balanceChanged || saving) return;
    const ok = await onSetPoints({
      ...basePayload,
      points: Math.max(0, Number(exactPoints) || 0),
      reason: pointsReason.trim(),
    });
    if (ok) setPointsReason("");
  };

  const handleAdjust = async (action: "add" | "remove") => {
    if (!reasonOk(pointsReason) || !adjustAmountOk || saving) return;
    const ok = await onAdjustPoints({
      ...basePayload,
      amount: Number(adjustAmount) || 0,
      reason: pointsReason.trim(),
      action,
    });
    if (ok) setPointsReason("");
  };

  const handleAdjustCoins = async (action: "add" | "remove") => {
    if (!reasonOk(coinsReason) || (Number(coinsAmount) || 0) < 1 || saving) return;
    const ok = await onAdjustCoins({
      ...basePayload,
      amount: Number(coinsAmount) || 0,
      reason: coinsReason.trim(),
      action,
    });
    if (ok) setCoinsReason("");
  };

  const handleReset = async () => {
    if (!reasonOk(resetReason) || (!resetPoints && !resetXp) || saving) return;
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
      <AccordionTrigger className="gap-2 py-2.5 hover:no-underline [&[data-state=open]>svg]:rotate-180">
        <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <div className="min-w-0 flex-1 truncate">
            <span className="text-body-sm font-medium">{user.displayName}</span>
            <span className="text-body-sm text-muted-foreground">
              {" "}
              @{user.twitchUsername}
            </span>
          </div>
          <span className="hidden shrink-0 text-body-xs tabular-nums text-muted-foreground sm:inline">
            {user.points.toLocaleString("pt-BR")} pts · {levelLabel}
          </span>
          <span className="shrink-0 text-body-xs tabular-nums text-muted-foreground sm:hidden">
            {user.points.toLocaleString("pt-BR")} pts
          </span>
        </div>
      </AccordionTrigger>

      <AccordionContent className="pb-3 pt-0">
        <Tabs defaultValue="points" className="w-full">
          <TabsList className="grid h-8 w-full grid-cols-3">
            <TabsTrigger value="points" className="text-body-xs">
              Pontos
            </TabsTrigger>
            <TabsTrigger value="coins" className="text-body-xs">
              Coins
            </TabsTrigger>
            <TabsTrigger value="reset" className="text-body-xs">
              Reset
            </TabsTrigger>
          </TabsList>

          <TabsContent value="points" className="mt-3 space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[8rem] flex-1 space-y-1">
                <Label
                  htmlFor={`points-${user.id}`}
                  className="text-body-xs text-muted-foreground"
                >
                  Saldo
                </Label>
                <Input
                  id={`points-${user.id}`}
                  type="number"
                  min={0}
                  value={exactPoints}
                  onChange={(e) => setExactPoints(e.target.value)}
                  disabled={saving}
                  className="h-9"
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="h-9"
                disabled={
                  saving || !balanceChanged || !reasonOk(pointsReason)
                }
                onClick={() => void handleSetPoints()}
              >
                {saving ? "…" : "Salvar"}
              </Button>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label className="text-body-xs text-muted-foreground">
                  Ajuste
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    disabled={
                      saving || !adjustAmountOk || !reasonOk(pointsReason)
                    }
                    onClick={() => void handleAdjust("remove")}
                    aria-label="Remover pontos"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    disabled={saving}
                    className="h-9 w-20 tabular-nums"
                    aria-label="Quantidade de pontos"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    disabled={
                      saving || !adjustAmountOk || !reasonOk(pointsReason)
                    }
                    onClick={() => void handleAdjust("add")}
                    aria-label="Adicionar pontos"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="pb-2 text-body-xs text-muted-foreground">
                Atual: {user.points.toLocaleString("pt-BR")} ·{" "}
                {user.xp.toLocaleString("pt-BR")} XP
              </p>
            </div>

            <ReasonField
              id={`points-reason-${user.id}`}
              value={pointsReason}
              onChange={setPointsReason}
              disabled={saving}
            />
          </TabsContent>

          <TabsContent value="coins" className="mt-3 space-y-3">
            <p className="text-body-xs text-muted-foreground">
              Coins são da conta na plataforma, não do canal.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label className="text-body-xs text-muted-foreground">
                  Quantidade
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={coinsAmount}
                  onChange={(e) => setCoinsAmount(e.target.value)}
                  disabled={saving}
                  className="h-9 w-24 tabular-nums"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                disabled={
                  saving ||
                  (Number(coinsAmount) || 0) < 1 ||
                  !reasonOk(coinsReason)
                }
                onClick={() => void handleAdjustCoins("remove")}
              >
                Remover
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-9"
                disabled={
                  saving ||
                  (Number(coinsAmount) || 0) < 1 ||
                  !reasonOk(coinsReason)
                }
                onClick={() => void handleAdjustCoins("add")}
              >
                Adicionar
              </Button>
            </div>
            <ReasonField
              id={`coins-reason-${user.id}`}
              value={coinsReason}
              onChange={setCoinsReason}
              disabled={saving}
            />
          </TabsContent>

          <TabsContent value="reset" className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-4 text-body-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={resetPoints}
                  onChange={(e) => setResetPoints(e.target.checked)}
                  disabled={saving}
                  className="rounded border-input"
                />
                Zerar pontos
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={resetXp}
                  onChange={(e) => setResetXp(e.target.checked)}
                  disabled={saving}
                  className="rounded border-input"
                />
                Zerar XP
              </label>
            </div>
            <ReasonField
              id={`reset-reason-${user.id}`}
              value={resetReason}
              onChange={setResetReason}
              disabled={saving}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-9"
                disabled={
                  saving ||
                  (!resetPoints && !resetXp) ||
                  !reasonOk(resetReason)
                }
                onClick={() => void handleReset()}
              >
                Resetar
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </AccordionContent>
    </AccordionItem>
  );
}
