/** Busca recursos de vários streamers em paralelo e mescla os resultados. */
export async function fetchMergedByStreamerIds<T extends { streamerId?: string }>(
  streamerIds: string[],
  buildUrl: (streamerId: string) => string
): Promise<T[]> {
  if (streamerIds.length === 0) return [];

  const results = await Promise.all(
    streamerIds.map(async (id) => {
      const res = await fetch(buildUrl(id));
      if (!res.ok) return [] as T[];
      const data = await res.json();
      if (!Array.isArray(data)) return [] as T[];
      return data.map((item: T) => ({
        ...item,
        streamerId: item.streamerId ?? id,
      }));
    })
  );

  return results.flat();
}
