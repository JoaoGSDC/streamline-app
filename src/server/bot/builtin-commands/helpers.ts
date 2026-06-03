import type {
  BotBuiltinCategory,
  BotBuiltinCommandDefinition,
  BotBuiltinExecutionKind,
  BotBuiltinMinRole,
} from "./types";
import {
  DEFAULT_MOD_STREAMER_CONFIRMATION_PROMPT,
  LEGACY_RUNTIME_RESPONSE_PLACEHOLDER,
} from "./types";

interface BuiltinBaseOptions {
  description: string;
  defaultCooldownSeconds?: number;
  argsHint?: string;
  runtimeNotes?: string;
  externalApiUrlTemplate?: string;
  customizableResponse?: boolean;
  defaultResponse?: string;
  responseTemplate?: string;
  requiresConfirmation?: boolean;
  confirmationPrompt?: string;
}

function builtin(
  key: string,
  trigger: string,
  category: BotBuiltinCategory,
  executionKind: BotBuiltinExecutionKind,
  minRole: BotBuiltinMinRole,
  options: BuiltinBaseOptions
): BotBuiltinCommandDefinition {
  const customizableResponse =
    options.customizableResponse ?? executionKind === "static";

  const defaultResponse =
    options.defaultResponse ??
    (customizableResponse ? "" : "");

  return {
    key,
    trigger,
    category,
    executionKind,
    minRole,
    description: options.description,
    argsHint: options.argsHint,
    runtimeNotes: options.runtimeNotes,
    externalApiUrlTemplate: options.externalApiUrlTemplate,
    customizableResponse,
    defaultCooldownSeconds: options.defaultCooldownSeconds ?? 15,
    defaultResponse,
    responseTemplate: options.responseTemplate,
    requiresConfirmation: options.requiresConfirmation,
    confirmationPrompt: options.confirmationPrompt,
  };
}

export function generalRuntime(
  key: string,
  trigger: string,
  options: BuiltinBaseOptions & { responseTemplate: string }
) {
  return builtin(key, trigger, "general", "runtime", "everyone", options);
}

export function generalStatic(
  key: string,
  trigger: string,
  defaultResponse: string,
  options: BuiltinBaseOptions
) {
  return builtin(key, trigger, "general", "static", "everyone", {
    ...options,
    defaultResponse,
    responseTemplate: options.responseTemplate ?? defaultResponse,
    customizableResponse: options.customizableResponse ?? true,
  });
}

export function raffleRuntime(
  key: string,
  trigger: string,
  options: BuiltinBaseOptions & { responseTemplate: string }
) {
  return builtin(key, trigger, "raffles", "runtime", "everyone", options);
}

export function modAction(
  key: string,
  trigger: string,
  options: BuiltinBaseOptions & {
    responseTemplate: string;
    confirmationPrompt?: string;
  }
) {
  return builtin(key, trigger, "moderator", "mod_action", "moderator", {
    ...options,
    requiresConfirmation: true,
    confirmationPrompt:
      options.confirmationPrompt ?? DEFAULT_MOD_STREAMER_CONFIRMATION_PROMPT,
    defaultCooldownSeconds: options.defaultCooldownSeconds ?? 5,
  });
}

export function streamerAction(
  key: string,
  trigger: string,
  options: BuiltinBaseOptions & {
    responseTemplate: string;
    confirmationPrompt?: string;
  }
) {
  return builtin(key, trigger, "streamer", "streamer_action", "streamer", {
    ...options,
    requiresConfirmation: true,
    confirmationPrompt:
      options.confirmationPrompt ?? DEFAULT_MOD_STREAMER_CONFIRMATION_PROMPT,
    defaultCooldownSeconds: options.defaultCooldownSeconds ?? 10,
  });
}

export function isLegacyRuntimePlaceholder(response: string | null | undefined) {
  return response?.trim() === LEGACY_RUNTIME_RESPONSE_PLACEHOLDER;
}
