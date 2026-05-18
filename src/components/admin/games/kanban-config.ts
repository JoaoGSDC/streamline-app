export const STATUS_OPTIONS = [
  { value: "to_play", label: "Para jogar" },
  { value: "playing", label: "Jogando" },
  { value: "finished", label: "Concluídos" },
  { value: "dropped", label: "Droppados" },
] as const;

export type KanbanStatus = (typeof STATUS_OPTIONS)[number]["value"];

export type KanbanColumnKey = KanbanStatus;

export const KANBAN_COLUMNS: {
  key: KanbanColumnKey;
  title: string;
  accent: string;
  emptyTitle: string;
  emptyHint: string;
}[] = [
  {
    key: "to_play",
    title: "Para jogar",
    accent: "hsl(var(--electric-cyan-glow))",
    emptyTitle: "Nada na fila",
    emptyHint: "Adicione jogos ou arraste cards para cá",
  },
  {
    key: "playing",
    title: "Jogando",
    accent: "hsl(var(--neon-purple-glow))",
    emptyTitle: "Nenhum jogo ativo",
    emptyHint: "Arraste um jogo para começar",
  },
  {
    key: "finished",
    title: "Concluídos",
    accent: "hsl(var(--status-online))",
    emptyTitle: "Nada zerado ainda",
    emptyHint: "Marque jogos como concluídos",
  },
  {
    key: "dropped",
    title: "Droppados",
    accent: "hsl(var(--destructive))",
    emptyTitle: "Nenhum drop",
    emptyHint: "Jogos que você abandonou",
  },
];

export function statusLabel(status: KanbanStatus) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}
