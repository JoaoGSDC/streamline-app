export type {
  IgdbSearchResultDto,
  IgdbGameDetailsDto,
} from "@server/igdb/igdb.types";

export interface IgdbSearchResponse {
  results: import("@server/igdb/igdb.types").IgdbSearchResultDto[];
}

export interface IgdbGameDetailsResponse {
  game: import("@server/igdb/igdb.types").IgdbGameDetailsDto;
}
