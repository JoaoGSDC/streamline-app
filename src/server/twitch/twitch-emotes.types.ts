export interface TwitchEmoteDto {
  id: string;
  name: string;
  imageUrl1x: string;
  imageUrl2x: string;
  imageUrl4x: string;
  emoteType: string;
  /** Texto para inserir no chat (código do emote) */
  code: string;
}

export interface TwitchHelixEmoteRaw {
  id: string;
  name: string;
  images: {
    url_1x: string;
    url_2x: string;
    url_4x: string;
  };
  emote_type?: string;
  emote_set_id?: string;
}
