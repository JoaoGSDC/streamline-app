"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  GripVertical,
  Layers,
  Palette,
  Plus,
  Sparkles,
  Link2,
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { LinkPageConfig, LinkPageTemplateId } from "@/types/link-page";
import type { StreamerSocialLink } from "@/lib/streamer-social";
import {
  ADDABLE_BLOCK_TYPES,
  createBlockOfType,
  createConfigFromTemplate,
  createDefaultLinkPageBlocks,
  getBlockLabel,
} from "@/lib/link-page-config";
import {
  getDefaultNobleLayout,
  sanitizeNobleLayout,
} from "@/lib/link-page-noble";
import { NobleLayoutEditor } from "@/components/admin/links/NobleLayoutEditor";
import {
  LINK_PAGE_TEMPLATES,
  getTemplateTheme,
} from "@/lib/link-page-templates";
import { LinkPageRenderer } from "@/components/link-page/LinkPageRenderer";
import { SocialLinkEditorCard } from "@/components/admin/links/SocialLinkEditorCard";
import { isValidHttpUrl } from "@/components/admin/links/social-platform";
import { ColorPickerField } from "@/components/admin/shared/ColorPickerField";
import type { LinkPageStreamer } from "@/components/link-page/LinkPageBlockView";

const emptyLink = (): StreamerSocialLink => ({ label: "", url: "" });

export interface LinkPageBuilderSaveHandlers {
  save: () => Promise<void>;
  saving: boolean;
}

interface LinkPageBuilderProps {
  streamerId: string;
  twitchUsername: string;
  streamer: LinkPageStreamer;
  initialLinks: StreamerSocialLink[];
  initialConfig: LinkPageConfig;
  onSaveReady?: (handlers: LinkPageBuilderSaveHandlers | null) => void;
}

