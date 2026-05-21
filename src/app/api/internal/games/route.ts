import {
  createGameController,
  getGameByIdController,
} from "@api/internal/games/games.controller";

export const GET = getGameByIdController;
export const POST = createGameController;
