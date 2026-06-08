"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getFeature,
  PANEL_FEATURES,
  planSatisfies,
  type PanelFeature,
  type PlanTier,
} from "@/config/panel-features";
import {
  buildResolvedFeatures,
  type ResolvedFeatureStateResult,
} from "@/types/panel-config";
import { ENDPOINTS } from "@services/paths";

export type ResolvedFeatureState = ResolvedFeatureStateResult & {
  userEnabled: boolean;
};

export interface PanelConfigInitialData {
  streamerId: string;
  plan: PlanTier;
  planExpiresAt: Date | null;
  overrides: Record<string, boolean>;
  features: Record<string, ResolvedFeatureState>;
  registry: PanelFeature[];
}

interface PanelConfigContextValue {
  streamerId: string;
  plan: PlanTier;
  planExpiresAt: Date | null;
  features: Record<string, ResolvedFeatureState>;
  registry: PanelFeature[];
  isEnabled: (featureKey: string) => boolean;
  canEnable: (featureKey: string) => boolean;
  toggleFeature: (featureKey: string, enabled: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  isLoading: boolean;
  hasPremiumAccess: boolean;
}

const PanelConfigContext = createContext<PanelConfigContextValue | null>(null);

export function PanelConfigProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData: PanelConfigInitialData;
}) {
  const [streamerId, setStreamerId] = useState(initialData.streamerId);
  const [plan, setPlan] = useState(initialData.plan);
  const [planExpiresAt, setPlanExpiresAt] = useState(initialData.planExpiresAt);
  const [overrides, setOverrides] = useState(initialData.overrides);
  const [registry] = useState(initialData.registry);
  const [isLoading, setIsLoading] = useState(false);

  const features = useMemo(
    () => buildResolvedFeatures(plan, overrides),
    [plan, overrides]
  );

  const isEnabled = useCallback(
    (key: string) => features[key]?.enabled ?? false,
    [features]
  );

  const canEnable = useCallback(
    (key: string) => {
      const state = features[key];
      if (!state) return false;
      return !state.locked;
    },
    [features]
  );

  const toggleFeature = useCallback(
    async (key: string, enabled: boolean) => {
      const feature = getFeature(key);
      if (!feature || feature.isComingSoon) return;

      const previousOverrides = overrides;
      const nextOverrides = { ...overrides };

      if (enabled !== feature.defaultEnabled) {
        nextOverrides[key] = enabled;
      } else {
        delete nextOverrides[key];
      }

      setOverrides(nextOverrides);

      try {
        const response = await fetch(ENDPOINTS.Panel.Config, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ overrides: { [key]: enabled } }),
        });

        if (!response.ok) {
          throw new Error("Save failed");
        }
      } catch (error) {
        setOverrides(previousOverrides);
        console.error("Failed to save panel config", error);
        throw error;
      }
    },
    [overrides]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(ENDPOINTS.Panel.Config);
      if (!response.ok) return;

      const data = (await response.json()) as {
        streamerId: string;
        plan: PlanTier;
        planExpiresAt: string | null;
        features: Record<string, ResolvedFeatureState>;
      };

      setStreamerId(data.streamerId);
      setPlan(data.plan);
      setPlanExpiresAt(
        data.planExpiresAt ? new Date(data.planExpiresAt) : null
      );

      const nextOverrides: Record<string, boolean> = {};
      for (const feature of PANEL_FEATURES) {
        const state = data.features[feature.key];
        if (!state) continue;
        if (state.userEnabled !== feature.defaultEnabled) {
          nextOverrides[feature.key] = state.userEnabled;
        }
      }
      setOverrides(nextOverrides);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      streamerId,
      plan,
      planExpiresAt,
      features,
      registry,
      isEnabled,
      canEnable,
      toggleFeature,
      refresh,
      isLoading,
      hasPremiumAccess: planSatisfies(plan, "pro"),
    }),
    [
      streamerId,
      plan,
      planExpiresAt,
      features,
      registry,
      isEnabled,
      canEnable,
      toggleFeature,
      refresh,
      isLoading,
    ]
  );

  return (
    <PanelConfigContext.Provider value={value}>
      {children}
    </PanelConfigContext.Provider>
  );
}

export function usePanelConfig() {
  const ctx = useContext(PanelConfigContext);
  if (!ctx) {
    throw new Error("usePanelConfig must be used inside PanelConfigProvider");
  }
  return ctx;
}

export function PanelConfigStreamerSync({
  initialStreamerId,
}: {
  initialStreamerId: string;
}) {
  const { refresh } = usePanelConfig();
  const lastStreamerId = useRef(initialStreamerId);

  useEffect(() => {
    function onActingAsChanged(event: Event) {
      const detail = (event as CustomEvent<{ streamerId: string }>).detail;
      if (!detail?.streamerId) return;
      if (detail.streamerId === lastStreamerId.current) return;
      lastStreamerId.current = detail.streamerId;
      void refresh();
    }

    window.addEventListener("admin:acting-as-changed", onActingAsChanged);
    return () => {
      window.removeEventListener("admin:acting-as-changed", onActingAsChanged);
    };
  }, [refresh]);

  return null;
}
