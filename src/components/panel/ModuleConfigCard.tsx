"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Lock } from "lucide-react";
import {
  getChildFeatures,
  type PanelFeature,
} from "@/config/panel-features";
import type { ResolvedFeatureState } from "@/contexts/PanelConfigContext";
import { DynamicIcon } from "@/components/panel/DynamicIcon";
import {
  ComingSoonBadge,
  PlanBadge,
} from "@/components/panel/panel-badges";
import { SubFeatureRow } from "@/components/panel/SubFeatureRow";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface ModuleConfigCardProps {
  module: PanelFeature;
  features: Record<string, ResolvedFeatureState>;
  onToggle: (featureKey: string, enabled: boolean) => Promise<void>;
}

export function ModuleConfigCard({
  module,
  features,
  onToggle,
}: ModuleConfigCardProps) {
  const state = features[module.key];
  const children = getChildFeatures(module.key);
  const [isExpanded, setIsExpanded] = useState(state?.enabled ?? false);
  const isPlanLocked = state?.reason === "plan";
  const isComingSoon = Boolean(module.isComingSoon);

  const enabledChildren = children.filter((c) => features[c.key]?.enabled);
  const summaryText =
    children.length > 0
      ? `${enabledChildren.length} de ${children.length} seções ativas`
      : module.description.slice(0, 55) +
        (module.description.length > 55 ? "…" : "");

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border transition-all",
        state?.enabled
          ? "border-border/60 bg-background"
          : "border-border/30 bg-muted/20",
        isPlanLocked && "opacity-70"
      )}
    >
      <div className="flex items-center gap-3 px-5 py-4">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            state?.enabled ? "bg-purple-500/15" : "bg-muted"
          )}
        >
          <DynamicIcon
            name={module.icon}
            className={cn(
              "h-4 w-4",
              state?.enabled ? "text-purple-400" : "text-muted-foreground"
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{module.label}</span>
            {module.requiredPlan !== "free" ? (
              <PlanBadge plan={module.requiredPlan} />
            ) : null}
            {isComingSoon ? <ComingSoonBadge /> : null}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {summaryText}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {children.length > 0 && state?.enabled && !isComingSoon ? (
            <button
              type="button"
              onClick={() => setIsExpanded((value) => !value)}
              className="rounded p-1 transition-colors hover:bg-muted"
              aria-label={isExpanded ? "Recolher seções" : "Expandir seções"}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </button>
          ) : null}

          {isPlanLocked ? (
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-amber-400/70" aria-hidden />
              <Link
                href="/pricing"
                className="text-xs text-amber-400 underline hover:text-amber-300"
              >
                Upgrade
              </Link>
            </div>
          ) : isComingSoon ? (
            <span className="text-xs text-muted-foreground">Em breve</span>
          ) : (
            <Switch
              checked={state?.enabled ?? false}
              onCheckedChange={(value) => {
                void onToggle(module.key, value);
                if (value) setIsExpanded(true);
                else setIsExpanded(false);
              }}
              aria-label={`${state?.enabled ? "Desativar" : "Ativar"} ${module.label}`}
            />
          )}
        </div>
      </div>

      {isExpanded && children.length > 0 ? (
        <div className="divide-y divide-border/20 border-t border-border/30">
          {children.map((child) => (
            <SubFeatureRow
              key={child.key}
              feature={child}
              state={features[child.key]}
              onToggle={onToggle}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
