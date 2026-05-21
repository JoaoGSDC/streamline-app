"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { services } from "@services";

export type StreamerProfileData = {
  id: string;
  name: string;
  twitchUsername: string;
  avatar: string;
  bio: string;
  twitchUrl: string;
  followers: string;
  accessToken?: string;
  broadcasterType?: string;
  partner: boolean;
  premium: boolean;
  createdAt?: string;
};

export type ScheduledGameItem = {
  id: string;
  title: string;
  image: string;
  scheduledTime: string;
  scheduledAt: number;
  duration?: string;
  platform: string;
  synopsis: string;
  streamUrl: string;
  website?: string;
  storeLinks: Array<{ name: string; url: string }>;
  notes?: string;
  igdbId: number | null;
  raw: unknown;
};

type StreamerProfileContextValue = {
  slug: string;
  streamer: StreamerProfileData | null;
  loadingStreamer: boolean;
  scheduleGames: ScheduledGameItem[];
  loadingSchedule: boolean;
  streamerGames: unknown[];
  setStreamerGames: React.Dispatch<React.SetStateAction<unknown[]>>;
  gamesFetching: boolean;
  setGamesFetching: React.Dispatch<React.SetStateAction<boolean>>;
  selectedGame: unknown | null;
  setSelectedGame: React.Dispatch<React.SetStateAction<unknown | null>>;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openGame: (game: unknown) => void;
};

const StreamerProfileContext = createContext<StreamerProfileContextValue | null>(
  null
);

export function useStreamerProfile() {
  const ctx = useContext(StreamerProfileContext);
  if (!ctx) {
    throw new Error("useStreamerProfile must be used within StreamerProfileProvider");
  }
  return ctx;
}

