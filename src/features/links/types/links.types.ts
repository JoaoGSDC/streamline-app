import type { LinkPageConfig } from "@/types/link-page";
import type { StreamerSocialLink } from "@lib/streamer-social";
import type { LinkPageStreamer } from "@/components/link-page/LinkPageBlockView";

export type LinkPageSaveState = "idle" | "saving" | "saved" | "error";

export interface LinkPageBuilderSaveHandlers {
  save: () => Promise<void>;
  saving: boolean;
  saveState: LinkPageSaveState;
}

export interface LinkPageBuilderProps {
  streamerId: string;
  twitchUsername: string;
  streamer: LinkPageStreamer;
  initialLinks: StreamerSocialLink[];
  initialConfig: LinkPageConfig;
  onSaveReady?: (handlers: LinkPageBuilderSaveHandlers | null) => void;
}

export interface PublicLinkPageStreamer extends LinkPageStreamer {
  twitchUrl: string;
}
