"use client";

import { useCallback, useEffect, useState } from "react";
import { services } from "@services";
import type { BotActivationResponse } from "@services/entities/bot-activation.services";

export function useBotActivation() {
  const [activation, setActivation] = useState<BotActivationResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await services.botActivation.get();
      setActivation(data);
    } catch {
      setActivation(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activate = useCallback(async () => {
    setSubmitting(true);
    try {
      const data = await services.botActivation.activate();
      setActivation(data);
      return { ok: true as const, data };
    } catch (error) {
      return { ok: false as const, error };
    } finally {
      setSubmitting(false);
    }
  }, []);

  const deactivate = useCallback(async () => {
    setSubmitting(true);
    try {
      const data = await services.botActivation.deactivate();
      setActivation(data);
      return { ok: true as const, data };
    } catch (error) {
      return { ok: false as const, error };
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    activation,
    active: Boolean(activation?.active),
    loading,
    submitting,
    refresh: load,
    activate,
    deactivate,
  };
}
