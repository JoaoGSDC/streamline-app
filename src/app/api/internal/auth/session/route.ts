import { NextRequest } from "next/server";
import {
  getSessionController,
  logoutSessionController,
} from "@api/internal/auth/session.controller";

export const GET = getSessionController;
export const DELETE = logoutSessionController;
