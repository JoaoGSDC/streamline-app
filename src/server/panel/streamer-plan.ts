import type { PlanTier } from "@/config/panel-features";
import { planSatisfies } from "@/config/panel-features";

const VALID_PLANS: PlanTier[] = ["free", "pro", "enterprise"];

function parsePlan(value: string | null | undefined): PlanTier | null {
  if (!value) return null;
  return VALID_PLANS.includes(value as PlanTier) ? (value as PlanTier) : null;
}

/** Resolve o plano efetivo do streamer (coluna plan + fallback legacy partner/premium). */
export function resolveStreamerPlan(streamer: {
  plan?: string | null;
  planExpiresAt?: Date | null;
  partner?: boolean;
  premium?: boolean;
}): PlanTier {
  const explicitPlan = parsePlan(streamer.plan ?? null);

  if (explicitPlan) {
    if (
      streamer.planExpiresAt &&
      streamer.planExpiresAt.getTime() < Date.now()
    ) {
      return "free";
    }
    return explicitPlan;
  }

  if (streamer.partner) return "enterprise";
  if (streamer.premium) return "pro";
  return "free";
}

export function hasPremiumAccessFromPlan(userPlan: PlanTier): boolean {
  return planSatisfies(userPlan, "pro");
}
