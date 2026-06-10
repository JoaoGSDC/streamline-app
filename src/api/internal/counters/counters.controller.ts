import { NextRequest } from "next/server";
import { resolveActingStreamerId } from "@lib/admin-auth";
import {
  adjustCounter,
  archiveCounter,
  createCounter,
  createCounterCategory,
  deleteCounter,
  duplicateCounter,
  getCounterById,
  getCountersConfig,
  getCountersDashboard,
  listCounterCategories,
  listCounterHistory,
  listCounters,
  updateCounter,
  updateCountersConfig,
} from "@lib/counters-db-queries";
import {
  adjustCounterSchema,
  createCounterCategorySchema,
  createCounterSchema,
  formatCountersZodError,
  updateCounterSchema,
  updateCountersConfigSchema,
} from "@server/counters/counters.validators";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";
import { createRandomString } from "@utils/factories/create-random-string";

async function resolveManager(request: NextRequest, bodyStreamerId?: string | null) {
  return resolveActingStreamerId(request, bodyStreamerId);
}

function actorFromUser(user: { id: string; twitchUsername?: string; name?: string }) {
  return {
    userId: user.id,
    username: user.twitchUsername ?? user.name ?? user.id,
    displayName: user.name ?? user.twitchUsername ?? user.id,
  };
}

export async function getCountersDashboardController(request: NextRequest) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const dashboard = await getCountersDashboard(resolved.streamerId);
    return jsonSuccess(dashboard);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar dashboard de contadores");
  }
}

export async function getCountersConfigController(request: NextRequest) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const config = await getCountersConfig(resolved.streamerId);
    return jsonSuccess(config);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar configurações de contadores");
  }
}

export async function patchCountersConfigController(request: NextRequest) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const body = await request.json();
    const parsed = updateCountersConfigSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatCountersZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const config = await updateCountersConfig(resolved.streamerId, parsed.data);
    return jsonSuccess(config);
  } catch (error) {
    return handleRouteError(error, "Falha ao atualizar configurações de contadores");
  }
}

export async function listCountersController(request: NextRequest) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const { searchParams } = new URL(request.url);
    const result = await listCounters(resolved.streamerId, {
      q: searchParams.get("q") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      status: (searchParams.get("status") as "active" | "archived") ?? undefined,
      tag: searchParams.get("tag") ?? undefined,
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, "Falha ao listar contadores");
  }
}

export async function getCounterController(request: NextRequest, counterId: string) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const counter = await getCounterById(resolved.streamerId, counterId);
    if (!counter) return jsonError("Contador não encontrado", 404);
    return jsonSuccess(counter);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar contador");
  }
}

export async function createCounterController(request: NextRequest) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const body = await request.json();
    const parsed = createCounterSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatCountersZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const counter = await createCounter({
      id: createRandomString(16),
      streamerId: resolved.streamerId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      type: parsed.data.type,
      value: parsed.data.value,
      minValue: parsed.data.minValue,
      maxValue: parsed.data.maxValue,
      goalValue: parsed.data.goalValue,
      color: parsed.data.color,
      icon: parsed.data.icon,
      emoji: parsed.data.emoji,
      categoryId: parsed.data.categoryId,
      tags: parsed.data.tags,
      resetPolicy: parsed.data.resetPolicy,
      overlayConfig: parsed.data.overlayConfig,
    });

    return jsonSuccess(counter, 201);
  } catch (error) {
    return handleRouteError(error, "Falha ao criar contador");
  }
}

export async function patchCounterController(request: NextRequest, counterId: string) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const body = await request.json();
    const parsed = updateCounterSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatCountersZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const counter = await updateCounter(resolved.streamerId, counterId, parsed.data);
    return jsonSuccess(counter);
  } catch (error) {
    return handleRouteError(error, "Falha ao atualizar contador");
  }
}

export async function adjustCounterController(request: NextRequest, counterId: string) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const body = await request.json();
    const parsed = adjustCounterSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatCountersZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const actor = actorFromUser(resolved.user);
    const counter = await adjustCounter(
      resolved.streamerId,
      counterId,
      parsed.data.operation,
      {
        amount: parsed.data.amount,
        source: parsed.data.source ?? "panel",
        actorUserId: actor.userId,
        actorUsername: actor.username,
        actorDisplayName: actor.displayName,
      }
    );

    return jsonSuccess(counter);
  } catch (error) {
    return handleRouteError(error, "Falha ao ajustar contador");
  }
}

export async function archiveCounterController(request: NextRequest, counterId: string) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const counter = await archiveCounter(resolved.streamerId, counterId);
    return jsonSuccess(counter);
  } catch (error) {
    return handleRouteError(error, "Falha ao arquivar contador");
  }
}

export async function deleteCounterController(request: NextRequest, counterId: string) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    await deleteCounter(resolved.streamerId, counterId);
    return jsonSuccess({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Falha ao excluir contador");
  }
}

export async function duplicateCounterController(request: NextRequest, counterId: string) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const counter = await duplicateCounter(
      resolved.streamerId,
      counterId,
      createRandomString(16)
    );
    return jsonSuccess(counter, 201);
  } catch (error) {
    return handleRouteError(error, "Falha ao duplicar contador");
  }
}

export async function listCounterHistoryController(request: NextRequest) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const { searchParams } = new URL(request.url);
    const history = await listCounterHistory(resolved.streamerId, {
      counterId: searchParams.get("counterId") ?? undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 50,
    });

    return jsonSuccess({ items: history });
  } catch (error) {
    return handleRouteError(error, "Falha ao listar histórico");
  }
}

export async function listCounterCategoriesController(request: NextRequest) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const result = await listCounterCategories(resolved.streamerId);
    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, "Falha ao listar categorias");
  }
}

export async function createCounterCategoryController(request: NextRequest) {
  try {
    const resolved = await resolveManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const body = await request.json();
    const parsed = createCounterCategorySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatCountersZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const category = await createCounterCategory(resolved.streamerId, parsed.data);
    return jsonSuccess(category, 201);
  } catch (error) {
    return handleRouteError(error, "Falha ao criar categoria");
  }
}
