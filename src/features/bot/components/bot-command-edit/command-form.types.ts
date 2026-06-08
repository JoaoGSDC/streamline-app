import type { BotCommandRowState } from "@features/bot/types/bot-command.types";

export interface CommandFormBinding {
  command: BotCommandRowState;
  onChange: (patch: Partial<BotCommandRowState>) => void;
  disabled?: boolean;
  triggerError?: string | null;
}
