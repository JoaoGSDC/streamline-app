import { HttpError } from "@server/utils/http-error";
import type { StreamerSocialLink } from "@lib/streamer-social";

export function sanitizeSocialLinksPayload(
  rawLinks: unknown
): StreamerSocialLink[] {
  if (!Array.isArray(rawLinks)) {
    throw new HttpError("links deve ser um array", 400, "VALIDATION_ERROR");
  }

  const sanitizedLinks = rawLinks
    .map((rawLink) => {
      const link = rawLink as {
        id?: string;
        label?: string;
        url?: string;
        platformId?: string;
        iconColor?: string;
      };

      const entry: StreamerSocialLink = {
        label: String(link.label ?? "").trim(),
        url: String(link.url ?? "").trim(),
      };

      const linkId = String(link.id ?? "").trim();
      const platformId = String(link.platformId ?? "").trim();
      const iconColor = String(link.iconColor ?? "").trim();

      if (linkId) entry.id = linkId;
      if (platformId) entry.platformId = platformId;
      if (iconColor) entry.iconColor = iconColor;

      return entry;
    })
    .filter((link) => link.label && link.url);

  for (const link of sanitizedLinks) {
    try {
      const parsedUrl = new URL(link.url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new HttpError("URLs devem usar http ou https", 400, "VALIDATION_ERROR");
      }
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(`URL inválida: ${link.label}`, 400, "VALIDATION_ERROR");
    }
  }

  return sanitizedLinks;
}
