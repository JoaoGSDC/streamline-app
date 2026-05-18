export type StreamerProfileTab = "agenda" | "jogos";

/** Primeiro segmento após /{slug} (ex.: games, schedule). */
export function sectionToTab(section?: string[]): StreamerProfileTab {
  const first = section?.[0]?.toLowerCase();
  if (first === "games") return "jogos";
  return "agenda";
}

export function tabToPath(slug: string, tab: StreamerProfileTab): string {
  if (tab === "jogos") return `/${slug}/games`;
  return `/${slug}`;
}

export function isStreamerProfilePath(
  pathname: string,
  twitchUsername: string
): boolean {
  const base = `/${twitchUsername.toLowerCase()}`;
  const normalized = pathname.toLowerCase();
  return (
    normalized === base ||
    normalized === `${base}/games` ||
    normalized === `${base}/schedule`
  );
}
