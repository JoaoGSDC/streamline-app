import {
  Streamer,
  Game,
  ScheduledStream,
  LoginFormData,
  SignupFormData,
  GameFormData,
} from "@/types";
import { STORAGE_KEYS, ERROR_MESSAGES } from "@/constants";

export class StorageService {
  static get<T>(key: string): T | null {
    if (typeof window === "undefined") return null;

    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : null;
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return null;
    }
  }

  static set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting ${key} to localStorage:`, error);
    }
  }

  static remove(key: string): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  }

  static clear(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  }
}

export class StreamerService {
  static getAll(): Streamer[] {
    return StorageService.get<Streamer[]>(STORAGE_KEYS.STREAMERS) || [];
  }

  static getById(id: string): Streamer | null {
    const streamers = this.getAll();
    return streamers.find((streamer) => streamer.id === id) || null;
  }

  static getByUsername(username: string): Streamer | null {
    const streamers = this.getAll();
    return streamers.find((streamer) => streamer.twitchUsername === username) || null;
  }

  static getCurrent(): Streamer | null {
    return StorageService.get<Streamer>(STORAGE_KEYS.CURRENT_STREAMER);
  }

  static setCurrent(streamer: Streamer): void {
    StorageService.set(STORAGE_KEYS.CURRENT_STREAMER, streamer);
  }

  static removeCurrent(): void {
    StorageService.remove(STORAGE_KEYS.CURRENT_STREAMER);

    const current = StorageService.get<Streamer>(STORAGE_KEYS.CURRENT_STREAMER);
    if (!current) return;

    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_STREAMER);
    } catch (error) {
      console.error("Failed to remove current streamer:", error);
    }
  }

  static create(streamerData: SignupFormData): Streamer {
    const streamers = this.getAll();

    const existingStreamer = streamers.find(
      (streamer) => streamer.twitchUsername === streamerData.twitchUsername
    );
    if (existingStreamer) {
      throw new Error(ERROR_MESSAGES.USERNAME_EXISTS);
    }

    const newStreamer: Streamer = {
      id: Date.now().toString(),
      name: streamerData.name,
      twitchUsername: streamerData.twitchUsername,
      bio: streamerData.bio,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${streamerData.twitchUsername}`,
      twitchUrl: `https://twitch.tv/${streamerData.twitchUsername}`,
      followers: "0",
      createdAt: new Date(),
    };

    streamers.push(newStreamer);
    StorageService.set(STORAGE_KEYS.STREAMERS, streamers);

    return newStreamer;
  }

  static authenticate(credentials: LoginFormData): Streamer | null {
    const streamers = this.getAll();
    const matchedStreamer = streamers.find(
      (streamer) => streamer.twitchUsername === credentials.twitchUsername
    );

    if (!matchedStreamer) {
      throw new Error(ERROR_MESSAGES.LOGIN_FAILED);
    }

    return matchedStreamer;
  }
}

export class GameService {
  static getAll(): Game[] {
    return StorageService.get<Game[]>(STORAGE_KEYS.GAMES) || [];
  }

  static getById(id: string): Game | null {
    const games = this.getAll();
    return games.find((game) => game.id === id) || null;
  }

  static getByStreamerId(streamerId: string): Game[] {
    const games = this.getAll();
    return games.filter((game) => game.streamerId === streamerId);
  }

  static create(gameData: GameFormData, streamerId: string): Game {
    const games = this.getAll();

    const newGame: Game = {
      id: Date.now().toString(),
      title: gameData.title,
      image: gameData.image,
      synopsis: gameData.synopsis,
      genre: gameData.genre.split(",").map((genre) => genre.trim()),
      platform: gameData.platform,
      storeLinks: [],
      streamerId,
      createdAt: new Date(),
    };

    games.push(newGame);
    StorageService.set(STORAGE_KEYS.GAMES, games);

    return newGame;
  }

  static delete(id: string): void {
    const games = this.getAll();
    const updatedGames = games.filter((game) => game.id !== id);
    StorageService.set(STORAGE_KEYS.GAMES, updatedGames);
  }
}

export class ScheduledStreamService {
  static getAll(): ScheduledStream[] {
    return (
      StorageService.get<ScheduledStream[]>(STORAGE_KEYS.SCHEDULED_STREAMS) ||
      []
    );
  }

  static getById(id: string): ScheduledStream | null {
    const streams = this.getAll();
    return streams.find((stream) => stream.id === id) || null;
  }

  static getByStreamerId(streamerId: string): ScheduledStream[] {
    const streams = this.getAll();
    return streams.filter((stream) => stream.streamerId === streamerId);
  }

  static create(streamPayload: Partial<ScheduledStream>): ScheduledStream {
    const streams = this.getAll();

    const newStream: ScheduledStream = {
      id: Date.now().toString(),
      streamerId: streamPayload.streamerId!,
      gameId: streamPayload.gameId!,
      scheduledDate: streamPayload.scheduledDate!,
      scheduledTime: streamPayload.scheduledTime!,
      duration: streamPayload.duration!,
      links: streamPayload.links || [],
      notes: streamPayload.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    streams.push(newStream);
    StorageService.set(STORAGE_KEYS.SCHEDULED_STREAMS, streams);

    return newStream;
  }

  static delete(id: string): void {
    const streams = this.getAll();
    const updatedStreams = streams.filter((stream) => stream.id !== id);
    StorageService.set(STORAGE_KEYS.SCHEDULED_STREAMS, updatedStreams);
  }
}
