import {
  createScheduledStreamController,
  listScheduledStreamsController,
} from "@api/internal/scheduled-streams/scheduled-streams.controller";

export const GET = listScheduledStreamsController;
export const POST = createScheduledStreamController;
