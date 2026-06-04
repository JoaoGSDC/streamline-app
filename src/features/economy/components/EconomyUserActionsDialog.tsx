"use client";

import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { ChannelViewerEconomyDto } from "@server/economy/economy.types";

interface EconomyUserActionsDialogProps {
  user: ChannelViewerEconomyDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitting: boolean;
  onAdjustPoints: (payload: {
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
    amount: number;
    reason: string;
    action: "add" | "remove";
  }) => Promise<void>;
  onSetPoints: (payload: {
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
    points: number;
    reason: string;
  }) => Promise<void>;
  onAdjustCoins: (payload: {
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
    amount: number;
    reason: string;
    action: "add" | "remove";
  }) => Promise<void>;
  onResetUser: (payload: {
    twitchUserId: string;
    twitchUsername: string;
    displayName: string;
    resetPoints: boolean;
    resetXp: boolean;
    reason: string;
  }) => Promise<void>;
}

export function EconomyUserActionsDialog({
  user,
  open,
  onOpenChange,
  submitting,
  onAdjustPoints,
  onSetPoints,
  onAdjustCoins,
  onResetUser,
}: EconomyUserActionsDialogProps) {
  const [amount, setAmount] = useState("100");
  const [exactPoints, setExactPoints] = useState(String(user.points));
  const [reason, setReason] = useState("");
  const [resetPoints, setResetPoints] = useState(true);
  const [resetXp, setResetXp] = useState(false);

  useEffect(() => {
    if (open) {
      setExactPoints(String(user.points));
      setReason("");
    }
  }, [open, user.points]);

  const basePayload = {
    twitchUserId: user.twitchUserId,
    twitchUsername: user.twitchUsername,
    displayName: user.displayName,
  };

  const canSubmit = reason.trim().length >= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user.displayName}</DialogTitle>
          <DialogDescription>
            @{user.twitchUsername} · {user.points.toLocaleString("pt-BR")}{" "}
            pontos · Nv. {user.level}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="edit">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="edit">Editar</TabsTrigger>
            <TabsTrigger value="points">+ / −</TabsTrigger>
            <TabsTrigger value="coins">Coins</TabsTrigger>
            <TabsTrigger value="reset">Reset</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label htmlFor="exact-points">Saldo de pontos</Label>
              <Input
                id="exact-points"
                type="number"
                min={0}
                value={exactPoints}
                onChange={(e) => setExactPoints(e.target.value)}
              />
              <p className="text-body-xs text-muted-foreground">
                Define o valor exato — substitui o saldo atual.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-reason">Motivo (obrigatório)</Label>
              <Textarea
                id="edit-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                disabled={
                  submitting ||
                  !canSubmit ||
                  Number(exactPoints) === user.points
                }
                onClick={() =>
                  void onSetPoints({
                    ...basePayload,
                    points: Math.max(0, Number(exactPoints) || 0),
                    reason: reason.trim(),
                  })
                }
              >
                Salvar saldo
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="points" className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label htmlFor="points-amount">Quantidade</Label>
              <Input
                id="points-amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="points-reason">Motivo (obrigatório)</Label>
              <Textarea
                id="points-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                disabled={submitting || !canSubmit}
                onClick={() =>
                  void onAdjustPoints({
                    ...basePayload,
                    amount: Number(amount) || 0,
                    reason: reason.trim(),
                    action: "remove",
                  })
                }
              >
                Remover
              </Button>
              <Button
                disabled={submitting || !canSubmit}
                onClick={() =>
                  void onAdjustPoints({
                    ...basePayload,
                    amount: Number(amount) || 0,
                    reason: reason.trim(),
                    action: "add",
                  })
                }
              >
                Adicionar
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="coins" className="space-y-3 pt-2">
            <p className="text-body-sm text-muted-foreground">
              Coins pertencem ao usuário na plataforma — não ao canal. Nunca
              são geradas pelo sistema de pontos.
            </p>
            <div className="space-y-1">
              <Label htmlFor="coins-amount">Quantidade</Label>
              <Input
                id="coins-amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="coins-reason">Motivo (obrigatório)</Label>
              <Textarea
                id="coins-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                disabled={submitting || !canSubmit}
                onClick={() =>
                  void onAdjustCoins({
                    ...basePayload,
                    amount: Number(amount) || 0,
                    reason: reason.trim(),
                    action: "remove",
                  })
                }
              >
                Remover
              </Button>
              <Button
                disabled={submitting || !canSubmit}
                onClick={() =>
                  void onAdjustCoins({
                    ...basePayload,
                    amount: Number(amount) || 0,
                    reason: reason.trim(),
                    action: "add",
                  })
                }
              >
                Adicionar
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="reset" className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reset-points-check"
                checked={resetPoints}
                onChange={(e) => setResetPoints(e.target.checked)}
              />
              <Label htmlFor="reset-points-check">Zerar pontos</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reset-xp-check"
                checked={resetXp}
                onChange={(e) => setResetXp(e.target.checked)}
              />
              <Label htmlFor="reset-xp-check">Zerar XP e nível</Label>
            </div>
            <div className="space-y-1">
              <Label htmlFor="reset-reason-user">Motivo (obrigatório)</Label>
              <Textarea
                id="reset-reason-user"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                disabled={
                  submitting ||
                  !canSubmit ||
                  (!resetPoints && !resetXp)
                }
                onClick={() =>
                  void onResetUser({
                    ...basePayload,
                    resetPoints,
                    resetXp,
                    reason: reason.trim(),
                  })
                }
              >
                Confirmar reset
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
