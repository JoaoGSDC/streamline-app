import { cookies } from "next/headers";
import {
  ADMIN_ACTING_AS_COOKIE,
  canManageStreamer,
  parseSessionFromCookie,
} from "@lib/admin-auth";
import { getPanelConfigForStreamer } from "@server/panel/panel-config.service";
import { PANEL_FEATURES, type PlanTier } from "@/config/panel-features";
import {
  buildResolvedFeatures,
  type ResolvedFeatureStateResult,
} from "@/types/panel-config";

export interface PanelConfigInitialData {
  streamerId: string;
  plan: PlanTier;
  planExpiresAt: Date | null;
  overrides: Record<string, boolean>;
  features: Record<
    string,
    ResolvedFeatureStateResult & { userEnabled: boolean }
  >;
  registry: typeof PANEL_FEATURES;
}

export function buildEmptyPanelConfigInitialData(): PanelConfigInitialData {
  const plan: PlanTier = "free";
  return {
    streamerId: "",
    plan,
    planExpiresAt: null,
    overrides: {},
    features: buildResolvedFeatures(plan, {}),
    registry: PANEL_FEATURES,
  };
}

export async function loadAdminPanelInitialData(): Promise<PanelConfigInitialData | null> {
  const cookieStore = await cookies();
  const user = parseSessionFromCookie(cookieStore.get("twitch_session")?.value);
  if (!user) return null;

  const actingAs =
    cookieStore.get(ADMIN_ACTING_AS_COOKIE)?.value?.trim() || user.id;

  const allowed = await canManageStreamer(user.id, actingAs);
  if (!allowed) return null;

  const config = await getPanelConfigForStreamer(actingAs);
  if (!config) return null;

  return {
    streamerId: config.streamerId,
    plan: config.plan,
    planExpiresAt: config.planExpiresAt
      ? new Date(config.planExpiresAt)
      : null,
    overrides: extractOverridesFromFeatures(config.features),
    features: config.features,
    registry: config.registry,
  };
}

function extractOverridesFromFeatures(
  features: Record<string, { userEnabled: boolean }>
): Record<string, boolean> {
  const overrides: Record<string, boolean> = {};
  for (const feature of PANEL_FEATURES) {
    const state = features[feature.key];
    if (!state) continue;
    if (state.userEnabled !== feature.defaultEnabled) {
      overrides[feature.key] = state.userEnabled;
    }
  }
  return overrides;
}
