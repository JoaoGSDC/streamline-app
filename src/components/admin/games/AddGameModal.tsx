"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGameSearch } from "@features/search/components/game-search/game-search.hook";
import type { GameSearchResult } from "@features/search/types/search.types";
import { STATUS_OPTIONS, type KanbanStatus } from "./kanban-config";
import { toDateInputValue } from "@/lib/streamer-game-status";

export interface AddGameMeta {
  startedAt?: string;
  notes?: string;
}

interface AddGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStatus?: KanbanStatus;
  submitting?: boolean;
  onAddFromIgdb: (
    game: GameSearchResult,
    status: KanbanStatus,
    meta?: AddGameMeta
  ) => Promise<void>;
  onAddCustom: (
    title: string,
    image: string | undefined,
    status: KanbanStatus,
    meta?: AddGameMeta
  ) => Promise<void>;
}

export function AddGameModal({
  open,
  onOpenChange,
  initialStatus = "to_play",
  submitting = false,
  onAddFromIgdb,
  onAddCustom,
}: AddGameModalProps) {
  const [tab, setTab] = useState<"igdb" | "manual">("igdb");
  const [status, setStatus] = useState<KanbanStatus>(initialStatus);
  const [plannedStart, setPlannedStart] = useState(() =>
    toDateInputValue(new Date())
  );
  const [notes, setNotes] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualImage, setManualImage] = useState("");
  const [selectedIgdb, setSelectedIgdb] = useState<GameSearchResult | null>(null);

  const {
    query,
    results,
    isSearching,
    inputRef,
    showDropdown,
    showEmpty,
    clearSearch,
    handleQueryChange,
    handleInputFocus,
    getCoverUrl,
  } = useGameSearch({
    onGameSelect: (game) => setSelectedIgdb(game),
  });

  useEffect(() => {
    if (open) {
      setStatus(initialStatus);
      setTab("igdb");
      setSelectedIgdb(null);
      setManualTitle("");
      setManualImage("");
      setNotes("");
      setPlannedStart(toDateInputValue(new Date()));
      clearSearch();
    }
  }, [open, initialStatus]);

  const resetAndClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    const meta: AddGameMeta = {
      startedAt:
        status === "to_play" || status === "playing" ? plannedStart : undefined,
      notes: notes.trim() || undefined,
    };

    if (tab === "igdb") {
      if (!selectedIgdb) return;
      await onAddFromIgdb(selectedIgdb, status, meta);
      resetAndClose();
      return;
    }

    if (!manualTitle.trim()) return;
    await onAddCustom(
      manualTitle.trim(),
      manualImage.trim() || undefined,
      status,
      meta
    );
    resetAndClose();
  };

  const canSubmit =
    tab === "igdb" ? Boolean(selectedIgdb) : Boolean(manualTitle.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-section-title">Adicionar jogo</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "igdb" | "manual")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="igdb">Buscar no IGDB</TabsTrigger>
            <TabsTrigger value="manual">Cadastro manual</TabsTrigger>
          </TabsList>

          <TabsContent value="igdb" className="mt-4 space-y-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                ref={inputRef}
                placeholder="Buscar jogos no IGDB…"
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                onFocus={handleInputFocus}
                className="pl-10 pr-10"
                autoComplete="off"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            {(showDropdown || selectedIgdb) && (
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-outline-variant/25 p-1">
                {selectedIgdb && !results.some((g) => g.id === selectedIgdb.id) && (
                  <li>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md bg-primary/10 p-2 text-left"
                    >
                      <img
                        src={getCoverUrl(selectedIgdb)}
                        alt=""
                        className="h-14 w-10 shrink-0 rounded object-cover"
                      />
                      <span className="min-w-0 flex-1 truncate text-label font-medium">
                        {selectedIgdb.name}
                      </span>
                    </button>
                  </li>
                )}
                {results.map((game) => {
                  const selected = selectedIgdb?.id === game.id;
                  return (
                    <li key={game.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedIgdb(game)}
                        className={`flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted/50 ${
                          selected ? "bg-primary/10" : ""
                        }`}
                      >
                        <img
                          src={getCoverUrl(game)}
                          alt=""
                          className="h-14 w-10 shrink-0 rounded object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-label font-medium">{game.name}</p>
                          {game.platforms?.length ? (
                            <p className="truncate text-caption">
                              {game.platforms.slice(0, 2).join(", ")}
                            </p>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {showEmpty && (
              <p className="text-caption text-muted-foreground">
                Nenhum jogo encontrado.
              </p>
            )}
          </TabsContent>

          <TabsContent value="manual" className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="manual-title">Título</Label>
              <Input
                id="manual-title"
                value={manualTitle}
                onChange={(event) => setManualTitle(event.target.value)}
                placeholder="Nome do jogo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-image">URL da imagem</Label>
              <Input
                id="manual-image"
                value={manualImage}
                onChange={(event) => setManualImage(event.target.value)}
                placeholder="https://…"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-3 border-t border-outline-variant/20 pt-4">
          <div className="space-y-2">
            <Label>Adicionar na coluna</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as KanbanStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(status === "to_play" || status === "playing") && (
            <div className="space-y-2">
              <Label htmlFor="planned-start">Previsão para começar</Label>
              <Input
                id="planned-start"
                type="date"
                value={plannedStart}
                onChange={(event) => setPlannedStart(event.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="game-notes">Observações (opcional)</Label>
            <Textarea
              id="game-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Notas sobre o jogo…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={submitting || !canSubmit}
            onClick={() => void handleSubmit()}
          >
            {submitting ? "Adicionando…" : "Adicionar jogo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
