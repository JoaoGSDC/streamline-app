"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminChannelOptions,
  type AdminViewFilter,
} from "@/hooks/useAdminChannelOptions";
import type { StreamerSocialLink } from "@/lib/streamer-social";
import type { LinkPageConfig } from "@/types/link-page";
import { getDefaultLinkPageConfig } from "@/lib/link-page-config";
import {
  emptySocialLink,
  ensureSocialLinkIds,
} from "@/lib/link-builder-utils";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminStreamerViewFilter } from "@/components/admin/shared/AdminStreamerViewFilter";
import { AdminStreamerFormSelect } from "@/components/admin/shared/AdminStreamerFormSelect";
import {
  LinkPageBuilder,
  type LinkPageBuilderSaveHandlers,
} from "@/components/admin/links/LinkPageBuilder";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLinksPage() {
  const { toast } = useToast();
  const {
    ownerChannel,
    moderatedChannels,
    canModerateOthers,
    viewFilterOptions,
    resolveFormStreamerId,
    channels,
  } = useAdminChannelOptions();

  const [viewFilter, setViewFilter] = useState<AdminViewFilter>("mine");
  const [formTarget, setFormTarget] = useState("");
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
    channels.find((c) => c.id === editStreamerId) ?? ownerChannel;

  const load = useCallback(
    async (streamerId: string) => {
      if (!streamerId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/streamers/${streamerId}/social-links`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao carregar");

        const loaded = Array.isArray(data.links) ? data.links : [];
        setLinks(
          ensureSocialLinkIds(
            loaded.length > 0 ? loaded : [emptySocialLink()]
          )
        );
        setPageConfig(data.pageConfig ?? getDefaultLinkPageConfig());
        setLoadedForId(streamerId);
      } catch (e) {
        console.error(e);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a página de links.",
          variant: "destructive",
        });
        setLinks([emptySocialLink()]);
        setPageConfig(getDefaultLinkPageConfig());
        setLoadedForId(streamerId);
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (viewFilter === "all") {
      const id = resolveFormStreamerId(formTarget);
      if (id) load(id);
      return;
    }
    if (viewFilter === "mine") {
      load(resolveFormStreamerId(formTarget));
      return;
    }
    setFormTarget(viewFilter);
    load(viewFilter);
  }, [viewFilter, formTarget, load, resolveFormStreamerId]);

  if (!ownerChannel && channels.length === 0) return null;

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

  return (
    <>
      <AdminPageHeader
        title="Link Page Builder"
        description="Monte sua vitrine premium — templates, blocos e identidade visual."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={previewUrl} target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir página pública
          </Link>
        </Button>
        <Button
          size="sm"
          disabled={
            loading ||
            !saveHandlers ||
            saveHandlers.saving ||
            loadedForId !== editStreamerId
          }
          onClick={() => void saveHandlers?.save()}
        >
          <Save className="mr-2 h-4 w-4" />
          {saveHandlers?.saving ? "Salvando..." : "Salvar página"}
        </Button>
      </AdminPageHeader>

      <div className="mb-6 space-y-4 rounded-xl border border-outline-variant/30 bg-surface-container-low/30 p-4">
        <p className="text-body-sm text-muted-foreground">
          {activeChannel ? (
            <>
              Editando a página de links de{" "}
              <span className="font-medium text-foreground">
                @{activeChannel.twitchUsername}
              </span>
            </>
          ) : (
            "Selecione o canal abaixo."
          )}
        </p>
        <AdminStreamerViewFilter
          value={viewFilter}
          onChange={(v) => {
            setViewFilter(v);
            if (v !== "all" && v !== "mine") {
              setFormTarget(v);
            } else if (v === "mine") {
              setFormTarget("");
            }
          }}
          options={viewFilterOptions}
        />

        <AdminStreamerFormSelect
          value={formTarget}
          onChange={setFormTarget}
          ownerChannel={ownerChannel}
          moderatedChannels={moderatedChannels}
          alwaysShow
          label="Canal da página"
          disabledHint="A página de links será do seu perfil."
          enabledHint="Escolha para qual streamer esta página de links será salva."
        />
      </div>

      {loading || !activeChannel || loadedForId !== editStreamerId ? (
        <div className="link-builder w-full space-y-4">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
      ) : streamerPreview ? (
        <LinkPageBuilder
          key={editStreamerId}
          streamerId={editStreamerId}
          twitchUsername={activeChannel.twitchUsername}
          streamer={streamerPreview}
          initialLinks={links}
          initialConfig={pageConfig}
          onSaveReady={setSaveHandlers}
        />
      ) : null}
    </>
  );
}
