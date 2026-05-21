"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { services } from "@services";
import type { LinkPageConfig, LinkPageTemplateId } from "@/types/link-page";
import type { StreamerSocialLink } from "@lib/streamer-social";
import {
  createBlockOfType,
  createConfigFromTemplate,
  createDefaultLinkPageBlocks,
} from "@lib/link-page-config";
import { getDefaultNobleLayout } from "@lib/link-page-noble";
import { applyTemplateTheme } from "@lib/link-page-templates";
import { emptySocialLink, ensureSocialLinkIds } from "@lib/link-builder-utils";
import { isValidHttpUrl } from "@/components/admin/links/social-platform";
import type { LinkPageBuilderProps } from "@features/links/types/links.types";

export function useLinkPageBuilder({
  streamerId,
  twitchUsername,
  streamer,
  initialLinks,
  initialConfig,
  onSaveReady,
}: LinkPageBuilderProps) {
  const { toast } = useToast();

  const [links, setLinks] = useState<StreamerSocialLink[]>(() =>
    ensureSocialLinkIds(
      initialLinks.length > 0 ? initialLinks : [emptySocialLink()]
    )
  );
  const [config, setConfig] = useState<LinkPageConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [editorTab, setEditorTab] = useState("templates");
  const [addBlockKey, setAddBlockKey] = useState(0);

  const previewLinks = useMemo(() => {
    const linksWithUrl = links.filter((link) => link.url.trim());
    const validLinks = linksWithUrl.filter((link) =>
      isValidHttpUrl(link.url.trim())
    );
    if (validLinks.length > 0) return validLinks;
    if (linksWithUrl.length > 0) return linksWithUrl;

    return [
      {
        id: "preview-twitch",
        label: "Twitch",
        url: streamer.twitchUrl || `https://twitch.tv/${twitchUsername}`,
      },
    ];
  }, [links, streamer.twitchUrl, twitchUsername]);

  const isNoble = config.theme.templateId === "noble";

  const updateTheme = useCallback(
    (themePatch: Partial<LinkPageConfig["theme"]>) => {
      setConfig((previous) => {
        const theme = { ...previous.theme, ...themePatch };
        const alignment = themePatch.alignment;
        const blocks =
          alignment && previous.blocks.some((block) => block.type === "header")
            ? previous.blocks.map((block) =>
                block.type === "header"
                  ? { ...block, props: { ...block.props, avatarAlign: alignment } }
                  : block
              )
            : previous.blocks;
        return { ...previous, theme, blocks };
      });
    },
    []
  );

  const applyTemplate = useCallback((templateId: LinkPageTemplateId) => {
    setConfig((previous) => {
      const freshConfig = createConfigFromTemplate(templateId);
      const wasNoble = previous.theme.templateId === "noble";
      const isNowNoble = templateId === "noble";

      return {
        ...previous,
        pageTitle: previous.pageTitle,
        pageSubtitle: previous.pageSubtitle,
        theme: applyTemplateTheme(previous.theme, templateId),
        blocks:
          isNowNoble && !wasNoble
            ? freshConfig.blocks
            : !isNowNoble && wasNoble
              ? createDefaultLinkPageBlocks()
              : previous.blocks,
        nobleLayout: isNowNoble
          ? wasNoble && previous.nobleLayout
            ? previous.nobleLayout
            : freshConfig.nobleLayout
          : undefined,
      };
    });

    if (templateId === "noble") {
      setEditorTab("noble");
    }
  }, []);

  const reorderBlocks = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;

    setConfig((previous) => {
      const blocks = [...previous.blocks];
      const fromIndex = blocks.findIndex((block) => block.id === fromId);
      const toIndex = blocks.findIndex((block) => block.id === toId);
      if (fromIndex < 0 || toIndex < 0) return previous;

      const [movedBlock] = blocks.splice(fromIndex, 1);
      blocks.splice(toIndex, 0, movedBlock);
      return { ...previous, blocks };
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const response = await services.socialLinks.admin.update(streamerId, {
        links,
        pageConfig: config,
      });

      if (response.links?.length) {
        setLinks(ensureSocialLinkIds(response.links));
      }
      if (response.pageConfig) {
        setConfig(response.pageConfig);
      }

      toast({
        title: "Página salva",
        description: "Sua vitrine de links foi atualizada.",
      });
    } catch (saveError) {
      toast({
        title: "Erro ao salvar",
        description:
          saveError instanceof Error
            ? saveError.message
            : "Não foi possível salvar.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [streamerId, links, config, toast]);

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  const onSaveReadyRef = useRef(onSaveReady);
  onSaveReadyRef.current = onSaveReady;

  useEffect(() => {
    onSaveReadyRef.current?.({
      save: () => handleSaveRef.current(),
      saving,
    });
  }, [saving]);

  useEffect(() => {
    return () => onSaveReadyRef.current?.(null);
  }, []);

  const addBlock = useCallback((blockType: string) => {
    setConfig((previous) => ({
      ...previous,
      blocks: [
        ...previous.blocks,
        createBlockOfType(blockType as Parameters<typeof createBlockOfType>[0]),
      ],
    }));
    setAddBlockKey((previous) => previous + 1);
  }, []);

  return {
    links,
    setLinks,
    config,
    setConfig,
    saving,
    dragId,
    setDragId,
    dropTargetId,
    setDropTargetId,
    mobileView,
    setMobileView,
    editorTab,
    setEditorTab,
    addBlockKey,
    previewLinks,
    isNoble,
    updateTheme,
    applyTemplate,
    reorderBlocks,
    handleSave,
    addBlock,
    emptySocialLink,
    getDefaultNobleLayout,
  };
}
