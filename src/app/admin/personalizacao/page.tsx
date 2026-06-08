"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import { useAdminContext } from "@/components/admin/AdminProvider";
import { usePanelConfig } from "@/contexts/PanelConfigContext";
import { getTopLevelFeatures } from "@/config/panel-features";
import { ModuleConfigCard } from "@/components/panel/ModuleConfigCard";
import { SidebarPreview } from "@/components/panel/SidebarPreview";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CONFIGURABLE_MODULE_KEYS = new Set(["panel_settings"]);

type SaveStatus = "idle" | "saving" | "saved";

export default function PersonalizarPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { actingAs, loading: adminLoading } = useAdminContext();
  const { plan, features, toggleFeature, isLoading } = usePanelConfig();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (adminLoading) return;
    if (!actingAs) return;
    if (actingAs.role !== "owner") {
      router.replace("/admin");
    }
  }, [actingAs, adminLoading, router]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleToggle = useCallback(
    async (featureKey: string, enabled: boolean) => {
      setSaveStatus("saving");
      try {
        await toggleFeature(featureKey, enabled);
        setSaveStatus("saved");
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error(error);
        setSaveStatus("idle");
        toast({
          title: "Não foi possível salvar",
          description: "Tente novamente em instantes.",
          variant: "destructive",
        });
      }
    },
    [toggleFeature, toast]
  );

  if (adminLoading || isLoading || !actingAs || actingAs.role !== "owner") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const topFeatures = getTopLevelFeatures().filter(
    (feature) => !CONFIGURABLE_MODULE_KEYS.has(feature.key)
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Personalizar painel
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Mostre apenas o que você usa. Alterações são salvas automaticamente.
            </p>
          </div>

          {saveStatus !== "idle" ? (
            <p
              className={cn(
                "text-xs font-medium",
                saveStatus === "saving"
                  ? "text-muted-foreground"
                  : "text-emerald-400"
              )}
            >
              {saveStatus === "saving" ? "Salvando…" : "Salvo"}
            </p>
          ) : null}
        </div>

        {plan === "free" ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400">
            <Crown className="h-3 w-3" aria-hidden />
            Plano gratuito · Algumas funcionalidades requerem o plano Pro
            <Link href="/pricing" className="font-medium underline">
              Ver planos →
            </Link>
          </div>
        ) : null}
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_260px]">
        <div className="space-y-3">
          {topFeatures.map((module) => (
            <ModuleConfigCard
              key={module.key}
              module={module}
              features={features}
              onToggle={handleToggle}
            />
          ))}
        </div>

        <div className="lg:sticky lg:top-6">
          <SidebarPreview features={features} />
        </div>
      </div>
    </div>
  );
}
