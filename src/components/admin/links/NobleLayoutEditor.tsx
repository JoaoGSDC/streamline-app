"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  LinkPageNobleLayout,
  NobleAccentTone,
  NobleFeaturedItem,
  NobleItemVariant,
  NobleSocialButtonShape,
  NobleTextAlign,
} from "@/types/link-page";
import { createEmptyNobleFeaturedItem } from "@/lib/link-page-noble";
import { ColorPickerField } from "@/components/admin/shared/ColorPickerField";

interface NobleLayoutEditorProps {
  layout: LinkPageNobleLayout;
  onChange: (layout: LinkPageNobleLayout) => void;
}

function updateItem(
  items: NobleFeaturedItem[],
  id: string,
  patch: Partial<NobleFeaturedItem>
): NobleFeaturedItem[] {
  return items.map((item) =>
    item.id === id ? { ...item, ...patch } : item
  );
}

export function NobleLayoutEditor({ layout, onChange }: NobleLayoutEditorProps) {
  const patchLayout = (p: Partial<LinkPageNobleLayout>) =>
    onChange({ ...layout, ...p });

  return (
    <div className="space-y-5">
      <p className="text-body-sm text-muted-foreground">
        Layout premium com hero, redes sociais e cards de destaque. Todas as
        imagens são URLs externas (sem upload).
      </p>

      <section className="space-y-3 rounded-lg border border-outline-variant/30 p-3">
        <h3 className="font-headline text-body-sm font-semibold">Hero</h3>
        <div className="space-y-2">
          <Label>Imagem do hero (URL)</Label>
          <Input
            className="input-cinematic font-mono text-caption"
            type="url"
            placeholder="https://..."
            value={layout.heroImageUrl}
            onChange={(e) => patchLayout({ heroImageUrl: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Símbolo / logo (texto ou emoji)</Label>
          <Input
            className="input-cinematic"
            value={layout.logoSymbol}
            onChange={(e) => patchLayout({ logoSymbol: e.target.value })}
            placeholder="✦"
          />
        </div>
        <div className="space-y-2">
          <Label>Texto abaixo do subtítulo</Label>
          <Input
            className="input-cinematic"
            value={layout.heroEyebrow}
            onChange={(e) => patchLayout({ heroEyebrow: e.target.value })}
            placeholder="Canal oficial na Twitch"
          />
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-outline-variant/30 p-3">
        <h3 className="font-headline text-body-sm font-semibold">
          Redes sociais (topo)
        </h3>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="noble-show-social">Exibir botões de redes</Label>
          <Switch
            id="noble-show-social"
            checked={layout.showSocialButtons}
            onCheckedChange={(checked) =>
              patchLayout({ showSocialButtons: checked })
            }
          />
        </div>
        {layout.showSocialButtons ? (
          <>
            <div className="space-y-2">
              <Label>Formato dos botões</Label>
              <Select
                value={layout.socialButtonShape}
                onValueChange={(v) =>
                  patchLayout({
                    socialButtonShape: v as NobleSocialButtonShape,
                  })
                }
              >
                <SelectTrigger className="input-cinematic">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circle">Círculo</SelectItem>
                  <SelectItem value="rounded">Arredondado</SelectItem>
                  <SelectItem value="square">Quadrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ColorPickerField
                label="Fundo dos botões"
                value={layout.socialButtonBgColor}
                onChange={(socialButtonBgColor) =>
                  patchLayout({ socialButtonBgColor })
                }
              />
              <ColorPickerField
                label="Borda dos botões"
                value={layout.socialButtonBorderColor}
                onChange={(socialButtonBorderColor) =>
                  patchLayout({ socialButtonBorderColor })
                }
              />
            </div>
            <p className="text-caption text-muted-foreground">
              Os links vêm da aba &quot;Links&quot; — adicione TikTok, Instagram,
              YouTube etc.
            </p>
          </>
        ) : null}
      </section>

      <section className="space-y-3 rounded-lg border border-outline-variant/30 p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-headline text-body-sm font-semibold">
            Botões de destaque
          </h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              patchLayout({
                featuredItems: [
                  ...layout.featuredItems,
                  createEmptyNobleFeaturedItem(),
                ],
              })
            }
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Adicionar
          </Button>
        </div>

        {layout.featuredItems.map((item) => (
          <FeaturedItemEditor
            key={item.id}
            item={item}
            onChange={(patchItem) =>
              patchLayout({
                featuredItems: updateItem(
                  layout.featuredItems,
                  item.id,
                  patchItem
                ),
              })
            }
            onRemove={() =>
              patchLayout({
                featuredItems: layout.featuredItems.filter(
                  (f) => f.id !== item.id
                ),
              })
            }
            canRemove={layout.featuredItems.length > 1}
          />
        ))}
      </section>

      <section className="space-y-3 rounded-lg border border-outline-variant/30 p-3">
        <h3 className="font-headline text-body-sm font-semibold">Cores Noble</h3>
        <ColorPickerField
          label="Cor secundária (dourado / destaque)"
          value={layout.secondaryColor}
          onChange={(secondaryColor) => patchLayout({ secondaryColor })}
          hint="Usada em títulos e bordas do template Noble."
        />
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="noble-footer">Rodapé</Label>
          <Switch
            id="noble-footer"
            checked={layout.showFooter}
            onCheckedChange={(checked) => patchLayout({ showFooter: checked })}
          />
        </div>
      </section>
    </div>
  );
}

function FeaturedItemEditor({
  item,
  onChange,
  onRemove,
  canRemove,
}: {
  item: NobleFeaturedItem;
  onChange: (patch: Partial<NobleFeaturedItem>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="space-y-2 rounded-md border border-outline-variant/25 bg-surface-container-low/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Switch
            checked={item.visible}
            onCheckedChange={(checked) => onChange({ visible: checked })}
            aria-label="Exibir destaque"
          />
          <span className="text-caption font-medium text-foreground">
            Destaque
          </span>
        </div>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select
            value={item.variant}
            onValueChange={(v) =>
              onChange({ variant: v as NobleItemVariant })
            }
          >
            <SelectTrigger className="input-cinematic h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Card com imagem</SelectItem>
              <SelectItem value="simple">Botão simples</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Cor de destaque</Label>
          <Select
            value={item.accent}
            onValueChange={(v) =>
              onChange({ accent: v as NobleAccentTone })
            }
          >
            <SelectTrigger className="input-cinematic h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blue">Azul</SelectItem>
              <SelectItem value="purple">Roxo</SelectItem>
              <SelectItem value="gold">Dourado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Alinhamento do texto</Label>
        <Select
          value={item.textAlign ?? "center"}
          onValueChange={(v) =>
            onChange({ textAlign: v as NobleTextAlign })
          }
        >
          <SelectTrigger className="input-cinematic h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Esquerda</SelectItem>
            <SelectItem value="center">Centro</SelectItem>
            <SelectItem value="right">Direita</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-caption text-muted-foreground">
          Título e subtítulo do botão principal.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Título</Label>
        <Input
          className="input-cinematic h-9"
          value={item.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Subtítulo</Label>
        <Input
          className="input-cinematic h-9"
          value={item.subtitle}
          onChange={(e) => onChange({ subtitle: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>URL</Label>
        <Input
          className="input-cinematic h-9"
          type="url"
          value={item.url}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="https://..."
        />
      </div>

      {item.variant === "featured" ? (
        <>
          <div className="space-y-1.5">
            <Label>Imagem (URL)</Label>
            <Input
              className="input-cinematic h-9 font-mono text-caption"
              type="url"
              value={item.imageUrl}
              onChange={(e) => onChange({ imageUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Badge (opcional)</Label>
              <Input
                className="input-cinematic h-9"
                value={item.badge ?? ""}
                onChange={(e) =>
                  onChange({ badge: e.target.value || undefined })
                }
                placeholder="AO VIVO"
              />
            </div>
            <div className="space-y-1.5">
              <Label>CTA interno (opcional)</Label>
              <Input
                className="input-cinematic h-9"
                value={item.cta ?? ""}
                onChange={(e) =>
                  onChange({ cta: e.target.value || undefined })
                }
                placeholder="FAÇA PARTE"
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

