import {
  createStreamerGameController,
  listStreamerGamesController,
} from "@api/internal/streamer-games/streamer-games.controller";

export const GET = listStreamerGamesController;
export const POST = createStreamerGameController;
