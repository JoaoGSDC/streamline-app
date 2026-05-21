/**
 * @deprecated Use @server/auth/twitch-oauth.service e services.auth.twitch (BFF).
 * Mantido para compatibilidade durante a migração.
 */
import {
  buildTwitchAuthorizeUrl,
  createOAuthState,
} from "@server/auth/twitch-oauth.service";

export const TWITCH_CLIENT_ID = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID || "";
export const TWITCH_REDIRECT_URI =
  process.env.NEXT_PUBLIC_TWITCH_REDIRECT_URI ||
  "http://localhost:3000/api/auth/twitch/callback";

/** @deprecated Use services.auth.twitch.getAuthorizeUrl() */
export const getTwitchAuthUrl = (): string => {
  return buildTwitchAuthorizeUrl(createOAuthState());
};

/** @deprecated Token exchange só no servidor */
export const exchangeTwitchCode = async (_code: string): Promise<never> => {
  throw new Error("exchangeTwitchCode must run on server — use OAuth callback route");
};

/** @deprecated User fetch só no servidor */
export const getTwitchUserInfo = async (_accessToken: string): Promise<never> => {
  throw new Error("getTwitchUserInfo must run on server — use OAuth callback route");
};