export function StreamerProfileProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const slug = (params?.slug as string) ?? "";
  const router = useRouter();

  const [streamer, setStreamer] = useState<StreamerProfileData | null>(null);
  const [loadingStreamer, setLoadingStreamer] = useState(true);
  const [scheduleGames, setScheduleGames] = useState<ScheduledGameItem[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [streamerGames, setStreamerGames] = useState<unknown[]>([]);
  const [gamesFetching, setGamesFetching] = useState(false);
  const [selectedGame, setSelectedGame] = useState<unknown | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openGame = useCallback((game: unknown) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !slug) return;

    const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID || "";
    const clientSecret = process.env.NEXT_PUBLIC_TWITCH_CLIENT_SECRET || "";

    if (!clientId || !clientSecret) {
      console.error("Twitch API credentials are missing.");
      router.push("/");
      return;
    }

    let cancelled = false;

    const fetchAccessToken = async (): Promise<string> => {
      const url = `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (!res.ok) throw new Error("Failed to obtain Twitch access token");
      const data = await res.json();
      return data.access_token;
    };

    const fetchStreamerBySlug = async (accessToken: string) => {
      const res = await fetch(
        `https://api.twitch.tv/helix/users?login=${encodeURIComponent(slug)}`,
        {
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch Twitch user");
      const data = await res.json();
      return data.data?.[0];
    };

    const load = async () => {
      setLoadingStreamer(true);
      setLoadingSchedule(true);

      try {
        const accessToken = await fetchAccessToken();
        const apiStreamer = await fetchStreamerBySlug(accessToken);
        if (!apiStreamer) throw new Error("Streamer not found");
        if (cancelled) return;

        let partner = false;
        let premium = false;

        try {
          const flags = await services.streamers.sync({
            twitchId: apiStreamer.id,
            twitchUsername: apiStreamer.login,
            name: apiStreamer.display_name || apiStreamer.login,
            avatar: apiStreamer.profile_image_url,
            bio: apiStreamer.description || "",
            twitchUrl: `https://twitch.tv/${apiStreamer.login}`,
            followers: "",
          });
          partner = Boolean(flags.partner);
          premium = Boolean(flags.premium);
        } catch {
          /* ignore */
        }

        const normalizedStreamer: StreamerProfileData = {
          id: apiStreamer.id,
          name: apiStreamer.display_name || apiStreamer.login,
          twitchUsername: apiStreamer.login,
          avatar: apiStreamer.profile_image_url,
          bio: apiStreamer.description || "",
          twitchUrl: `https://twitch.tv/${apiStreamer.login}`,
          followers: "",
          accessToken,
          broadcasterType: apiStreamer.broadcaster_type,
          partner,
          premium,
          createdAt: apiStreamer.created_at,
        };

        setStreamer(normalizedStreamer);

        const [streams, sgdata] = await Promise.allSettled([
          services.scheduledStreams.findAll.byStreamerId(normalizedStreamer.id),
          services.streamerGames.findAll.byParams({
            streamerId: normalizedStreamer.id,
          }),
        ]);

        if (cancelled) return;

        if (streams.status === "fulfilled") {
          const streamRecords = Array.isArray(streams.value) ? streams.value : [];
          const baseMapped = streamRecords.map((streamRecord) => {
              const s = streamRecord as unknown as Record<string, unknown>;
              const game = s.game as Record<string, unknown> | undefined;
              const igdbId =
                (game?.igdbId as number) ||
                (s.igdbGameId as number) ||
                (s.igdb_game_id as number) ||
                null;
              const raw = (game?.image as string) || (s.gameImage as string) || null;
              const img = (() => {
                const fallback =
                  "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80";
                if (!raw) return fallback;
                const full = raw.startsWith("//") ? `https:${raw}` : raw;
                let url = full.replace("/t_thumb/", "/t_1080p/");
                if (url.endsWith(".jpg")) url = url.slice(0, -4) + ".png";
                return url || fallback;
              })();
              return {
                id: s.id as string,
                title: (game?.title as string) || (s.gameTitle as string) || "Jogo",
                image: img,
                scheduledTime: new Date(s.scheduledDate as string).toLocaleString(
                  "pt-BR",
                  {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                ),
                scheduledAt: new Date(s.scheduledDate as string).getTime(),
                duration: s.duration as string | undefined,
                platform: (game?.platform as string) || "",
                synopsis: (game?.synopsis as string) || (s.gameSynopsis as string) || "",
                streamUrl: `https://twitch.tv/${normalizedStreamer.twitchUsername}`,
                storeLinks:
                  (game?.storeLinks as Array<{ name: string; url: string }>) || [],
                notes: (s.notes as string) || undefined,
                igdbId,
                raw: s,
              } satisfies ScheduledGameItem;
            });
          setScheduleGames(
            baseMapped.sort((a, b) => a.scheduledAt - b.scheduledAt)
          );
        }

        if (sgdata.status === "fulfilled") {
          setStreamerGames(Array.isArray(sgdata.value) ? sgdata.value : []);
        } else {
          setStreamerGames([]);
        }
      } catch (err) {
        console.error("Failed to fetch streamer data:", err);
        if (!cancelled) router.push("/");
      } finally {
        if (!cancelled) {
          setLoadingStreamer(false);
          setLoadingSchedule(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [slug, router]);

  const value = useMemo(
    () => ({
      slug,
      streamer,
      loadingStreamer,
      scheduleGames,
      loadingSchedule,
      streamerGames,
      setStreamerGames,
      gamesFetching,
      setGamesFetching,
      selectedGame,
      setSelectedGame,
      isModalOpen,
      setIsModalOpen,
      openGame,
    }),
    [
      slug,
      streamer,
      loadingStreamer,
      scheduleGames,
      loadingSchedule,
      streamerGames,
      gamesFetching,
      selectedGame,
      isModalOpen,
      openGame,
    ]
  );

  return (
    <StreamerProfileContext.Provider value={value}>
      {children}
    </StreamerProfileContext.Provider>
  );
}
