import {
  getFeature,
  PANEL_FEATURES,
  planSatisfies,
  type PlanTier,
} from "@/config/panel-features";
import { getStreamerById } from "@lib/db-queries";
import {
  getUserPanelOverrides,
  upsertUserPanelOverrides,
} from "@lib/panel-config-db-queries";
import { compactOverrides } from "@server/panel/resolve-panel-config";
import { resolveStreamerPlan } from "@server/panel/streamer-plan";
import {
  resolveFeatureState,
  resolveUserChoice,
  type ResolvedFeatureStateResult,
} from "@/types/panel-config";

export interface PanelConfigContext {
  streamerId: string;
  plan: PlanTier;
  planExpiresAt: Date | null;
  overrides: Record<string, boolean>;
}

export interface PanelConfigGetResponse {
  streamerId: string;
  plan: PlanTier;
  planExpiresAt: string | null;
  features: Record<
    string,
    ResolvedFeatureStateResult & { userEnabled: boolean }
  >;
  registry: typeof PANEL_FEATURES;
}

export async function loadPanelConfigContext(
  streamerId: string
): Promise<PanelConfigContext | null> {
  const [streamer, overrides] = await Promise.all([
    getStreamerById(streamerId),
    getUserPanelOverrides(streamerId),
  ]);

  if (!streamer) return null;

  const plan = resolveStreamerPlan(streamer);

  return {
    streamerId,
    plan,
    planExpiresAt: streamer.planExpiresAt ?? null,
    overrides,
  };
}

export function buildResolvedFeatures(
  plan: PlanTier,
  overrides: Record<string, boolean>
): PanelConfigGetResponse["features"] {
  const features: PanelConfigGetResponse["features"] = {};

  for (const feature of PANEL_FEATURES) {
    const state = resolveFeatureState(feature.key, plan, overrides);
    features[feature.key] = {
      ...state,
      userEnabled: resolveUserChoice(feature.key, plan, overrides),
    };
  }

  return features;
}

export async function getPanelConfigForStreamer(
  streamerId: string
): Promise<PanelConfigGetResponse | null> {
  const context = await loadPanelConfigContext(streamerId);
  if (!context) return null;

  return {
    streamerId: context.streamerId,
    plan: context.plan,
    planExpiresAt: context.planExpiresAt?.toISOString() ?? null,
    features: buildResolvedFeatures(context.plan, context.overrides),
    registry: PANEL_FEATURES,
  };
}

export async function checkFeatureForStreamer(
  streamerId: string,
  featureKey: string
): Promise<ResolvedFeatureStateResult> {
  const context = await loadPanelConfigContext(streamerId);
  if (!context) {
    return { enabled: false, locked: true };
  }

  return resolveFeatureState(featureKey, context.plan, context.overrides);
}

export function sanitizePanelOverrides(
  incoming: Record<string, boolean>,
  userPlan: PlanTier,
  existingOverrides: Record<string, boolean> = {}
): Record<string, boolean> {
  const merged = { ...existingOverrides };

  for (const [key, value] of Object.entries(incoming)) {
    const feature = getFeature(key);
    if (!feature) continue;
    if (feature.isComingSoon) continue;
    if (!planSatisfies(userPlan, feature.requiredPlan)) continue;

    if (value !== feature.defaultEnabled) {
      merged[key] = value;
    } else {
      delete merged[key];
    }
  }

  return compactOverrides(
    Object.fromEntries(
      PANEL_FEATURES.map((feature) => [
        feature.key,
        merged[feature.key] ?? feature.defaultEnabled,
      ])
    )
  );
}

export async function savePanelConfigOverrides(
  streamerId: string,
  incomingOverrides: Record<string, boolean>
): Promise<{ savedKeys: number; overrides: Record<string, boolean> }> {
  const context = await loadPanelConfigContext(streamerId);
  if (!context) {
    throw new Error("Canal não encontrado");
  }

  const sanitized = sanitizePanelOverrides(
    incomingOverrides,
    context.plan,
    context.overrides
  );

  await upsertUserPanelOverrides(streamerId, sanitized);

  return {
    savedKeys: Object.keys(sanitized).length,
    overrides: sanitized,
  };
}
