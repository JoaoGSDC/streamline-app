import { NextRequest } from "next/server";
import { resolveActingStreamerId } from "@lib/admin-auth";
import {
  createStoreCategory,
  createStoreProduct,
  createStoreRedemption,
  deleteStoreCategory,
  duplicateStoreProduct,
  exportStoreRedemptionsCsv,
  getPublicStoreCatalog,
  getPublicStoreBalance,
  getStoreConfig,
  getStoreDashboard,
  getStoreProductById,
  listStoreCategories,
  listStoreProducts,
  listStoreRedemptions,
  refundStoreRedemption,
  reorderStoreCategories,
  updateStoreCategory,
  updateStoreConfig,
  updateStoreProduct,
  updateStoreRedemptionStatus,
} from "@lib/store-db-queries";
import {
  createStoreCategorySchema,
  createStoreProductSchema,
  formatStoreZodError,
  publicRedeemSchema,
  refundRedemptionSchema,
  reorderStoreCategoriesSchema,
  updateRedemptionStatusSchema,
  updateStoreCategorySchema,
  updateStoreConfigSchema,
  updateStoreProductSchema,
} from "@server/store/store.validators";
import { handleRouteError, jsonError, jsonSuccess } from "@api/shared/api-response";
import { createRandomString } from "@utils/factories/create-random-string";

function actorFromUser(user: { id: string; twitchUsername?: string; name?: string }) {
  return {
    userId: user.id,
    username: user.twitchUsername ?? user.name ?? user.id,
  };
}

async function resolveStoreManager(request: NextRequest, bodyStreamerId?: string | null) {
  return resolveActingStreamerId(request, bodyStreamerId);
}

export async function getStoreDashboardController(request: NextRequest) {
  try {
    const resolved = await resolveStoreManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const dashboard = await getStoreDashboard(resolved.streamerId);
    return jsonSuccess(dashboard);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar dashboard da loja");
  }
}

export async function getStoreConfigController(request: NextRequest) {
  try {
    const resolved = await resolveStoreManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const config = await getStoreConfig(resolved.streamerId);
    return jsonSuccess(config);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar configurações");
  }
}

export async function patchStoreConfigController(request: NextRequest) {
  try {
    const resolved = await resolveStoreManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const body = await request.json();
    const parsed = updateStoreConfigSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatStoreZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const config = await updateStoreConfig(
      resolved.streamerId,
      parsed.data,
      actorFromUser(resolved.user)
    );
    return jsonSuccess(config);
  } catch (error) {
    return handleRouteError(error, "Falha ao atualizar configurações");
  }
}

export async function listStoreCategoriesController(request: NextRequest) {
  try {
    const resolved = await resolveStoreManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const items = await listStoreCategories(resolved.streamerId);
    return jsonSuccess({ items });
  } catch (error) {
    return handleRouteError(error, "Falha ao listar categorias");
  }
}

export async function createStoreCategoryController(request: NextRequest) {
  try {
    const resolved = await resolveStoreManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const body = await request.json();
    const parsed = createStoreCategorySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatStoreZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const category = await createStoreCategory(
      resolved.streamerId,
      { id: createRandomString(12), ...parsed.data },
      actorFromUser(resolved.user)
    );
    return jsonSuccess(category, 201);
  } catch (error) {
    return handleRouteError(error, "Falha ao criar categoria");
  }
}

export async function patchStoreCategoryController(
  request: NextRequest,
  categoryId: string
) {
  try {
    const resolved = await resolveStoreManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const body = await request.json();
    const parsed = updateStoreCategorySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatStoreZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const category = await updateStoreCategory(
      resolved.streamerId,
      categoryId,
      parsed.data,
      actorFromUser(resolved.user)
    );
    return jsonSuccess(category);
  } catch (error) {
    return handleRouteError(error, "Falha ao atualizar categoria");
  }
}

