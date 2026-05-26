"use client";

import { createContext, useContext } from "react";
import { useBotActivation } from "@features/bot/hooks/use-bot-activation.hook";
import type { BotActivationResponse } from "@services/entities/bot-activation.services";

interface BotActivationContextValue {
  activation: BotActivationResponse | null;
  active: boolean;
  loading: boolean;
  submitting: boolean;
  refresh: () => Promise<void>;
  activate: () => Promise<
    | { ok: true; data: BotActivationResponse }
    | { ok: false; error: unknown }
  >;
  deactivate: () => Promise<
    | { ok: true; data: BotActivationResponse }
    | { ok: false; error: unknown }
  >;
}

const BotActivationContext = createContext<BotActivationContextValue | null>(
  null
);

export function BotActivationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useBotActivation();

  return (
    <BotActivationContext.Provider value={value}>
      {children}
    </BotActivationContext.Provider>
  );
}

export function useBotActivationContext() {
  const context = useContext(BotActivationContext);
  if (!context) {
    throw new Error(
      "useBotActivationContext deve ser usado dentro de BotActivationProvider"
    );
  }
  return context;
}
