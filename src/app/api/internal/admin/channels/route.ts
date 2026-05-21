import { NextRequest } from "next/server";
import {
  listAdminChannelsController,
  switchAdminChannelController,
} from "@api/internal/admin/channels.controller";

export const GET = listAdminChannelsController;

export const POST = switchAdminChannelController;
