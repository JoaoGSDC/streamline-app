"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  testRegexSafely,
  type RegexTestResult,
} from "@/lib/regex-utils";

interface RegexTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pattern: string | null;
  inputPlaceholder?: string;
  matchLabel?: string;
  noMatchLabel?: string;
}

export function RegexTestDialog({
  open,
  onOpenChange,
  pattern,
  inputPlaceholder = "Digite um texto para testar…",
  matchLabel = "✓ Correspondência encontrada",
  noMatchLabel = "✗ Sem correspondência",
}: RegexTestDialogProps) {
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState<RegexTestResult | null>(null);

  useEffect(() => {
    if (!open) {
      setTestInput("");
      setTestResult(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !pattern?.trim()) {
      setTestResult(null);
      return;
    }

    let cancelled = false;
    void testRegexSafely(pattern, testInput).then((result) => {
      if (!cancelled) setTestResult(result);
    });

    return () => {
      cancelled = true;
    };
  }, [open, pattern, testInput]);

  const resultLabel =
    testResult === "match"
      ? matchLabel
      : testResult === "timeout"
        ? "✗ Teste excedeu o tempo limite"
        : testResult === "invalid"
          ? "✗ Regex inválido ou inseguro"
          : noMatchLabel;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="break-all font-mono text-sm">
            {pattern || "(sem pattern)"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={testInput}
            onChange={(event) => setTestInput(event.target.value)}
            placeholder={inputPlaceholder}
            autoFocus
            className="font-mono text-sm"
          />
          {testResult ? (
            <div
              className={cn(
                "rounded-md border px-3 py-2 font-mono text-sm",
                testResult === "match"
                  ? "border-green-500/20 bg-green-500/10 text-green-400"
                  : "border-red-500/20 bg-red-500/10 text-red-400"
              )}
            >
              {resultLabel}
            </div>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
