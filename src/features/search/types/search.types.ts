import type { IgdbSearchResultDto } from "@server/igdb/igdb.types";
import type { TwitchChannelDto } from "@server/twitch/twitch.types";

export type GameSearchResult = IgdbSearchResultDto;
export type ChannelSearchResult = TwitchChannelDto;

export type GameSearchVariant = "default" | "compact";

export interface GameSearchProps {
  onGameSelect: (game: GameSearchResult) => void;
  selectedGameId?: string;
  placeholder?: string;
  className?: string;
  variant?: GameSearchVariant;
  recentSuggestions?: GameSearchResult[];
}

export interface ChannelSearchProps {
  className?: string;
  placeholder?: string;
}
