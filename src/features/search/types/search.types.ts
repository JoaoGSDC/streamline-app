import type { IgdbSearchResultDto } from "@server/igdb/igdb.types";
import type { TwitchChannelDto } from "@server/twitch/twitch.types";

export type GameSearchResult = IgdbSearchResultDto;
export type ChannelSearchResult = TwitchChannelDto;

export interface GameSearchProps {
  onGameSelect: (game: GameSearchResult) => void;
  selectedGameId?: string;
  placeholder?: string;
  className?: string;
}

export interface ChannelSearchProps {
  className?: string;
  placeholder?: string;
}
