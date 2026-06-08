import { eq } from "drizzle-orm";
import { getFeature, planSatisfies, type PlanTier } from "@/config/panel-features";

export type { PlanTier };
import { getStreamerById } from "@lib/db-queries";
import { db } from "@lib/db";
import { streamers } from "@lib/schema";
import { resolveStreamerPlan } from "@server/panel/streamer-plan";
import { HttpError } from "@server/utils/http-error";

export class ForbiddenError extends HttpError {
  constructor(message: string, code = "FORBIDDEN") {
    super(message, 403, code);
    this.name = "ForbiddenError";
  }
}

const VALID_PLANS: PlanTier[] = ["free", "pro", "enterprise"];

function parsePlan(value: string | null | undefined): PlanTier | null {
  if (!value) return null;
  return VALID_PLANS.includes(value as PlanTier) ? (value as PlanTier) : null;
}

async function downgradeExpiredPlan(streamerId: string): Promise<void> {
  try {
    await db
      .update(streamers)
      .set({
        plan: "free",
        planExpiresAt: null,
        premium: false,
      })
      .where(eq(streamers.id, streamerId));
  } catch (error) {
    console.error("Falha ao fazer downgrade de plano expirado", error);
  }
}

/**
 * Resolve o plano efetivo do streamer (id interno = userId da sessão).
 * Faz downgrade assíncrono quando planExpiresAt já passou.
 */
export async function getUserPlan(userId: string): Promise<PlanTier> {
  const streamer = await getStreamerById(userId);
  if (!streamer) return "free";

  const explicitPlan = parsePlan(streamer.plan ?? null);
  const isExpired =
    Boolean(streamer.planExpiresAt) &&
    streamer.planExpiresAt!.getTime() < Date.now();

  if (explicitPlan && isExpired) {
    void downgradeExpiredPlan(userId);
    return "free";
  }

  return resolveStreamerPlan(streamer);
}

export async function getUserPlanDetails(userId: string): Promise<{
  plan: PlanTier;
  planExpiresAt: Date | null;
}> {
  const streamer = await getStreamerById(userId);
  if (!streamer) {
    return { plan: "free", planExpiresAt: null };
  }

  const plan = await getUserPlan(userId);
  const planExpiresAt =
    plan === "free" ? null : (streamer.planExpiresAt ?? null);

  return { plan, planExpiresAt };
}

/** Verifica se o plano do usuário satisfaz o requiredPlan da feature. */
export async function assertFeatureAccess(
  userId: string,
  featureKey: string
): Promise<void> {
  const feature = getFeature(featureKey);
  if (!feature) {
    throw new HttpError("Feature not found", 404, "FEATURE_NOT_FOUND");
  }

  const userPlan = await getUserPlan(userId);
  if (!planSatisfies(userPlan, feature.requiredPlan)) {
    throw new ForbiddenError(
      `Feature "${featureKey}" requires plan "${feature.requiredPlan}"`
    );
  }
}

export async function updateUserPlan(
  userId: string,
  plan: PlanTier,
  planExpiresAt: Date | null
): Promise<void> {
  await db
    .update(streamers)
    .set({
      plan,
      planExpiresAt,
      premium: plan === "pro" || plan === "enterprise",
    })
    .where(eq(streamers.id, userId));
}
