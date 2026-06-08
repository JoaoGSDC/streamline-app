"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown } from "lucide-react";
import { getFeature } from "@/config/panel-features";
import {
  usePanelConfig,
  type ResolvedFeatureState,
} from "@/contexts/PanelConfigContext";

interface FeatureGuardProps {
  featureKey: string;
  children: React.ReactNode;
  showLocked?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function FeatureGuard({
  featureKey,
  children,
  showLocked = false,
  fallback,
  redirectTo,
}: FeatureGuardProps) {
  const { features, isLoading } = usePanelConfig();
  const state = features[featureKey];
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (state && !state.enabled && redirectTo) {
      router.replace(redirectTo);
    }
  }, [state, redirectTo, router, isLoading]);

  if (isLoading) {
    return null;
  }

  if (!state || !state.enabled) {
    if (fallback) return <>{fallback}</>;
    if (showLocked) {
      return (
        <LockedFeaturePlaceholder featureKey={featureKey} state={state} />
      );
    }
    return null;
  }

  return <>{children}</>;
}

function LockedFeaturePlaceholder({
  featureKey,
  state,
}: {
  featureKey: string;
  state?: ResolvedFeatureState;
}) {
  const feature = getFeature(featureKey);

  if (state?.reason === "plan") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3">
        <Crown className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-300">{feature?.label}</p>
          <p className="text-xs text-amber-400/70">
            Disponível no plano Pro.
          </p>
        </div>
        <Link
          href="/pricing"
          className="shrink-0 text-xs text-amber-400 underline hover:text-amber-300"
        >
          Ver planos
        </Link>
      </div>
    );
  }

  if (state?.reason === "coming_soon") {
    return (
      <div className="rounded-lg border border-outline-variant/30 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        {feature?.label ?? "Funcionalidade"} — em breve
      </div>
    );
  }

  return null;
}
