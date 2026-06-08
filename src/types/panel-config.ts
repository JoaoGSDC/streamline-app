import {
  getFeature,
  planSatisfies,
  type PlanTier,
} from "@/config/panel-features";

export type { PlanTier };

export interface UserPlanRecord {
  plan: PlanTier;
  planExpiresAt: Date | null;
}

export interface UserPanelConfigRecord {
  userId: string;
  overrides: Record<string, boolean>;
  updatedAt: Date;
}

export type FeatureDisabledReason = "plan" | "parent_disabled" | "coming_soon";

export interface ResolvedFeatureStateResult {
  enabled: boolean;
  locked: boolean;
  reason?: FeatureDisabledReason;
}

export function resolveFeatureState(
  featureKey: string,
  userPlan: PlanTier,
  overrides: Record<string, boolean>
): ResolvedFeatureStateResult {
  const feature = getFeature(featureKey);
  if (!feature) return { enabled: false, locked: true };

  if (feature.isComingSoon) {
    return { enabled: false, locked: true, reason: "coming_soon" };
  }

  if (!planSatisfies(userPlan, feature.requiredPlan)) {
    return { enabled: false, locked: true, reason: "plan" };
  }

  if (feature.parentKey) {
    const parentState = resolveFeatureState(
      feature.parentKey,
      userPlan,
      overrides
    );
    if (!parentState.enabled) {
      return { enabled: false, locked: true, reason: "parent_disabled" };
    }
  }

  const enabled =
    featureKey in overrides ? overrides[featureKey] : feature.defaultEnabled;

  return { enabled, locked: false };
}

/** Valor escolhido pelo usuário antes de bloqueios de plano/pai. */
export function resolveUserChoice(
  featureKey: string,
  userPlan: PlanTier,
  overrides: Record<string, boolean>
): boolean {
  const feature = getFeature(featureKey);
  if (!feature) return false;

  if (feature.isComingSoon) return false;
  if (!planSatisfies(userPlan, feature.requiredPlan)) return false;

  return featureKey in overrides ? overrides[featureKey] : feature.defaultEnabled;
}