export async function deleteStoreCategoryController(
  request: NextRequest,
  categoryId: string
) {
  try {
    const resolved = await resolveStoreManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    await deleteStoreCategory(
      resolved.streamerId,
      categoryId,
      actorFromUser(resolved.user)
    );
    return jsonSuccess({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Falha ao remover categoria");
  }
}

export async function reorderStoreCategoriesController(request: NextRequest) {
  try {
    const resolved = await resolveStoreManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const body = await request.json();
    const parsed = reorderStoreCategoriesSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatStoreZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    await reorderStoreCategories(
      resolved.streamerId,
      parsed.data.orderedIds,
      actorFromUser(resolved.user)
    );
    return jsonSuccess({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Falha ao reordenar categorias");
  }
}

export async function listStoreProductsController(request: NextRequest) {
  try {
    const resolved = await resolveStoreManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const sp = request.nextUrl.searchParams;
    const result = await listStoreProducts(resolved.streamerId, {
      search: sp.get("search") ?? undefined,
      categoryId: sp.get("categoryId") ?? undefined,
      status: (sp.get("status") as never) ?? undefined,
      page: parseInt(sp.get("page") ?? "1", 10),
      limit: parseInt(sp.get("limit") ?? "20", 10),
      includeArchived: sp.get("includeArchived") === "1",
    });
    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, "Falha ao listar produtos");
  }
}

export async function getStoreProductController(
  request: NextRequest,
  productId: string
) {
  try {
    const resolved = await resolveStoreManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const product = await getStoreProductById(resolved.streamerId, productId);
    if (!product) return jsonError("Produto não encontrado", 404, "NOT_FOUND");
    return jsonSuccess(product);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar produto");
  }
}

export async function createStoreProductController(request: NextRequest) {
  try {
    const resolved = await resolveStoreManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const body = await request.json();
    const parsed = createStoreProductSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatStoreZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const product = await createStoreProduct(
      resolved.streamerId,
      { id: createRandomString(12), ...parsed.data },
      actorFromUser(resolved.user)
    );
    return jsonSuccess(product, 201);
  } catch (error) {
    return handleRouteError(error, "Falha ao criar produto");
  }
}

export async function patchStoreProductController(
  request: NextRequest,
  productId: string
) {
  try {
    const resolved = await resolveStoreManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const body = await request.json();
    const parsed = updateStoreProductSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatStoreZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const product = await updateStoreProduct(
      resolved.streamerId,
      productId,
      parsed.data,
      actorFromUser(resolved.user)
    );
    return jsonSuccess(product);
  } catch (error) {
    return handleRouteError(error, "Falha ao atualizar produto");
  }
}

export async function duplicateStoreProductController(
  request: NextRequest,
  productId: string
) {
  try {
    const resolved = await resolveStoreManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const product = await duplicateStoreProduct(
      resolved.streamerId,
      productId,
      createRandomString(12),
      actorFromUser(resolved.user)
    );
    return jsonSuccess(product, 201);
  } catch (error) {
    return handleRouteError(error, "Falha ao duplicar produto");
  }
}

export async function listStoreRedemptionsController(request: NextRequest) {
  try {
    const resolved = await resolveStoreManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const sp = request.nextUrl.searchParams;
    if (sp.get("export") === "csv") {
      const csv = await exportStoreRedemptionsCsv(resolved.streamerId);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=resgates.csv",
        },
      });
    }

    const result = await listStoreRedemptions(resolved.streamerId, {
      search: sp.get("search") ?? undefined,
      status: (sp.get("status") as never) ?? undefined,
      productId: sp.get("productId") ?? undefined,
      page: parseInt(sp.get("page") ?? "1", 10),
      limit: parseInt(sp.get("limit") ?? "20", 10),
    });
    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, "Falha ao listar resgates");
  }
}

export async function patchStoreRedemptionController(
  request: NextRequest,
  redemptionId: string
) {
  try {
    const resolved = await resolveStoreManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const body = await request.json();
    const parsed = updateRedemptionStatusSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatStoreZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const redemption = await updateStoreRedemptionStatus(
      resolved.streamerId,
      redemptionId,
      parsed.data,
      actorFromUser(resolved.user)
    );
    return jsonSuccess(redemption);
  } catch (error) {
    return handleRouteError(error, "Falha ao atualizar resgate");
  }
}

export async function postRefundRedemptionController(
  request: NextRequest,
  redemptionId: string
) {
  try {
    const resolved = await resolveStoreManager(request);
    if ("error" in resolved) return jsonError(resolved.error, resolved.status);

    const body = await request.json();
    const parsed = refundRedemptionSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatStoreZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const redemption = await refundStoreRedemption(
      resolved.streamerId,
      redemptionId,
      parsed.data,
      actorFromUser(resolved.user)
    );
    return jsonSuccess(redemption);
  } catch (error) {
    return handleRouteError(error, "Falha ao reembolsar resgate");
  }
}

export async function getPublicStoreController(
  _request: NextRequest,
  username: string
) {
  try {
    const catalog = await getPublicStoreCatalog(username);
    if (!catalog) return jsonError("Loja não encontrada", 404, "NOT_FOUND");
    return jsonSuccess(catalog);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar loja pública");
  }
}

export async function getPublicStoreBalanceController(
  request: NextRequest,
  username: string
) {
  try {
    const { parseSessionUser } = await import("@lib/admin-auth");
    const user = parseSessionUser(request);
    const balance = await getPublicStoreBalance(username, user?.id ?? null);
    if (!balance) return jsonError("Loja não encontrada", 404, "NOT_FOUND");
    return jsonSuccess(balance);
  } catch (error) {
    return handleRouteError(error, "Falha ao carregar saldo");
  }
}

export async function postPublicRedeemController(
  request: NextRequest,
  username: string
) {
  try {
    const { parseSessionUser } = await import("@lib/admin-auth");
    const user = parseSessionUser(request);
    if (!user) {
      return jsonError("Faça login para resgatar", 401, "UNAUTHORIZED");
    }

    const catalog = await getPublicStoreCatalog(username);
    if (!catalog?.config.enabled) {
      return jsonError("Loja indisponível", 403, "STORE_DISABLED");
    }

    const body = await request.json();
    const parsed = publicRedeemSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(formatStoreZodError(parsed.error), 400, "VALIDATION_ERROR");
    }

    const redemption = await createStoreRedemption({
      id: createRandomString(16),
      streamerId: catalog.streamer.id,
      productId: parsed.data.productId,
      twitchUserId: user.id,
      twitchUsername: user.twitchUsername ?? user.id,
      displayName: user.name ?? user.twitchUsername ?? "Viewer",
      payWith: parsed.data.payWith,
      idempotencyKey: parsed.data.idempotencyKey,
      actorUserId: user.id,
      actorUsername: user.twitchUsername ?? user.name ?? user.id,
    });

    return jsonSuccess(redemption, 201);
  } catch (error) {
    return handleRouteError(error, "Falha ao resgatar produto");
  }
}
