import { createIgdbCoverUrlFormatter } from "@utils/factories/create-image-url-formatter";
import { createStoreLinkExtractor } from "@utils/factories/create-store-link-extractor";
import type {
  IgdbGameDetailsDto,
  IgdbGameRaw,
  IgdbSearchResultDto,
} from "./igdb.types";

const formatCoverUrl = createIgdbCoverUrlFormatter();
const extractStoreLinks = createStoreLinkExtractor();

const FALLBACK_GAME_IMAGE =
  "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80";

export function mapIgdbSearchResults(games: IgdbGameRaw[]): IgdbSearchResultDto[] {
  return games.map((game) => {
    const releaseTimestamp = game.release_dates?.[0]?.date;
    const releaseYear = releaseTimestamp
      ? new Date(releaseTimestamp * 1000).getFullYear()
      : null;

    return {
      id: game.id,
      name: game.name,
      cover: game.cover,
      summary: game.summary,
      genres: game.genres?.map((genre) => genre.name),
      platforms: game.platforms?.map((platform) => platform.name),
      releaseYear,
    };
  });
}

export function mapIgdbGameDetails(game: IgdbGameRaw): IgdbGameDetailsDto {
  const coverUrl = game.cover?.url ? formatCoverUrl(game.cover.url) : null;

  const websiteUrls = (game.websites ?? [])
    .map((website) => (typeof website.url === "string" ? website.url : ""))
    .filter(Boolean);

  const storeLinks = extractStoreLinks(websiteUrls, game.name);

  const releaseTimestamp = game.release_dates?.[0]?.date;
  const releaseDate = releaseTimestamp
    ? new Date(releaseTimestamp * 1000).toLocaleDateString("pt-BR")
    : "";

  return {
    id: game.id,
    title: game.name,
    image: coverUrl ?? FALLBACK_GAME_IMAGE,
    synopsis: game.summary ?? "",
    genre: game.genres?.map((genre) => genre.name) ?? [],
    platform: game.platforms?.map((platform) => platform.name).join(", ") ?? "",
    releaseDate,
    website: websiteUrls[0] ?? "",
    storeLinks,
    websites: websiteUrls,
  };
}
