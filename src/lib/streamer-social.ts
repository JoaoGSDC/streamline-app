export function getStreamerSocialLinks(bio: string, twitchUrl: string) {
  const links: { label: string; url: string }[] = [
    { label: "Twitch", url: twitchUrl },
  ];

  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const found = bio.match(urlRegex) ?? [];

  for (const raw of found) {
    const url = raw.replace(/[.,;:!?)]+$/, "");
    if (url.includes("twitch.tv")) continue;
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      links.push({ label: host, url });
    } catch {
      /* ignore */
    }
  }

  return links;
}
