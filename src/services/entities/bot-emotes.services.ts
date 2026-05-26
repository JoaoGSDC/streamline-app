import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";

export interface TwitchChannelEmote {
  id: string;
  name: string;
  imageUrl1x: string;
  imageUrl2x: string;
  imageUrl4x: string;
  emoteType: string;
  code: string;
}

export interface BotEmotesResponse {
  channel: string;
  emotes: TwitchChannelEmote[];
}

export const botEmotes = {
  listChannel: async (): Promise<BotEmotesResponse> => {
    const response = await httpClient.get<BotEmotesResponse>(
      ENDPOINTS.Internal.Bot.Emotes
    );
    return response.data ?? { channel: "", emotes: [] };
  },
};
