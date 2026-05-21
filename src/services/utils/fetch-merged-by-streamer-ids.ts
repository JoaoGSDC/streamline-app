import { httpClient } from "@services/axios";
import { dedupeRequest } from "@services/utils/request-dedupe";

export async function fetchMergedByStreamerIds<T extends { streamerId?: string }>(
  streamerIds: string[],
  buildPath: (streamerId: string) => string,
  dedupePrefix: string
): Promise<T[]> {
  if (streamerIds.length === 0) return [];

  const results = await Promise.all(
    streamerIds.map(async (streamerId) => {
      try {
        const items = await dedupeRequest(
          `${dedupePrefix}:${streamerId}`,
          async () => {
            const response = await httpClient.get<T[]>(buildPath(streamerId));
            return Array.isArray(response.data) ? response.data : [];
          }
        );
        return items.map((entry) => ({
          ...entry,
          streamerId: entry.streamerId ?? streamerId,
        }));
      } catch {
        return [] as T[];
      }
    })
  );

  return results.flat();
}
