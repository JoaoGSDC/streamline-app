"use client";

import { useLinkPageBuilder } from "@features/links/components/link-page-builder/link-page-builder.hook";
import {
  ChevronDown,
  Eye,
  GripVertical,
  Layers,
  Link2,
  Monitor,
  Plus,
  Palette,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { LinkPageConfig } from "@/types/link-page";
import {
  ADDABLE_BLOCK_TYPES,
  getBlockLabel,
} from "@/lib/link-page-config";
import { NobleLayoutEditor } from "@/components/admin/links/NobleLayoutEditor";
import {
  BACKGROUND_VALUE_HINTS,
  BACKGROUND_VALUE_LABELS,
  blockHasPropsEditor,
} from "@/lib/link-builder-utils";
import { LinkPageRenderer } from "@/components/link-page/LinkPageRenderer";
import { SocialLinkEditorCard } from "@/components/admin/links/SocialLinkEditorCard";
import { ColorPickerField } from "@/components/admin/shared/ColorPickerField";
import type { LinkPageStreamer } from "@/components/link-page/LinkPageBlockView";
import {
  LINK_PAGE_TEMPLATES,
} from "@/lib/link-page-templates";
import type {
  LinkPageBuilderProps,
  LinkPageBuilderSaveHandlers,
} from "@features/links/types/links.types";

export type { LinkPageBuilderSaveHandlers };

export function LinkPageBuilder({
  streamerId,
  twitchUsername,
  streamer,
  initialLinks,
  initialConfig,
  onSaveReady,
}: LinkPageBuilderProps) {
  const {
    links,
    setLinks,
    config,
    setConfig,
    dragId,
    setDragId,
    dropTargetId,
    setDropTargetId,
    mobileView,
    setMobileView,
    previewDevice,
    setPreviewDevice,
    editorTab,
    setEditorTab,
    expandedBlockId,
    setExpandedBlockId,
    addBlockKey,
    previewLinks,
    isNoble,
    updateTheme,
    applyTemplate,
    reorderBlocks,
    addBlock,
    emptySocialLink,
    getDefaultNobleLayout,
  } = useLinkPageBuilder({
    streamerId,
    twitchUsername,
    streamer,
    initialLinks,
    initialConfig,
    onSaveReady,
  });

  const editorPanel = (
    <Tabs
      value={editorTab}
      onValueChange={setEditorTab}
      className="w-full max-w-none"
    >
      <TabsList className="mb-4 grid w-full grid-cols-3">
        <TabsTrigger value="appearance" className="gap-1 text-xs sm:text-sm">
          <Palette className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Aparência</span>
        </TabsTrigger>
        <TabsTrigger value="content" className="gap-1 text-xs sm:text-sm">
          <Layers className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Conteúdo</span>
        </TabsTrigger>
        <TabsTrigger value="links" className="gap-1 text-xs sm:text-sm">
          <Link2 className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Links</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="appearance" className="w-full space-y-0">
        <EditorSection title="Template">
          <p className="mb-3 text-body-sm text-muted-foreground">
            Escolha um estilo base — personalize cores e fundo abaixo.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {LINK_PAGE_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={cn(
                  "link-template-card",
                  config.theme.templateId === t.id && "link-template-card--active"
                )}
                onClick={() => applyTemplate(t.id)}
              >
                <div className={cn("link-template-preview", t.previewClass)} />
                <p className="font-headline text-caption font-semibold text-foreground">
                  {t.name}
                </p>
                <p className="mt-0.5 text-caption text-muted-foreground line-clamp-2">
                  {t.description}
                </p>
              </button>
            ))}
          </div>
        </EditorSection>

        <EditorSection title="Customização visual">
        <div className="space-y-4">
        <PageMetaFields config={config} setConfig={setConfig} streamer={streamer} />

        <ColorPickerField
          label="Cor primária"
          value={config.theme.primaryColor}
          onChange={(primaryColor) => updateTheme({ primaryColor })}
        />
        <ColorPickerField
          label="Cor de destaque"
          value={config.theme.accentColor}
          onChange={(accentColor) => updateTheme({ accentColor })}
        />

        {!isNoble && config.blocks.some((b) => b.type === "header") ? (
          <div className="space-y-2 rounded-lg border border-outline-variant/30 p-3">
            <Label>Avatar do perfil</Label>
            <Select
              value={String(
                config.blocks.find((b) => b.type === "header")?.props
                  .avatarAlign ?? "center"
              )}
              onValueChange={(v) =>
                setConfig((p) => ({
                  ...p,
                  blocks: p.blocks.map((b) =>
                    b.type === "header"
                      ? { ...b, props: { ...b.props, avatarAlign: v } }
                      : b
                  ),
                }))
              }
            >
              <SelectTrigger className="input-cinematic">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Esquerda</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="right">Direita</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-caption text-muted-foreground">
              Alinhamento da foto de perfil no bloco cabeçalho.
            </p>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Intensidade do brilho ({config.theme.glowIntensity}%)</Label>
          <Slider
            value={[config.theme.glowIntensity]}
            min={0}
            max={100}
            step={5}
            onValueChange={([v]) => updateTheme({ glowIntensity: v })}
          />
        </div>
        <div className="space-y-2">
          <Label>Blur dos cards ({config.theme.blurIntensity}px)</Label>
          <Slider
            value={[config.theme.blurIntensity]}
            min={0}
            max={100}
            step={5}
            onValueChange={([v]) => updateTheme({ blurIntensity: v })}
          />
        </div>
        <div className="space-y-2">
          <Label>Raio dos cards ({config.theme.cardRadius}px)</Label>
          <Slider
            value={[config.theme.cardRadius]}
            min={0}
            max={28}
            step={2}
            onValueChange={([v]) => updateTheme({ cardRadius: v })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Estilo do card</Label>
            <Select
              value={config.theme.cardStyle}
              onValueChange={(v) =>
                updateTheme({
                  cardStyle: v as LinkPageConfig["theme"]["cardStyle"],
                })
              }
            >
              <SelectTrigger className="input-cinematic">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="glass">Glass</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
                <SelectItem value="solid">Solid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Espaçamento</Label>
            <Select
              value={config.theme.spacing}
              onValueChange={(v) =>
                updateTheme({
                  spacing: v as LinkPageConfig["theme"]["spacing"],
                })
              }
            >
              <SelectTrigger className="input-cinematic">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compacto</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="relaxed">Amplo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Alinhamento</Label>
          <Select
            value={config.theme.alignment}
            onValueChange={(v) =>
              updateTheme({
                alignment: v as LinkPageConfig["theme"]["alignment"],
              })
            }
          >
            <SelectTrigger className="input-cinematic">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Esquerda</SelectItem>
              <SelectItem value="center">Centro</SelectItem>
              <SelectItem value="right">Direita</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Fundo</Label>
          <Select
            value={config.theme.backgroundType}
            onValueChange={(v) =>
              updateTheme({
                backgroundType: v as LinkPageConfig["theme"]["backgroundType"],
              })
            }
          >
            <SelectTrigger className="input-cinematic">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gradient">Gradiente</SelectItem>
              <SelectItem value="solid">Cor sólida</SelectItem>
              <SelectItem value="image">Imagem (URL)</SelectItem>
              <SelectItem value="particles">Partículas</SelectItem>
            </SelectContent>
          </Select>
          <Label className="text-caption text-muted-foreground">
            {BACKGROUND_VALUE_LABELS[config.theme.backgroundType]}
          </Label>
          <Input
            className="input-cinematic font-mono text-caption"
            placeholder={BACKGROUND_VALUE_HINTS[config.theme.backgroundType]}
            value={config.theme.backgroundValue}
            onChange={(e) => updateTheme({ backgroundValue: e.target.value })}
          />
        </div>
        </div>
        </EditorSection>

        {isNoble ? (
          <EditorSection title="Configurações Noble">
            <NobleLayoutEditor
              layout={config.nobleLayout ?? getDefaultNobleLayout()}
              onChange={(layout) =>
                setConfig((p) => ({ ...p, nobleLayout: layout }))
              }
            />
          </EditorSection>
        ) : null}
      </TabsContent>

      <TabsContent value="content" className="w-full space-y-3">
        {isNoble ? (
          <p className="rounded-lg border border-outline-variant/30 bg-surface-container-low/30 px-3 py-2 text-caption text-muted-foreground">
            No template Noble, links e redes vêm da aba{" "}
            <strong className="text-foreground">Links</strong>. Os blocos abaixo
            são extras (bio, embeds, agenda).
          </p>
        ) : null}

        <Select key={addBlockKey} onValueChange={(type) => addBlock(type)}>
          <SelectTrigger className="h-9 w-full max-w-[12rem] gap-2 border-dashed sm:w-auto">
            <Plus className="h-4 w-4 shrink-0" />
            <span>Adicionar bloco</span>
          </SelectTrigger>
          <SelectContent>
            {ADDABLE_BLOCK_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {getBlockLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ul className="space-y-2">
          {config.blocks.map((block) => (
            <li
              key={block.id}
              className={cn(
                "link-builder-block-card",
                !block.visible && "link-builder-block-card--hidden"
              )}
            >
              <div
                draggable
                onDragStart={() => setDragId(block.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setDropTargetId(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropTargetId(block.id);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragId) reorderBlocks(dragId, block.id);
                  setDropTargetId(null);
                }}
                className={cn(
                  "link-builder-block",
                  dragId === block.id && "link-builder-block--dragging",
                  dropTargetId === block.id &&
                    dragId !== block.id &&
                    "link-builder-block--drop-target"
                )}
              >
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-body-sm font-medium"
                  onClick={() =>
                    setExpandedBlockId((current) =>
                      current === block.id ? null : block.id
                    )
                  }
                >
                  <span className="truncate">{getBlockLabel(block.type)}</span>
                  {blockHasPropsEditor(block.type) ? (
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        expandedBlockId === block.id && "rotate-180"
                      )}
                      aria-hidden
                    />
                  ) : null}
                </button>
                <Switch
                  checked={block.visible}
                  onCheckedChange={(checked) =>
                    setConfig((p) => ({
                      ...p,
                      blocks: p.blocks.map((b) =>
                        b.id === block.id ? { ...b, visible: checked } : b
                      ),
                    }))
                  }
                  aria-label={`Exibir ${getBlockLabel(block.type)}`}
                />
                {config.blocks.length > 1 && block.type !== "header" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-destructive"
                    onClick={() =>
                      setConfig((p) => ({
                        ...p,
                        blocks: p.blocks.filter((b) => b.id !== block.id),
                      }))
                    }
                  >
                    ×
                  </Button>
                ) : null}
              </div>
              {blockHasPropsEditor(block.type) &&
              expandedBlockId === block.id ? (
                <div className="link-builder-block-props">
                  <BlockPropsEditor
                    block={block}
                    streamer={streamer}
                    onChange={(props) =>
                      setConfig((p) => ({
                        ...p,
                        blocks: p.blocks.map((b) =>
                          b.id === block.id ? { ...b, props } : b
                        ),
                      }))
                    }
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </TabsContent>

      <TabsContent value="links" className="w-full space-y-4">
        <p className="text-body-sm text-muted-foreground">
          {isNoble
            ? "Estes links alimentam os botões redondos no topo e podem ser reutilizados em outros templates."
            : "Redes e links exibidos nos blocos «Links principais» e «Redes sociais»."}
        </p>
        <div className="grid gap-4">
          {links.map((link, index) => (
            <SocialLinkEditorCard
              key={link.id ?? `link-${index}`}
              link={link}
              index={index}
              onChange={(i, patch) =>
                setLinks((prev) =>
                  prev.map((item, j) =>
                    j === i ? { ...item, ...patch } : item
                  )
                )
              }
              onRemove={(i) =>
                setLinks((prev) => {
                  const next = prev.filter((_, j) => j !== i);
                  return next.length > 0 ? next : [emptySocialLink()];
                })
              }
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setLinks((p) => [...p, emptySocialLink()])}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar rede
        </Button>
      </TabsContent>
    </Tabs>
  );

  const previewPanel = (
    <div className="link-builder__preview-wrap w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-caption text-muted-foreground">
          Preview ao vivo — @{twitchUsername}/links
        </p>
        <div className="inline-flex rounded-lg border border-outline-variant/30 p-0.5">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-caption transition-colors",
              previewDevice === "mobile"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setPreviewDevice("mobile")}
          >
            <Smartphone className="h-3.5 w-3.5" aria-hidden />
            Mobile
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-caption transition-colors",
              previewDevice === "desktop"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setPreviewDevice("desktop")}
          >
            <Monitor className="h-3.5 w-3.5" aria-hidden />
            Desktop
          </button>
        </div>
      </div>
      <div
        className={cn(
          "link-builder__preview-frame w-full",
          previewDevice === "mobile"
            ? "link-builder__preview-frame--mobile"
            : "link-builder__preview-frame--desktop"
        )}
      >
        <LinkPageRenderer
          config={config}
          streamer={streamer}
          links={previewLinks}
          preview
          className="min-h-full"
        />
      </div>
    </div>
  );

  return (
    <div className="link-builder w-full">
      <div className="mb-2 w-full lg:hidden">
        <Tabs
          value={mobileView}
          onValueChange={(v) => setMobileView(v as "edit" | "preview")}
          className="w-full"
        >
          <TabsList className="w-full">
            <TabsTrigger value="edit" className="flex-1">
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">
              <Eye className="mr-1 h-3.5 w-3.5" />
              Preview
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div
        className={cn(
          "link-builder__editor w-full",
          mobileView === "preview" && "hidden lg:block"
        )}
      >
        {editorPanel}
      </div>

      <div
        className={cn(
          "w-full flex-1",
          mobileView === "edit" && "hidden lg:block"
        )}
      >
        {previewPanel}
      </div>
    </div>
  );
}

function EditorSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="link-builder-editor-section space-y-3">
      <h3 className="link-builder-editor-section-title">{title}</h3>
      {children}
    </section>
  );
}

function PageMetaFields({
  config,
  setConfig,
  streamer,
}: {
  config: LinkPageConfig;
  setConfig: React.Dispatch<React.SetStateAction<LinkPageConfig>>;
  streamer: LinkPageStreamer;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label>Título da página</Label>
        <Input
          className="input-cinematic"
          placeholder={streamer.name}
          value={config.pageTitle ?? ""}
          onChange={(e) =>
            setConfig((p) => ({ ...p, pageTitle: e.target.value }))
          }
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Subtítulo</Label>
        <Input
          className="input-cinematic"
          placeholder="Links e redes sociais"
          value={config.pageSubtitle ?? ""}
          onChange={(e) =>
            setConfig((p) => ({ ...p, pageSubtitle: e.target.value }))
          }
        />
      </div>
    </div>
  );
}

function BlockPropsEditor({
  block,
  streamer,
  onChange,
}: {
  block: LinkPageConfig["blocks"][number];
  streamer: LinkPageStreamer;
  onChange: (props: LinkPageConfig["blocks"][number]["props"]) => void;
}) {
  const props = block.props;

  if (block.type === "bio" || block.type === "about") {
    return (
      <div className="space-y-1.5">
        <Label>{getBlockLabel(block.type)}</Label>
        <Input
          className="input-cinematic"
          value={String(props.text ?? "")}
          onChange={(e) => onChange({ ...props, text: e.target.value })}
          placeholder={block.type === "about" ? streamer.bio ?? "" : "Sua tagline..."}
        />
      </div>
    );
  }

  if (block.type === "cta" || block.type === "donate") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Texto do botão</Label>
          <Input
            className="input-cinematic"
            value={String(props.label ?? "")}
            onChange={(e) => onChange({ ...props, label: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>URL</Label>
          <Input
            className="input-cinematic"
            type="url"
            value={String(props.url ?? "")}
            onChange={(e) => onChange({ ...props, url: e.target.value })}
            placeholder={streamer.twitchUrl ?? ""}
          />
        </div>
      </div>
    );
  }

  if (block.type === "banner") {
    return (
      <div className="space-y-1.5">
        <Label>URL do banner</Label>
        <Input
          className="input-cinematic"
          type="url"
          value={String(props.imageUrl ?? "")}
          onChange={(e) => onChange({ ...props, imageUrl: e.target.value })}
        />
      </div>
    );
  }

  if (block.type === "embed-twitch") {
    return (
      <div className="space-y-1.5">
        <Label>Canal Twitch</Label>
        <Input
          className="input-cinematic"
          value={String(props.channel ?? streamer.twitchUsername)}
          onChange={(e) => onChange({ ...props, channel: e.target.value })}
        />
      </div>
    );
  }

  if (block.type === "embed-youtube") {
    return (
      <div className="space-y-1.5">
        <Label>ID do vídeo YouTube</Label>
        <Input
          className="input-cinematic"
          value={String(props.videoId ?? "")}
          onChange={(e) => onChange({ ...props, videoId: e.target.value })}
          placeholder="dQw4w9WgXcQ"
        />
      </div>
    );
  }

  return null;
}
