"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import type { CounterCategoryDto } from "@server/counters/counters.types";
import { COUNTER_TYPES } from "@server/counters/counters.types";

interface CounterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CounterCategoryDto[];
  saving?: boolean;
  onSubmit: (payload: {
    name: string;
    description?: string | null;
    type?: string;
    goalValue?: number | null;
    color?: string;
    emoji?: string | null;
    categoryId?: string | null;
  }) => Promise<void>;
}

export function CounterFormDialog({
  open,
  onOpenChange,
  categories,
  saving,
  onSubmit,
}: CounterFormDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("incremental");
  const [goalValue, setGoalValue] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [emoji, setEmoji] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setType("incremental");
      setGoalValue("");
      setColor("#6366f1");
      setEmoji("");
      setCategoryId("none");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      type,
      goalValue: goalValue ? Number(goalValue) : null,
      color,
      emoji: emoji.trim() || null,
      categoryId: categoryId === "none" ? null : categoryId,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo contador</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="counter-name">Nome</Label>
            <Input
              id="counter-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Mortes, Bosses, Capturas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="counter-description">Descrição</Label>
            <Textarea
              id="counter-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTER_TYPES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="counter-goal">Meta (opcional)</Label>
              <Input
                id="counter-goal"
                type="number"
                min={1}
                value={goalValue}
                onChange={(e) => setGoalValue(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="counter-color">Cor</Label>
              <Input
                id="counter-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="counter-emoji">Emoji</Label>
              <Input
                id="counter-emoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="☠️"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Sem categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem categoria</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={saving || !name.trim()}>
            Criar contador
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
