import type { CounterSource } from "./counters.types";

export interface DefaultCounterDefinition {
  slug: string;
  name: string;
  description: string;
  source: CounterSource;
  readonly: boolean;
  emoji: string;
  color: string;
  sortOrder: number;
}

/** Contadores criados automaticamente ao ativar o módulo. */
export const DEFAULT_CHANNEL_COUNTERS: DefaultCounterDefinition[] = [
  {
    slug: "followers",
    name: "Seguidores",
    description: "Total de seguidores do canal na Twitch (atualizado automaticamente).",
    source: "twitch_followers",
    readonly: true,
    emoji: "👥",
    color: "#9146FF",
    sortOrder: -100,
  },
  {
    slug: "subscribers",
    name: "Inscritos",
    description:
      "Total de inscritos do canal na Twitch (atualizado automaticamente quando disponível).",
    source: "twitch_subscribers",
    readonly: true,
    emoji: "⭐",
    color: "#9146FF",
    sortOrder: -90,
  },
];
