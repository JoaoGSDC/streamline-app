import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "./db";
import {
  scheduledStreams,
  games,
  streamers,
  streamerGames,
  streamerModerators,
} from "./schema";

export type StreamerSocialLink = { label: string; url: string };

function parseStreamerRow(row: typeof streamers.$inferSelect) {
  let socialLinks: StreamerSocialLink[] = [];
  try {
    const parsed = JSON.parse(row.socialLinks || "[]");
    if (Array.isArray(parsed)) {
      socialLinks = parsed.filter(
        (l) => l && typeof l.label === "string" && typeof l.url === "string"
      );
    }
  } catch {
    socialLinks = [];
  }
  return {
    ...row,
    socialLinks,
    partner: Boolean(row.partner),
    premium: Boolean(row.premium),
  };
}

// ========== STREAMERS ==========
export async function createStreamer(data: {
  id: string;
  twitchId: string;
  name: string;
  twitchUsername: string;
  avatar?: string;
  bio?: string;
  twitchUrl?: string;
  followers?: string;
  partner?: boolean;
  premium?: boolean;
}) {
  const result = await db
    .insert(streamers)
    .values({
      ...data,
      partner: data.partner ?? false,
      premium: data.premium ?? false,
      createdAt: new Date(),
    })
    .returning();
  return result[0] ? parseStreamerRow(result[0]) : null;
}

export async function upsertStreamerFromTwitch(data: {
  id: string;
  twitchId: string;
  name: string;
  twitchUsername: string;
  avatar?: string;
  bio?: string;
  twitchUrl?: string;
  followers?: string;
}) {
  const existing = await getStreamerByTwitchId(data.twitchId);

  if (existing) {
    const result = await db
      .update(streamers)
      .set({
        name: data.name,
        twitchUsername: data.twitchUsername,
        avatar: data.avatar,
        bio: data.bio,
        twitchUrl: data.twitchUrl,
        followers: data.followers,
      })
      .where(eq(streamers.id, existing.id))
      .returning();
    return result[0] ? parseStreamerRow(result[0]) : existing;
  }

  return createStreamer({
    ...data,
    partner: false,
    premium: false,
  });
}

/** Partner inclui todos os benefícios premium */
export function hasPremiumAccess(streamer: {
  partner?: boolean;
  premium?: boolean;
}): boolean {
  return Boolean(streamer.partner || streamer.premium);
}

export async function getStreamerById(id: string) {
  const result = await db
    .select()
    .from(streamers)
    .where(eq(streamers.id, id))
    .limit(1);
  return result[0] ? parseStreamerRow(result[0]) : null;
}

export async function getStreamerByTwitchId(twitchId: string) {
  const result = await db
    .select()
    .from(streamers)
    .where(eq(streamers.twitchId, twitchId))
    .limit(1);
  return result[0] ? parseStreamerRow(result[0]) : null;
}

export async function getStreamerByUsername(username: string) {
  const result = await db
    .select()
    .from(streamers)
    .where(eq(streamers.twitchUsername, username))
    .limit(1);
  return result[0] ? parseStreamerRow(result[0]) : null;
}

export async function listPartnerStreamers(limit = 12) {
  const result = await db
    .select()
    .from(streamers)
    .where(eq(streamers.partner, true))
    .limit(limit);
  return result.map(parseStreamerRow);
}

/** Premium sem flag de parceiro (evita duplicar na seção premium). */
export async function listPremiumOnlyStreamers(limit = 12) {
  const result = await db
    .select()
    .from(streamers)
    .where(and(eq(streamers.premium, true), eq(streamers.partner, false)))
    .limit(limit);
  return result.map(parseStreamerRow);
}

export async function updateStreamerSocialLinks(
  streamerId: string,
  links: StreamerSocialLink[]
) {
  const sanitized = links
    .map((l) => ({
      label: l.label.trim(),
      url: l.url.trim(),
    }))
    .filter((l) => l.label && l.url);

  const result = await db
    .update(streamers)
    .set({ socialLinks: JSON.stringify(sanitized) })
    .where(eq(streamers.id, streamerId))
    .returning();
  return result[0] ? parseStreamerRow(result[0]) : null;
}

