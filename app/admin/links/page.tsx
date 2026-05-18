"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Link2, Plus, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminChannelOptions,
  type AdminViewFilter,
} from "@/hooks/useAdminChannelOptions";
import type { StreamerSocialLink } from "@/lib/streamer-social";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSection } from "@/components/admin/shared/AdminSection";
import { AdminStreamerViewFilter } from "@/components/admin/shared/AdminStreamerViewFilter";
import { AdminStreamerFormSelect } from "@/components/admin/shared/AdminStreamerFormSelect";
import { SocialLinkEditorCard } from "@/components/admin/links/SocialLinkEditorCard";
import { isValidHttpUrl } from "@/components/admin/links/social-platform";

const emptyLink = (): StreamerSocialLink => ({ label: "", url: "" });

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        setLinks(loaded.length > 0 ? loaded : [emptyLink()]);
      } catch (e) {
        console.error(e);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os links.",
          variant: "destructive",
        });
        setLinks([emptyLink()]);
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

  const updateLink = (
    index: number,
    field: keyof StreamerSocialLink,
    value: string
  ) => {
    setLinks((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addLink = () => setLinks((prev) => [...prev, emptyLink()]);

  const removeLink = (index: number) => {
    setLinks((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [emptyLink()];
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const streamerId = resolveFormStreamerId(formTarget);
    if (!streamerId) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/streamers/${streamerId}/social-links`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");

      setLinks(data.links?.length ? data.links : [emptyLink()]);
      toast({
        title: "Links salvos",
        description: "Sua página de links foi atualizada.",
      });
    } catch (e) {
      toast({
        title: "Erro ao salvar",
        description:
          e instanceof Error ? e.message : "Não foi possível salvar os links.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStreamerChange = (id: string) => {
    setFormTarget(id);
  };

  if (!ownerChannel && channels.length === 0) return null;

  const previewUrl = activeChannel
    ? `/${activeChannel.twitchUsername}/links`
    : "#";
  const validCount = links.filter(
    (l) => l.url.trim() && isValidHttpUrl(l.url.trim())
  ).length;

  return (
    <>
      <AdminPageHeader
        title="Redes Sociais"
        description="Monte a página de links de cada canal."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={previewUrl} target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" />
            Pré-visualizar
          </Link>
        </Button>
      </AdminPageHeader>

      <div className="mb-6">
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
      </div>

      <AdminSection
        title={
          activeChannel
            ? `Links de @${activeChannel.twitchUsername}`
            : "Seus links"
        }
        description={`${validCount} link${validCount === 1 ? "" : "s"} prontos`}
        contentClassName="space-y-4"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {canModerateOthers ? (
            <AdminStreamerFormSelect
              value={formTarget}
              onChange={handleStreamerChange}
              ownerChannel={ownerChannel}
              moderatedChannels={moderatedChannels}
            />
          ) : null}

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-36 animate-pulse rounded-xl bg-surface-container-low/60"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {links.map((link, index) => (
                  <SocialLinkEditorCard
                    key={index}
                    link={link}
                    index={index}
                    onChange={updateLink}
                    onRemove={removeLink}
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-outline-variant/30 pt-4">
                <Button type="button" variant="outline" onClick={addLink}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar rede
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </>
          )}
        </form>
      </AdminSection>

      <div className="mt-6 flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-low/40 px-4 py-3 text-body-sm text-muted-foreground">
        <Link2 className="h-4 w-4 shrink-0 text-primary" />
        Se você não cadastrar links aqui, usamos automaticamente os da bio da Twitch.
      </div>
    </>
  );
}
