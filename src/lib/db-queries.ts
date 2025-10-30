import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "./db";
import { scheduledStreams, games, streamers, streamerGames } from "./schema";

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
}) {
  const result = await db
    .insert(streamers)
    .values({
      ...data,
      createdAt: new Date(),
    })
    .returning();
  return result[0];
}

export async function getStreamerById(id: string) {
  const result = await db
    .select()
    .from(streamers)
    .where(eq(streamers.id, id))
    .limit(1);
  return result[0];
}

export async function getStreamerByTwitchId(twitchId: string) {
  const result = await db
    .select()
    .from(streamers)
    .where(eq(streamers.twitchId, twitchId))
    .limit(1);
  return result[0];
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
  return rows.map((row: any) => ({
    ...row.streamer_games,
    game: row.games
      ? {
          ...row.games,
          genre: JSON.parse(row.games.genre || "[]"),
          storeLinks: JSON.parse(row.games.storeLinks || "[]"),
        }
      : null,
  }));
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

export async function deleteStreamerGame(id: string) {
  await db.delete(streamerGames).where(eq(streamerGames.id, id));
}
