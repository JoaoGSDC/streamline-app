"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AdminViewFilter } from "@/hooks/useAdminChannelOptions";
import type { AdminChannel } from "@/components/admin/AdminProvider";
import type { LinkPageConfig } from "@/types/link-page";
import type { StreamerSocialLink } from "@lib/streamer-social";
import { getDefaultLinkPageConfig } from "@lib/link-page-config";
import { emptySocialLink, ensureSocialLinkIds } from "@lib/link-builder-utils";
import { services } from "@services";
import type { LinkPageBuilderSaveHandlers } from "@features/links/types/links.types";

interface UseAdminLinksPageParams {
  viewFilter: AdminViewFilter;
  formTarget: string;
  resolveFormStreamerId: (formTarget: string) => string;
  ownerChannel: AdminChannel | null;
  channels: AdminChannel[];
  onLoadError: () => void;
}

export function useAdminLinksPage({
  viewFilter,
  formTarget,
  resolveFormStreamerId,
  ownerChannel,
  channels,
  onLoadError,
}: UseAdminLinksPageParams) {
  const [links, setLinks] = useState<StreamerSocialLink[]>([]);
  const [pageConfig, setPageConfig] = useState<LinkPageConfig>(
    getDefaultLinkPageConfig()
  );
  const [loading, setLoading] = useState(true);
  const [loadedForId, setLoadedForId] = useState<string | null>(null);
  const [saveHandlers, setSaveHandlers] =
    useState<LinkPageBuilderSaveHandlers | null>(null);

  const editStreamerId = resolveFormStreamerId(formTarget);
  const activeChannel =
    channels.find((channel) => channel.id === editStreamerId) ?? ownerChannel;

  const targetStreamerId = useMemo(() => {
    if (viewFilter !== "all" && viewFilter !== "mine") {
      return viewFilter;
    }
    return resolveFormStreamerId(formTarget);
  }, [viewFilter, formTarget, resolveFormStreamerId]);

  const onLoadErrorRef = useRef(onLoadError);
  onLoadErrorRef.current = onLoadError;
  const fetchedStreamerIdRef = useRef<string | null>(null);

  const loadLinksPage = useCallback(async (streamerId: string) => {
    setLoading(true);
    try {
      const response = await services.socialLinks.admin.findByStreamerId(
        streamerId
      );

      const loadedLinks = Array.isArray(response.links) ? response.links : [];
      setLinks(
        ensureSocialLinkIds(
          loadedLinks.length > 0 ? loadedLinks : [emptySocialLink()]
        )
      );
      setPageConfig(response.pageConfig ?? getDefaultLinkPageConfig());
      setLoadedForId(streamerId);
    } catch (loadError) {
      console.error(loadError);
      onLoadErrorRef.current();
      setLinks([emptySocialLink()]);
      setPageConfig(getDefaultLinkPageConfig());
      setLoadedForId(streamerId);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!targetStreamerId) {
      fetchedStreamerIdRef.current = null;
      setLoadedForId(null);
      setLoading(false);
      return;
    }

    if (fetchedStreamerIdRef.current === targetStreamerId) return;

    fetchedStreamerIdRef.current = targetStreamerId;
    let cancelled = false;

    void (async () => {
      await loadLinksPage(targetStreamerId);
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [targetStreamerId, loadLinksPage]);

  const handleViewFilterChange = useCallback(
    (nextFilter: AdminViewFilter, setFormTarget: (value: string) => void) => {
      if (nextFilter !== "all" && nextFilter !== "mine") {
        setFormTarget(nextFilter);
      } else if (nextFilter === "mine") {
        setFormTarget("");
      }
      fetchedStreamerIdRef.current = null;
    },
    []
  );

  const previewUrl = activeChannel
    ? `/${activeChannel.twitchUsername}/links`
    : "#";

  const streamerPreview = activeChannel
    ? {
        name: activeChannel.name,
        twitchUsername: activeChannel.twitchUsername,
        avatar: activeChannel.avatar,
        twitchUrl: `https://twitch.tv/${activeChannel.twitchUsername}`,
      }
    : null;

  const isReady =
    !loading && Boolean(activeChannel) && loadedForId === editStreamerId;

  return {
    links,
    pageConfig,
    loading,
    loadedForId,
    saveHandlers,
    setSaveHandlers,
    editStreamerId,
    activeChannel,
    previewUrl,
    streamerPreview,
    isReady,
    handleViewFilterChange,
  };
}
