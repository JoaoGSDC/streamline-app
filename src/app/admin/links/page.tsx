"use client";

import { useCallback, useState } from "react";
import { ExternalLink, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminChannelOptions,
  type AdminViewFilter,
} from "@/hooks/useAdminChannelOptions";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminStreamerViewFilter } from "@/components/admin/shared/AdminStreamerViewFilter";
import { AdminStreamerFormSelect } from "@/components/admin/shared/AdminStreamerFormSelect";
import { LinkPageBuilder } from "@/components/admin/links/LinkPageBuilder";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAdminLinksPage } from "@features/links/hooks/use-admin-links-page.hook";

export default function AdminLinksPage() {
  const { toast } = useToast();
  const {
    ownerChannel,
    moderatedChannels,
    viewFilterOptions,
    resolveFormStreamerId,
    channels,
    canModerateOthers,
  } = useAdminChannelOptions();

  const [viewFilter, setViewFilter] = useState<AdminViewFilter>("mine");
  const [formTarget, setFormTarget] = useState("");

  const hasMultipleChannels = canModerateOthers || channels.length > 1;

  const handleLoadError = useCallback(() => {
    toast({
      title: "Erro",
      description: "Não foi possível carregar a página de links.",
      variant: "destructive",
    });
  }, [toast]);

  const {
    links,
    pageConfig,
    saveHandlers,
    setSaveHandlers,
    editStreamerId,
    activeChannel,
    previewUrl,
    streamerPreview,
    isReady,
    handleViewFilterChange,
  } = useAdminLinksPage({
    viewFilter,
    formTarget,
    resolveFormStreamerId,
    ownerChannel,
    channels,
    onLoadError: handleLoadError,
  });

  const saveState = saveHandlers?.saveState ?? "idle";

  const saveButtonLabel =
    saveState === "saving"
      ? "Salvando..."
      : saveState === "saved"
        ? "✓ Salvo"
        : saveState === "error"
          ? "⚠ Erro ao salvar — Tentar novamente"
          : "Salvar página";

  if (!ownerChannel && channels.length === 0) return null;

  return (
    <>
      <AdminPageHeader
        title="Link Page Builder"
        description="Monte sua vitrine premium — aparência, conteúdo e links em um só fluxo."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={previewUrl} target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir página pública
          </Link>
        </Button>
        <Button
          size="sm"
          disabled={!isReady || !saveHandlers || saveState === "saving"}
          className={cn(
            saveState === "saved" &&
              "bg-emerald-600 text-white hover:bg-emerald-600",
            saveState === "error" && "bg-destructive hover:bg-destructive"
          )}
          onClick={() => void saveHandlers?.save()}
        >
          {saveState === "idle" || saveState === "saving" ? (
            <Save className="mr-2 h-4 w-4" />
          ) : null}
          {saveButtonLabel}
        </Button>
      </AdminPageHeader>

      <div className="mb-6 rounded-xl border border-outline-variant/30 bg-surface-container-low/30 p-4">
        {hasMultipleChannels ? (
          <div className="space-y-4">
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
              onChange={(nextFilter) => {
                setViewFilter(nextFilter);
                handleViewFilterChange(nextFilter, setFormTarget);
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
        ) : activeChannel ? (
          <p className="text-label text-muted-foreground">
            Editando:{" "}
            <span className="font-medium text-foreground">
              @{activeChannel.twitchUsername}
            </span>
          </p>
        ) : null}
      </div>

      {!isReady ? (
        <div className="link-builder w-full space-y-4">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
      ) : streamerPreview ? (
        <LinkPageBuilder
          key={editStreamerId}
          streamerId={editStreamerId}
          twitchUsername={activeChannel!.twitchUsername}
          streamer={streamerPreview}
          initialLinks={links}
          initialConfig={pageConfig}
          onSaveReady={setSaveHandlers}
        />
      ) : null}
    </>
  );
}
