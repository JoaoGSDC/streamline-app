import axios from "axios";

const IGDB_BASE_URL = "https://api.igdb.com/v4";

export const igdbClient = axios.create({
  baseURL: IGDB_BASE_URL,
  headers: {
    "Client-ID": process.env.NEXT_PUBLIC_IGDB_CLIENT_ID || "",
    Authorization: `Bearer ${process.env.IGDB_ACCESS_TOKEN || ""}`,
    "Content-Type": "text/plain",
  },
});

interface GameInfo {
  id: number;
  name: string;
  cover?: {
    url: string;
  };
  screenshots?: Array<{ url: string }>;
  summary?: string;
  genres?: Array<{ name: string }>;
  platforms?: Array<{ name: string }>;
  release_dates?: Array<{ date: number }>;
  websites?: Array<{ url: string }>;
  videos?: Array<{ video_id: string }>;
}

export const searchGames = async (
  query: string,
  limit: number = 10
): Promise<any[]> => {
  try {
    const response = await igdbClient.post(
      "/games",
      `search "${query}"; fields id,name,cover.url,screenshots.url,summary,genres.name,platforms.name,websites.url; limit ${limit};`
    );
    return response.data;
  } catch (error) {
    console.error("Error searching games:", error);
    return [];
  }
};

export const getGameById = async (id: number): Promise<any> => {
  try {
    const response = await igdbClient.post(
      "/games",
      `fields id,name,cover.url,screenshots.url,summary,genres.name,platforms.name,release_dates.date,websites.url,videos.video_id; where id = ${id};`
    );
    return response.data[0];
  } catch (error) {
    console.error("Error fetching game:", error);
    return null;
  }
};

export const getGameDetails = async (id: number): Promise<any> => {
  try {
    const game = await getGameById(id);
    if (!game) return null;

    // Buscar imagens de cover em tamanho maior
    const coverUrl = game.cover?.url
      ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
      : null;

    const websites: string[] = (game.websites || [])
      .map((w: any) => (typeof w?.url === "string" ? w.url : ""))
      .filter(Boolean);

    const extractStoreLinks = (urls: string[], gameName?: string) => {
      const storeMatchers: Array<{ name: string; match: RegExp }> = [
        { name: "Steam", match: /store\.steampowered\.com/i },
        { name: "Epic Games", match: /(^|\.)epicgames\.com/i },
        { name: "GOG", match: /(^|\.)gog\.com/i },
        { name: "PlayStation", match: /store\.playstation\.com/i },
        { name: "Xbox", match: /(^|\.)xbox\.com|(^|\.)microsoft\.com\/store/i },
        { name: "Nintendo", match: /(^|\.)nintendo\.com|(^|\.)nintendo\.co\./i },
        { name: "Battle\.net", match: /(^|\.)battle\.net/i },
        { name: "EA", match: /(^|\.)ea\.com|(^|\.)origin\.com/i },
        { name: "Ubisoft", match: /(^|\.)ubisoft\.com|(^|\.)ubi\.com/i },
        { name: "Riot Games", match: /(^|\.)riotgames\.com|(^|\.)leagueoflegends\.com/i },
      ];

      const blacklistHost: RegExp[] = [
        /wikipedia\.org/i,
        /fandom\.com/i,
        /twitter\.com|x\.com/i,
        /youtube\.com|youtu\.be/i,
        /discord\.gg|discord\.com/i,
        /reddit\.com/i,
        /facebook\.com/i,
        /instagram\.com/i,
        /twitch\.tv/i,
      ];
      const blacklistUrl: RegExp[] = [
        /\bwiki\b/i,
      ];

      const normName = (gameName || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

      const official: Array<{ name: string; url: string }> = [];
      const stores: Array<{ name: string; url: string }> = [];

      for (const raw of urls) {
        const url = raw.startsWith("http") ? raw : `https://${raw.replace(/^\/+/, "")}`;
        let host = "";
        try {
          host = new URL(url).hostname.toLowerCase();
        } catch {
          continue;
        }

        if (blacklistHost.some((rx) => rx.test(host))) continue;
        if (blacklistUrl.some((rx) => rx.test(url))) continue;

        const store = storeMatchers.find((k) => k.match.test(host));
        if (store) {
          if (!stores.some((s) => s.url === url)) stores.push({ name: store.name, url });
          continue;
        }

        if (normName && host.replace(/[^a-z0-9]/g, "").includes(normName)) {
          if (!official.some((o) => o.url === url)) official.push({ name: "Site Oficial", url });
        }
      }

      // Priorizar site oficial e depois lojas
      return [...official, ...stores];
    };

    const storeLinks = extractStoreLinks(websites, game.name);

    return {
      id: game.id,
      title: game.name,
      image:
        coverUrl ||
        "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80",
      synopsis: game.summary || "",
      genre: game.genres?.map((g: any) => g.name) || [],
      platform: game.platforms?.map((p: any) => p.name).join(", ") || "",
      releaseDate: game.release_dates?.[0]?.date
        ? new Date(game.release_dates[0].date * 1000).toLocaleDateString()
        : "",
      website: game.websites?.[0]?.url || "",
      storeLinks,
      websites,
    };
  } catch (error) {
    console.error("Error getting game details:", error);
    return null;
  }
};

export const formatGameImageUrl = (url: string): string => {
  if (!url) return "";
  // IGDB usa formatos específicos, removendo '//' se necessário
  return url.startsWith("//") ? `https:${url}` : `https://${url}`;
};
