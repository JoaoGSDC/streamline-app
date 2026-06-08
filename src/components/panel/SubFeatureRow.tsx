"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import type { PanelFeature } from "@/config/panel-features";
import type { ResolvedFeatureState } from "@/contexts/PanelConfigContext";
import { DynamicIcon } from "@/components/panel/DynamicIcon";
import {
  ComingSoonBadge,
  PlanBadge,
} from "@/components/panel/panel-badges";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface SubFeatureRowProps {
  feature: PanelFeature;
  state?: ResolvedFeatureState;
  onToggle: (featureKey: string, enabled: boolean) => Promise<void>;
}

export function SubFeatureRow({
  feature,
  state,
  onToggle,
}: SubFeatureRowProps) {
  const isPlanLocked = state?.reason === "plan";
  const isParentDisabled = state?.reason === "parent_disabled";
  const isComingSoon = Boolean(feature.isComingSoon);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30",
        (isPlanLocked || isComingSoon) && "opacity-60"
      )}
    >
      <DynamicIcon
        name={feature.icon}
        className="ml-1 h-3.5 w-3.5 shrink-0 text-muted-foreground"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm">{feature.label}</span>
          {feature.requiredPlan !== "free" ? (
            <PlanBadge plan={feature.requiredPlan} size="xs" />
          ) : null}
          {isComingSoon ? <ComingSoonBadge size="xs" /> : null}
        </div>
        <p className="mt-0.5 max-w-[300px] truncate text-xs text-muted-foreground">
          {feature.description}
        </p>
      </div>

      {isPlanLocked ? (
        <div className="flex items-center gap-1">
          <Lock className="h-3 w-3 text-amber-400/70" aria-hidden />
          <Link href="/pricing" className="text-xs text-amber-400 underline">
            Pro
          </Link>
        </div>
      ) : isComingSoon ? (
        <span className="text-xs text-muted-foreground">Em breve</span>
      ) : (
        <Switch
          checked={state?.enabled ?? false}
          disabled={isParentDisabled}
          onCheckedChange={(value) => void onToggle(feature.key, value)}
          className="scale-90"
          aria-label={`${state?.enabled ? "Desativar" : "Ativar"} ${feature.label}`}
        />
      )}
    </div>
  );
}
