import {
  PANEL_FEATURES,
  getFeature,
  planSatisfies,
  type PanelFeature,
  type PlanTier,
} from "@/config/panel-features";
import {
  resolveFeatureState,
  resolveUserChoice,
  type FeatureDisabledReason,
} from "@/types/panel-config";
import { resolveStreamerPlan } from "@server/panel/streamer-plan";

export interface ResolvedFeatureState {
  key: string;
  label: string;
  description: string;
  icon: string;
  parentKey?: string;
  route?: string;
  defaultEnabled: boolean;
  requiredPlan: PlanTier;
  isComingSoon?: boolean;
  /** Valor escolhido pelo usuário (antes de bloqueio plano/pai). */
  userEnabled: boolean;
  locked: boolean;
  reason?: FeatureDisabledReason;
  /** Efetivamente visível (usuário + plano + ancestrais). */
  enabled: boolean;
  hasOverride: boolean;
}

export interface ResolvedPanelConfig {
  streamerId: string;
  userPlan: PlanTier;
  hasPremiumAccess: boolean;
  features: Record<string, ResolvedFeatureState>;
  /** Somente chaves que diferem do default — para persistência. */
  storedOverrides: Record<string, boolean>;
}

export function mergeOverridesWithDefaults(
  storedOverrides: Record<string, boolean>
): Record<string, boolean> {
  const merged: Record<string, boolean> = {};
  for (const feature of PANEL_FEATURES) {
    merged[feature.key] =
      storedOverrides[feature.key] ?? feature.defaultEnabled;
  }
  return merged;
}

export function compactOverrides(
  userChoices: Record<string, boolean>
): Record<string, boolean> {
  const compact: Record<string, boolean> = {};
  for (const feature of PANEL_FEATURES) {
    const value = userChoices[feature.key];
    if (value !== undefined && value !== feature.defaultEnabled) {
      compact[feature.key] = value;
    }
  }
  return compact;
}

function buildFeatureState(
  feature: PanelFeature,
  userPlan: PlanTier,
  storedOverrides: Record<string, boolean>
): ResolvedFeatureState {
  const resolved = resolveFeatureState(feature.key, userPlan, storedOverrides);
  const userEnabled = resolveUserChoice(feature.key, userPlan, storedOverrides);

  return {
    key: feature.key,
    label: feature.label,
    description: feature.description,
    icon: feature.icon,
    parentKey: feature.parentKey,
    route: feature.route,
    defaultEnabled: feature.defaultEnabled,
    requiredPlan: feature.requiredPlan,
    isComingSoon: feature.isComingSoon,
    userEnabled,
    locked: resolved.locked,
    reason: resolved.reason,
    enabled: resolved.enabled,
    hasOverride: storedOverrides[feature.key] !== undefined,
  };
}

export function resolvePanelConfig(input: {
  streamerId: string;
  userPlan: PlanTier;
  storedOverrides?: Record<string, boolean>;
}): ResolvedPanelConfig {
  const storedOverrides = input.storedOverrides ?? {};
  const features: Record<string, ResolvedFeatureState> = {};

  for (const feature of PANEL_FEATURES) {
    features[feature.key] = buildFeatureState(
      feature,
      input.userPlan,
      storedOverrides
    );
  }

  return {
    streamerId: input.streamerId,
    userPlan: input.userPlan,
    hasPremiumAccess: planSatisfies(input.userPlan, "pro"),
    features,
    storedOverrides,
  };
}

export async function resolvePanelConfigForStreamer(
  streamerId: string,
  storedOverrides?: Record<string, boolean>
): Promise<ResolvedPanelConfig> {
  const { getStreamerById } = await import("@lib/db-queries");
  const streamer = await getStreamerById(streamerId);
  const userPlan = streamer ? resolveStreamerPlan(streamer) : "free";

  return resolvePanelConfig({
    streamerId,
    userPlan,
    storedOverrides,
  });
}

export function isFeatureEffectivelyEnabled(
  config: ResolvedPanelConfig,
  featureKey: string
): boolean {
  return config.features[featureKey]?.enabled ?? false;
}

export function validateOverridePatch(
  patch: Record<string, boolean>,
  userPlan: PlanTier
): { ok: true; merged: Record<string, boolean> } | { ok: false; error: string } {
  for (const key of Object.keys(patch)) {
    if (!getFeature(key)) {
      return { ok: false, error: `Feature desconhecida: ${key}` };
    }
  }

  const current = mergeOverridesWithDefaults({});
  const merged = { ...current, ...patch };

  for (const [key, enabled] of Object.entries(patch)) {
    const feature = getFeature(key);
    if (!feature) continue;

    if (feature.isComingSoon && enabled) {
      return {
        ok: false,
        error: `A feature "${feature.label}" ainda não está disponível`,
      };
    }

    if (enabled && !planSatisfies(userPlan, feature.requiredPlan)) {
      return {
        ok: false,
        error: `A feature "${feature.label}" requer plano ${feature.requiredPlan}`,
      };
    }
  }

  return { ok: true, merged };
}
