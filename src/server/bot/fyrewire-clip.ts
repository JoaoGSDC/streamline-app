/** Token StreaminHub no provedor FyreWire (path do endpoint de clip). */
const DEFAULT_FYREWIRE_CLIP_TOKEN_ID = "64cbbdd2a863ad42f5484dac0c049d79";

const FYREWIRE_CLIP_API_BASE =
  "https://api.thefyrewire.com/twitch/clips/create";

export function getFyrewireClipTokenId(): string {
  return (
    process.env.FYREWIRE_CLIP_TOKEN_ID?.trim() || DEFAULT_FYREWIRE_CLIP_TOKEN_ID
  );
}

/** Template com `{channel}` — equivalente a `$(channel)` em bots legados. */
export function getFyrewireClipApiUrlTemplate(): string {
  return `${FYREWIRE_CLIP_API_BASE}/${getFyrewireClipTokenId()}?channel={channel}`;
}

export function buildFyrewireClipApiUrl(channel: string): string {
  const normalized = channel.trim().toLowerCase();
  return `${FYREWIRE_CLIP_API_BASE}/${getFyrewireClipTokenId()}?channel=${encodeURIComponent(normalized)}`;
}
