export function createImageUrlFormatter(defaultProtocol = "https") {
  return function formatImageUrl(url: string): string {
    if (!url) return "";
    if (url.startsWith("//")) return `${defaultProtocol}:${url}`;
    if (url.startsWith("http")) return url;
    return `${defaultProtocol}://${url}`;
  };
}

export function createIgdbCoverUrlFormatter() {
  return function formatIgdbCoverUrl(url: string, size: "thumb" | "cover_big" = "cover_big"): string {
    if (!url) return "";
    const normalized = url.startsWith("//") ? `https:${url}` : url;
    if (size === "cover_big") {
      return normalized.replace("t_thumb", "t_cover_big");
    }
    return normalized;
  };
}
