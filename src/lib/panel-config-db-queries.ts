import { eq } from "drizzle-orm";
import { db } from "./db";
import { userPanelConfig } from "./schema";
import {
  compactOverrides,
  resolvePanelConfigForStreamer,
  type ResolvedPanelConfig,
} from "@server/panel/resolve-panel-config";

function parseOverrides(raw: string | null | undefined): Record<string, boolean> {
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "boolean") result[key] = value;
    }
    return result;
  } catch {
    return {};
  }
}

export async function getUserPanelOverrides(
  userId: string
): Promise<Record<string, boolean>> {
  const [row] = await db
    .select()
    .from(userPanelConfig)
    .where(eq(userPanelConfig.userId, userId))
    .limit(1);

  return parseOverrides(row?.overrides);
}

export async function getResolvedPanelConfigForStreamer(
  streamerId: string
): Promise<ResolvedPanelConfig> {
  const overrides = await getUserPanelOverrides(streamerId);
  return resolvePanelConfigForStreamer(streamerId, overrides);
}

export async function updateUserPanelOverrides(
  userId: string,
  mergedUserChoices: Record<string, boolean>
): Promise<ResolvedPanelConfig> {
  const compact = compactOverrides(mergedUserChoices);
  const now = new Date();

  const [existing] = await db
    .select()
    .from(userPanelConfig)
    .where(eq(userPanelConfig.userId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(userPanelConfig)
      .set({
        overrides: JSON.stringify(compact),
        updatedAt: now,
      })
      .where(eq(userPanelConfig.userId, userId));
  } else {
    await db.insert(userPanelConfig).values({
      userId,
      overrides: JSON.stringify(compact),
      updatedAt: now,
    });
  }

  return resolvePanelConfigForStreamer(userId, compact);
}

export async function upsertUserPanelOverrides(
  userId: string,
  compactOverrides: Record<string, boolean>
): Promise<void> {
  const now = new Date();

  const [existing] = await db
    .select()
    .from(userPanelConfig)
    .where(eq(userPanelConfig.userId, userId))
    .limit(1);

  const payload = JSON.stringify(compactOverrides);

  if (existing) {
    await db
      .update(userPanelConfig)
      .set({
        overrides: payload,
        updatedAt: now,
      })
      .where(eq(userPanelConfig.userId, userId));
  } else {
    await db.insert(userPanelConfig).values({
      userId,
      overrides: payload,
      updatedAt: now,
    });
  }
}

/** @deprecated Use updateUserPanelOverrides */
export const updateStreamerPanelOverrides = updateUserPanelOverrides;

/** @deprecated Use getUserPanelOverrides */
export const getStreamerPanelOverrides = getUserPanelOverrides;
