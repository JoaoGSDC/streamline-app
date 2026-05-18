export type FeaturedCreator = {
  id: string;
  name: string;
  twitchUsername: string;
  avatar: string | null;
  bio: string | null;
  twitchUrl: string | null;
  partner: boolean;
  premium: boolean;
  isLive: boolean;
  gameName: string | null;
  streamTitle: string | null;
};

export type FeaturedStreamersResponse = {
  partners: FeaturedCreator[];
  premium: FeaturedCreator[];
};
