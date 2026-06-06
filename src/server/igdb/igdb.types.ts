export interface IgdbGameRaw {
  id: number;
  name: string;
  cover?: { url: string };
  screenshots?: Array<{ url: string }>;
  summary?: string;
  genres?: Array<{ name: string }>;
  platforms?: Array<{ name: string }>;
  release_dates?: Array<{ date: number }>;
  websites?: Array<{ url: string }>;
  videos?: Array<{ video_id: string }>;
}

export interface IgdbSearchResultDto {
  id: number;
  name: string;
  cover?: { url: string };
  summary?: string;
  genres?: string[];
  platforms?: string[];
  releaseYear?: number | null;
}

export interface IgdbGameDetailsDto {
  id: number;
  title: string;
  image: string;
  synopsis: string;
  genre: string[];
  platform: string;
  releaseDate: string;
  website: string;
  storeLinks: Array<{ name: string; url: string }>;
  websites: string[];
}

export interface IgdbStoreLinkDto {
  name: string;
  url: string;
}
