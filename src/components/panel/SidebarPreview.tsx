"use client";

import {
  getChildFeatures,
  getTopLevelFeatures,
} from "@/config/panel-features";
import type { ResolvedFeatureState } from "@/contexts/PanelConfigContext";
import { DynamicIcon } from "@/components/panel/DynamicIcon";
import { cn } from "@/lib/utils";

const SHOW_SUBNAV_FOR = new Set(["bot", "economy", "store"]);

const SIDEBAR_UTILITY_KEYS = new Set(["panel_settings"]);

interface SidebarPreviewProps {
  features: Record<string, ResolvedFeatureState>;
}

export function SidebarPreview({ features }: SidebarPreviewProps) {
  const topFeatures = getTopLevelFeatures().filter(
    (feature) => !SIDEBAR_UTILITY_KEYS.has(feature.key)
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-muted/20">
      <div className="border-b border-border/30 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Preview do painel
        </p>
      </div>

      <div className="space-y-0.5 p-3">
        {topFeatures.map((feature) => {
          if (!features[feature.key]?.enabled) return null;

          const children = SHOW_SUBNAV_FOR.has(feature.key)
            ? getChildFeatures(feature.key).filter(
                (child) => child.route && features[child.key]?.enabled
              )
            : [];

          return (
            <div key={feature.key}>
              <PreviewItem icon={feature.icon} label={feature.label} />
              {children.map((child) => (
                <PreviewItem
                  key={child.key}
                  icon={child.icon}
                  label={child.label}
                  isChild
                />
              ))}
            </div>
          );
        })}

        <div className="mt-1 border-t border-border/20 pt-1">
          <PreviewItem icon="external-link" label="Ver Perfil Público" muted />
          <PreviewItem icon="home" label="Voltar ao Início" muted />
          <PreviewItem icon="settings-2" label="Personalizar painel" muted />
        </div>
      </div>
    </div>
  );
}

function PreviewItem({
  icon,
  label,
  isChild = false,
  muted = false,
}: {
  icon: string;
  label: string;
  isChild?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5",
        isChild && "pl-6",
        muted && "opacity-50"
      )}
    >
      <DynamicIcon name={icon} className="h-3 w-3 text-muted-foreground" />
      <span
        className={cn(
          "text-xs",
          isChild ? "text-muted-foreground" : "text-foreground/80"
        )}
      >
        {label}
      </span>
    </div>
  );
}