// ========== GAMES ==========
export async function createGame(data: {
  id: string;
  igdbId?: number;
  title: string;
  image?: string;
  synopsis?: string;
  genre?: string[];
  platform?: string;
  website?: string;
  storeLinks?: Array<{ name: string; url: string }>;
  isCustomGame?: boolean;
}) {
  const result = await db
    .insert(games)
    .values({
      ...data,
      genre: JSON.stringify(data.genre || []),
      storeLinks: JSON.stringify(data.storeLinks || []),
      createdAt: new Date(),
    })
    .returning();
  return result[0];
}

export async function getGameById(id: string) {
  const result = await db.select().from(games).where(eq(games.id, id)).limit(1);
  if (result[0]) {
    return {
      ...result[0],
      genre: JSON.parse(result[0].genre || "[]"),
      storeLinks: JSON.parse(result[0].storeLinks || "[]"),
    };
  }
  return null;
}

// ========== SCHEDULED STREAMS ==========
export async function createScheduledStream(data: {
  id: string;
  streamerId: string;
  gameId?: string | null;
  igdbGameId?: number | null;
  gameTitle?: string | null;
  gameImage?: string | null;
  gameSynopsis?: string | null;
  scheduledDate: Date;
  scheduledTime: string;
  duration: string;
  links?: Array<{ url: string; name?: string }>;
  notes?: string;
}) {
  const result = await db
    .insert(scheduledStreams)
    .values({
      ...data,
      links: JSON.stringify(data.links || []),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return result[0];
}

export async function getScheduledStreamsByStreamer(streamerId: string) {
  const result = await db
    .select()
    .from(scheduledStreams)
    .leftJoin(games, eq(scheduledStreams.gameId, games.id))
    .where(eq(scheduledStreams.streamerId, streamerId));

  const rows = Array.isArray(result) ? result : [result];

  return rows.map((row: any) => ({
    ...row.scheduled_streams,
    game: row.games
      ? {
          ...row.games,
          genre: JSON.parse(row.games.genre || "[]"),
          storeLinks: JSON.parse(row.games.storeLinks || "[]"),
        }
      : row.scheduled_streams?.game_title
      ? {
          id: null,
          igdbId: row.scheduled_streams.igdb_game_id,
          title: row.scheduled_streams.game_title,
          image: row.scheduled_streams.game_image,
          synopsis: row.scheduled_streams.game_synopsis,
        }
      : null,
    links: JSON.parse(row.scheduled_streams.links || "[]"),
  }));
}

export async function getScheduledStreamById(id: string) {
  const result = await db
    .select()
    .from(scheduledStreams)
    .where(eq(scheduledStreams.id, id))
    .leftJoin(games, eq(scheduledStreams.gameId, games.id))
    .limit(1);

  const row = result?.[0] as any;
  if (row) {
    const stream = row.scheduled_streams;
    const gameRow = row.games;
    return {
      ...stream,
      game: gameRow
        ? {
            ...gameRow,
            genre: JSON.parse(gameRow.genre || "[]"),
            storeLinks: JSON.parse(gameRow.storeLinks || "[]"),
          }
        : stream.gameTitle
        ? {
            id: null,
            igdbId: stream.igdbGameId,
            title: stream.gameTitle,
            image: stream.gameImage,
            synopsis: stream.gameSynopsis,
          }
        : null,
      links: JSON.parse(stream.links || "[]"),
    };
  }
  return null;
}

export async function deleteScheduledStream(id: string) {
  await db.delete(scheduledStreams).where(eq(scheduledStreams.id, id));
}

export async function updateScheduledStream(
  id: string,
  data: {
    scheduledDate?: Date;
    scheduledTime?: string;
    duration?: string;
    links?: Array<{ url: string; name?: string }>;
    notes?: string;
  }
) {
  await db
    .update(scheduledStreams)
    .set({
      ...data,
      links: data.links ? JSON.stringify(data.links) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(scheduledStreams.id, id));
}

// ========== STREAMER GAMES (to_play | playing | finished) ==========
export async function createStreamerGame(data: {
  id: string;
  streamerId: string;
  gameId?: string | null;
  customTitle?: string | null;
  customImage?: string | null;
  status: "to_play" | "playing" | "finished" | "dropped";
  startedAt?: Date | null;
  finishedAt?: Date | null;
  rating?: number | null;
  notes?: string | null;
  sortOrder?: number | null;
}) {
  const result = await db
    .insert(streamerGames)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return result[0];
}

export async function listStreamerGamesByStreamer(streamerId: string) {
  const result = await db
    .select()
    .from(streamerGames)
    .leftJoin(games, eq(streamerGames.gameId, games.id))
    .where(eq(streamerGames.streamerId, streamerId));

  const rows = Array.isArray(result) ? result : [result];
  return rows.map((row: any) => mapStreamerGameRow(row));
}

export async function updateStreamerGame(
  id: string,
  data: Partial<{
    gameId: string | null;
    customTitle: string | null;
    customImage: string | null;
    status: "to_play" | "playing" | "finished" | "dropped";
    startedAt: Date | null;
    finishedAt: Date | null;
    rating: number | null;
    notes: string | null;
    sortOrder: number | null;
  }>
) {
  await db
    .update(streamerGames)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(streamerGames.id, id));
}

export async function getStreamerGameById(id: string) {
  const result = await db
    .select()
    .from(streamerGames)
    .where(eq(streamerGames.id, id))
    .limit(1);
  return result[0] ?? null;
}

function mapStreamerGameRow(row: {
  streamer_games: (typeof streamerGames.$inferSelect);
  games: (typeof games.$inferSelect) | null;
}) {
  return {
    ...row.streamer_games,
    game: row.games
      ? {
          ...row.games,
          genre: JSON.parse(row.games.genre || "[]"),
          storeLinks: JSON.parse(row.games.storeLinks || "[]"),
        }
      : null,
  };
}

export async function getStreamerGameWithGameById(id: string) {
  const result = await db
    .select()
    .from(streamerGames)
    .leftJoin(games, eq(streamerGames.gameId, games.id))
    .where(eq(streamerGames.id, id))
    .limit(1);

  const row = result[0];
  if (!row) return null;
  return mapStreamerGameRow(row as Parameters<typeof mapStreamerGameRow>[0]);
}

export async function deleteStreamerGame(id: string) {
  await db.delete(streamerGames).where(eq(streamerGames.id, id));
}

// ========== MODERATORS ==========
export async function isModeratorForStreamer(
  moderatorId: string,
  streamerId: string
) {
  const result = await db
    .select()
    .from(streamerModerators)
    .where(
      and(
        eq(streamerModerators.moderatorId, moderatorId),
        eq(streamerModerators.streamerId, streamerId)
      )
    )
    .limit(1);
  return result.length > 0;
}

export async function listModeratorsForStreamer(streamerId: string) {
  try {
    return await db
      .select()
      .from(streamerModerators)
      .where(eq(streamerModerators.streamerId, streamerId));
  } catch (error) {
    console.error("listModeratorsForStreamer:", error);
    return [];
  }
}

export async function listModeratedStreamersForUser(moderatorId: string) {
  try {
    const assignments = await db
      .select()
      .from(streamerModerators)
      .where(eq(streamerModerators.moderatorId, moderatorId));

    const result = [];
    for (const assignment of assignments) {
      const streamer = await getStreamerById(assignment.streamerId);
      if (streamer) result.push(streamer);
    }
    return result;
  } catch (error) {
    console.error("listModeratedStreamersForUser:", error);
    return [];
  }
}

export async function addStreamerModerator(data: {
  id: string;
  streamerId: string;
  moderatorId: string;
  moderatorUsername: string;
}) {
  await db.insert(streamerModerators).values({
    ...data,
    createdAt: new Date(),
  });

  const row = await getModeratorAssignment(data.streamerId, data.moderatorId);
  if (!row) {
    throw new Error("Falha ao persistir moderador");
  }
  return row;
}

export async function removeStreamerModerator(
  streamerId: string,
  moderatorId: string
) {
  await db
    .delete(streamerModerators)
    .where(
      and(
        eq(streamerModerators.streamerId, streamerId),
        eq(streamerModerators.moderatorId, moderatorId)
      )
    );
}

export async function getModeratorAssignment(
  streamerId: string,
  moderatorId: string
) {
  const result = await db
    .select()
    .from(streamerModerators)
    .where(
      and(
        eq(streamerModerators.streamerId, streamerId),
        eq(streamerModerators.moderatorId, moderatorId)
      )
    )
    .limit(1);
  return result[0] ?? null;
}
