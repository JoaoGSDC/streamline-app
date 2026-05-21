export interface StoreLinkMatch {
  name: string;
  match: RegExp;
}

export interface ExtractedLink {
  name: string;
  url: string;
}

const DEFAULT_STORE_MATCHERS: StoreLinkMatch[] = [
  { name: "Steam", match: /store\.steampowered\.com/i },
  { name: "Epic Games", match: /(^|\.)epicgames\.com/i },
  { name: "GOG", match: /(^|\.)gog\.com/i },
  { name: "PlayStation", match: /store\.playstation\.com/i },
  { name: "Xbox", match: /(^|\.)xbox\.com|(^|\.)microsoft\.com\/store/i },
  { name: "Nintendo", match: /(^|\.)nintendo\.com|(^|\.)nintendo\.co\./i },
  { name: "Battle.net", match: /(^|\.)battle\.net/i },
  { name: "EA", match: /(^|\.)ea\.com|(^|\.)origin\.com/i },
  { name: "Ubisoft", match: /(^|\.)ubisoft\.com|(^|\.)ubi\.com/i },
  { name: "Riot Games", match: /(^|\.)riotgames\.com|(^|\.)leagueoflegends\.com/i },
];

const DEFAULT_HOST_BLACKLIST: RegExp[] = [
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

const DEFAULT_URL_BLACKLIST: RegExp[] = [/\bwiki\b/i];

export function createStoreLinkExtractor(options?: {
  storeMatchers?: StoreLinkMatch[];
  hostBlacklist?: RegExp[];
  urlBlacklist?: RegExp[];
}) {
  const storeMatchers = options?.storeMatchers ?? DEFAULT_STORE_MATCHERS;
  const hostBlacklist = options?.hostBlacklist ?? DEFAULT_HOST_BLACKLIST;
  const urlBlacklist = options?.urlBlacklist ?? DEFAULT_URL_BLACKLIST;

  return function extractStoreLinks(
    rawUrls: string[],
    gameName?: string
  ): ExtractedLink[] {
    const normalizedGameName = (gameName ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");

    const officialLinks: ExtractedLink[] = [];
    const storeLinks: ExtractedLink[] = [];

    for (const rawUrl of rawUrls) {
      const absoluteUrl = rawUrl.startsWith("http")
        ? rawUrl
        : `https://${rawUrl.replace(/^\/+/, "")}`;

      let hostname = "";
      try {
        hostname = new URL(absoluteUrl).hostname.toLowerCase();
      } catch {
        continue;
      }

      if (hostBlacklist.some((pattern) => pattern.test(hostname))) continue;
      if (urlBlacklist.some((pattern) => pattern.test(absoluteUrl))) continue;

      const matchedStore = storeMatchers.find((matcher) =>
        matcher.match.test(hostname)
      );

      if (matchedStore) {
        if (!storeLinks.some((link) => link.url === absoluteUrl)) {
          storeLinks.push({ name: matchedStore.name, url: absoluteUrl });
        }
        continue;
      }

      if (
        normalizedGameName &&
        hostname.replace(/[^a-z0-9]/g, "").includes(normalizedGameName)
      ) {
        if (!officialLinks.some((link) => link.url === absoluteUrl)) {
          officialLinks.push({ name: "Site Oficial", url: absoluteUrl });
        }
      }
    }

    return [...officialLinks, ...storeLinks];
  };
}
