/**
 * @deprecated Use @server/igdb ou services.igdb (BFF).
 * Mantido para compatibilidade durante a migração arquitetural.
 */
import { igdbServerService } from "@server/igdb/igdb.service";
import { createImageUrlFormatter } from "@utils/factories/create-image-url-formatter";

export const searchGames = igdbServerService.searchGames;
export const getGameDetails = igdbServerService.getGameDetails;

export async function getGameById(id: number) {
  return igdbServerService.getGameDetails(id);
}

const formatImageUrl = createImageUrlFormatter();

export const formatGameImageUrl = formatImageUrl;

/** @deprecated Cliente axios legado — não usar no frontend */
export const igdbClient = null;
