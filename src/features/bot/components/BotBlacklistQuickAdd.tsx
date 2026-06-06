"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  BotBlacklistAction,
  BotBlacklistMatchType,
  CreateBotBlacklistPayload,
} from "@services/entities/bot-blacklist.services";

interface BotBlacklistQuickAddProps {
  submitting?: boolean;
  onSubmit: (payload: CreateBotBlacklistPayload) => Promise<boolean>;
}

export function BotBlacklistQuickAdd({
  submitting = false,
  onSubmit,
}: BotBlacklistQuickAddProps) {
  const [term, setTerm] = useState("");
  const [matchType, setMatchType] = useState<BotBlacklistMatchType>("contains");
  const [action, setAction] = useState<BotBlacklistAction>("delete");
  const [timeoutSeconds, setTimeoutSeconds] = useState(60);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = term.trim();
    if (!trimmed) return;

    const ok = await onSubmit({
      term: trimmed,
      matchType,
      action,
      timeoutSeconds: action === "timeout" ? timeoutSeconds : undefined,
      enabled: true,
    });

    if (ok) {
      setTerm("");
      setMatchType("contains");
      setAction("delete");
      setTimeoutSeconds(60);
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-col gap-2 rounded-lg border border-outline-variant/25 bg-surface-container-low/40 p-3 sm:flex-row sm:items-center"
    >
      <Input
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Adicionar termo…"
        disabled={submitting}
        className="min-w-0 flex-1"
        maxLength={100}
      />

      <Select
        value={matchType}
        onValueChange={(value: BotBlacklistMatchType) => setMatchType(value)}
        disabled={submitting}
      >
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="exact">Exato</SelectItem>
          <SelectItem value="contains">Contém</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex w-full items-center gap-2 sm:w-auto">
        <Select
          value={action}
          onValueChange={(value: BotBlacklistAction) => setAction(value)}
          disabled={submitting}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="delete">Apagar msg</SelectItem>
            <SelectItem value="timeout">Timeout</SelectItem>
          </SelectContent>
        </Select>
        {action === "timeout" && (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={1}
              value={timeoutSeconds}
              onChange={(event) =>
                setTimeoutSeconds(parseInt(event.target.value, 10) || 60)
              }
              disabled={submitting}
              className="w-20"
              aria-label="Segundos de timeout"
            />
            <span className="text-caption text-muted-foreground">s</span>
          </div>
        )}
      </div>

      <Button type="submit" disabled={submitting || !term.trim()} className="shrink-0 sm:ml-auto">
        <Plus className="mr-2 h-4 w-4" />
        Adicionar
      </Button>
    </form>
  );
}
