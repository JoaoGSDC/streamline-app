"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QuoteCategoryDto, QuoteDto } from "@server/quotes/quotes.types";

interface QuoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: QuoteCategoryDto[];
  quote?: QuoteDto | null;
  saving?: boolean;
  onSubmit: (payload: {
    text: string;
    speakerName: string;
    categoryId?: string | null;
    tagSlugs?: string[];
  }) => Promise<void>;
}

export function QuoteFormDialog({
  open,
  onOpenChange,
  categories,
  quote,
  saving,
  onSubmit,
}: QuoteFormDialogProps) {
  const [text, setText] = useState("");
  const [speakerName, setSpeakerName] = useState("Streamer");
  const [categoryId, setCategoryId] = useState<string>("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!open) return;
    setText(quote?.text ?? "");
    setSpeakerName(quote?.speakerName ?? "Streamer");
    setCategoryId(quote?.categoryId ?? "");
    setTags(quote?.tags.map((tag) => tag.slug).join(", ") ?? "");
  }, [open, quote]);

  const handleSubmit = async () => {
    if (!text.trim() || !speakerName.trim()) return;
    await onSubmit({
      text: text.trim(),
      speakerName: speakerName.trim(),
      categoryId: categoryId || null,
      tagSlugs: tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{quote ? `Editar quote #${quote.number}` : "Nova quote"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quote-text">Texto</Label>
            <Textarea
              id="quote-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={4}
              placeholder="O que foi dito..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote-speaker">Quem falou</Label>
            <Input
              id="quote-speaker"
              value={speakerName}
              onChange={(event) => setSpeakerName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote-category">Categoria</Label>
            <select
              id="quote-category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Sem categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote-tags">Tags (separadas por vírgula)</Label>
            <Input
              id="quote-tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="rage, eldenring, boss"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={saving || !text.trim()}>
            {saving ? "Salvando..." : quote ? "Salvar" : "Criar quote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
