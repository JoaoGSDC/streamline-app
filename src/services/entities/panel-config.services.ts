import { httpClient } from "@services/axios";
import { ENDPOINTS } from "@services/paths";
import type { PanelFeature, PlanTier } from "@/config/panel-features";
import type { ResolvedFeatureStateResult } from "@/types/panel-config";

export type PanelFeatureState = ResolvedFeatureStateResult & {
  userEnabled: boolean;
};

export interface PanelConfigDto {
  streamerId: string;
  plan: PlanTier;
  planExpiresAt: string | null;
  features: Record<string, PanelFeatureState>;
  registry: PanelFeature[];
}

export interface PanelConfigCheckDto {
  enabled: boolean;
  locked: boolean;
  reason?: "plan" | "parent_disabled" | "coming_soon";
}

export const panelConfig = {
  get: async (): Promise<PanelConfigDto> => {
    const response = await httpClient.get<PanelConfigDto>(
      ENDPOINTS.Panel.Config
    );
    return response.data;
  },

  update: async (
    overrides: Record<string, boolean>
  ): Promise<{ success: boolean; savedKeys: number }> => {
    const response = await httpClient.put<{ success: boolean; savedKeys: number }>(
      ENDPOINTS.Panel.Config,
      { overrides }
    );
    return response.data;
  },

  check: async (featureKey: string): Promise<PanelConfigCheckDto> => {
    const response = await httpClient.get<PanelConfigCheckDto>(
      ENDPOINTS.Panel.ConfigCheck,
      { params: { feature: featureKey } }
    );
    return response.data;
  },
};
