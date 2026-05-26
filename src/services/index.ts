import { auth } from "./entities/auth.services";
import { games } from "./entities/games.services";
import { socialLinks } from "./entities/social-links.services";
import { igdb } from "./entities/igdb.services";
import { scheduledStreams } from "./entities/scheduled-streams.services";
import { streamerGames } from "./entities/streamer-games.services";
import { twitch } from "./entities/twitch.services";
import { streamers } from "./entities/streamers.services";
import { botCommands } from "./entities/bot-commands.services";
import { botTimers } from "./entities/bot-timers.services";
import { botBlacklist } from "./entities/bot-blacklist.services";
import { botActivation } from "./entities/bot-activation.services";
import { botStatus } from "./entities/bot-status.services";
import { botVariables } from "./entities/bot-variables.services";
import { botEmotes } from "./entities/bot-emotes.services";
import {
  GameService,
  ScheduledStreamService,
  StorageService,
  StreamerService,
} from "./entities/legacy-local-storage.services";

export { httpClient } from "./axios";
export { ENDPOINTS } from "./paths";

export {
  StorageService,
  StreamerService,
  GameService,
  ScheduledStreamService,
};

export { fetchMergedByStreamerIds } from "./utils/fetch-merged-by-streamer-ids";

export const services = {
  auth,
  igdb,
  twitch,
  scheduledStreams,
  streamerGames,
  games,
  socialLinks,
  streamers,
  botCommands,
  botTimers,
  botBlacklist,
  botActivation,
  botStatus,
  botVariables,
  botEmotes,
  gamesLegacy: GameService,
  scheduledStreamsLegacy: ScheduledStreamService,
} as const;