export function LinkPageBuilder({
  streamerId,
  twitchUsername,
  streamer,
  initialLinks,
  initialConfig,
  onSaveReady,
}: LinkPageBuilderProps) {
  const { toast } = useToast();
  const [links, setLinks] = useState<StreamerSocialLink[]>(
    initialLinks.length > 0 ? initialLinks : [emptyLink()]
  );
  const [config, setConfig] = useState<LinkPageConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

  const previewLinks = useMemo(
    () =>
      links.filter((l) => l.url.trim() && isValidHttpUrl(l.url.trim())),
    [links]
  );

  const updateTheme = useCallback(
    (patch: Partial<LinkPageConfig["theme"]>) => {
      setConfig((prev) => ({
        ...prev,
        theme: { ...prev.theme, ...patch },
      }));
    },
    []
  );

  const isNoble = config.theme.templateId === "noble";
  const nobleLayout = sanitizeNobleLayout(
    config.nobleLayout ?? getDefaultNobleLayout()
  );

  const applyTemplate = (templateId: LinkPageTemplateId) => {
    setConfig((prev) => {
      const fresh = createConfigFromTemplate(templateId);
      const wasNoble = prev.theme.templateId === "noble";
      const isNowNoble = templateId === "noble";

      return {
        ...prev,
        theme: getTemplateTheme(templateId),
        blocks:
          isNowNoble && !wasNoble
            ? fresh.blocks
            : !isNowNoble && wasNoble
              ? createDefaultLinkPageBlocks()
              : prev.blocks,
        nobleLayout: isNowNoble
          ? wasNoble && prev.nobleLayout
            ? sanitizeNobleLayout(prev.nobleLayout)
            : fresh.nobleLayout
          : undefined,
      };
    });
  };

  const reorderBlocks = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setConfig((prev) => {
      const blocks = [...prev.blocks];
      const fromIdx = blocks.findIndex((b) => b.id === fromId);
      const toIdx = blocks.findIndex((b) => b.id === toId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const [moved] = blocks.splice(fromIdx, 1);
      blocks.splice(toIdx, 0, moved);
      return { ...prev, blocks };
    });
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/streamers/${streamerId}/social-links`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links, pageConfig: config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");

      if (data.links?.length) setLinks(data.links);
      if (data.pageConfig) setConfig(data.pageConfig);

      toast({
        title: "Página salva",
        description: "Sua vitrine de links foi atualizada.",
      });
    } catch (e) {
      toast({
        title: "Erro ao salvar",
        description:
          e instanceof Error ? e.message : "Não foi possível salvar.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [streamerId, links, config, toast]);

  useEffect(() => {
    onSaveReady?.({ save: handleSave, saving });
    return () => onSaveReady?.(null);
  }, [handleSave, saving, onSaveReady]);

  const editorPanel = (
    <Tabs defaultValue="templates" className="w-full max-w-none">
      <TabsList
        className={cn(
          "mb-4 grid w-full",
          isNoble ? "grid-cols-5" : "grid-cols-4"
        )}
      >
        <TabsTrigger value="templates" className="gap-1 text-xs sm:text-sm">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Templates</span>
        </TabsTrigger>
        {isNoble ? (
          <TabsTrigger value="noble" className="gap-1 text-xs sm:text-sm">
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Noble</span>
          </TabsTrigger>
        ) : null}
        <TabsTrigger value="style" className="gap-1 text-xs sm:text-sm">
          <Palette className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Visual</span>
        </TabsTrigger>
        <TabsTrigger value="blocks" className="gap-1 text-xs sm:text-sm">
          <Layers className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Blocos</span>
        </TabsTrigger>
        <TabsTrigger value="links" className="gap-1 text-xs sm:text-sm">
          <Link2 className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Links</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="templates" className="w-full space-y-3">
        <p className="text-body-sm text-muted-foreground">
          Escolha um estilo base gamer — personalize depois em Visual.
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
      </TabsContent>

      {isNoble ? (
        <TabsContent value="noble" className="w-full space-y-4">
          <NobleLayoutEditor
            layout={nobleLayout}
            onChange={(layout) =>
              setConfig((p) => ({ ...p, nobleLayout: layout }))
            }
          />
        </TabsContent>
      ) : null}

      <TabsContent value="style" className="w-full space-y-4">
        <div className="space-y-2">
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
        <div className="space-y-2">
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

        {config.blocks.some((b) => b.type === "header") ? (
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
          <Label>Intensidade do glow ({config.theme.glowIntensity}%)</Label>
          <Slider
            value={[config.theme.glowIntensity]}
            min={0}
            max={100}
            step={5}
            onValueChange={([v]) => updateTheme({ glowIntensity: v })}
          />
        </div>
        <div className="space-y-2">
          <Label>Blur glass ({config.theme.blurIntensity}%)</Label>
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
          <Input
            className="input-cinematic font-mono text-caption"
            placeholder="CSS gradient, cor ou URL da imagem"
            value={config.theme.backgroundValue}
            onChange={(e) => updateTheme({ backgroundValue: e.target.value })}
          />
        </div>
      </TabsContent>

      <TabsContent value="blocks" className="w-full space-y-3">
        <div className="flex flex-wrap gap-2">
          <Select
            onValueChange={(type) => {
              setConfig((p) => ({
                ...p,
                blocks: [...p.blocks, createBlockOfType(type as typeof ADDABLE_BLOCK_TYPES[number])],
              }));
            }}
          >
            <SelectTrigger className="h-9 w-[10rem] input-cinematic">
              <SelectValue placeholder="Adicionar bloco" />
            </SelectTrigger>
            <SelectContent>
              {ADDABLE_BLOCK_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {getBlockLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ul className="space-y-2">
          {config.blocks.map((block) => (
            <li
              key={block.id}
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
              <span className="flex-1 text-body-sm font-medium">
                {getBlockLabel(block.type)}
              </span>
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
            </li>
          ))}
        </ul>

        {config.blocks.some((b) => b.type === "bio" || b.type === "about") ? (
          <div className="space-y-3 rounded-lg border border-outline-variant/30 p-3">
            {config.blocks
              .filter((b) => b.type === "bio" || b.type === "about" || b.type === "cta" || b.type === "banner" || b.type === "donate")
              .map((block) => (
                <BlockPropsEditor
                  key={block.id}
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
              ))}
          </div>
        ) : null}
      </TabsContent>

      <TabsContent value="links" className="w-full space-y-4">
        <div className="grid gap-4">
          {links.map((link, index) => (
            <SocialLinkEditorCard
              key={index}
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
                  return next.length > 0 ? next : [emptyLink()];
                })
              }
            />
          ))}
        </div>
        <Button type="button" variant="outline" onClick={() => setLinks((p) => [...p, emptyLink()])}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar rede
        </Button>
      </TabsContent>
    </Tabs>
  );

  const previewPanel = (
    <div className="link-builder__preview-wrap w-full">
      <p className="mb-3 text-caption text-muted-foreground">
        Preview ao vivo — @{twitchUsername}/links
      </p>
      <div className="link-builder__preview-frame w-full">
        <LinkPageRenderer
          config={config}
          streamer={streamer}
          links={
            previewLinks.length > 0
              ? previewLinks
              : [{ label: "Twitch", url: streamer.twitchUrl || `https://twitch.tv/${twitchUsername}` }]
          }
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
