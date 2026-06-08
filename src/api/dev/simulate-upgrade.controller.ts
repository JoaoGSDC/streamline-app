import { NextRequest } from "next/server";
import { z } from "zod";
import { parseSessionUser } from "@lib/admin-auth";
import { updateUserPlan, type PlanTier } from "@lib/plan";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";

const bodySchema = z.object({
  plan: z.enum(["free", "pro", "enterprise"]),
});

export async function postSimulateUpgradeController(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return jsonError("Not available", 404, "NOT_FOUND");
  }

  try {
    const user = parseSessionUser(request);
    if (!user) {
      return jsonError("Não autorizado", 401, "UNAUTHORIZED");
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Payload inválido", 400, "VALIDATION_ERROR");
    }

    const plan = parsed.data.plan as PlanTier;
    const planExpiresAt =
      plan === "free"
        ? null
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await updateUserPlan(user.id, plan, planExpiresAt);

    return jsonSuccess({
      success: true,
      plan,
      planExpiresAt: planExpiresAt?.toISOString() ?? null,
    });
  } catch (error) {
    return handleRouteError(error, "Falha ao simular upgrade de plano");
  }
}
